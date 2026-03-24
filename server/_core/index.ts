import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { startWeeklyDigestCron } from "../weeklyDigest";
import { startWeeklyAnalyticsCron } from "../weeklyAnalytics";
import { startDailyAlertCron } from "../dailyAlert";
import { startInactivityAlertCron } from "../inactivityAlert";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// Rate limiter for AI endpoints (LLM cost protection)
const aiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // max 20 AI calls per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please wait a moment before trying again.",
  },
  skip: req => {
    // Skip rate limiting for localhost in development
    const ip = req.ip || req.socket.remoteAddress || "";
    return (
      process.env.NODE_ENV === "development" &&
      (ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1")
    );
  },
});

// General API rate limiter
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // max 500 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Trust the first proxy hop (required when running behind Manus reverse proxy)
  app.set("trust proxy", 1);

  // Security headers (helmet)
  app.use(
    helmet({
      // Allow Vite HMR in development
      contentSecurityPolicy: process.env.NODE_ENV === "production",
      crossOriginEmbedderPolicy: false, // needed for OAuth iframe flows
    })
  );

  // Body parser — 10mb for normal JSON, 50mb only for upload routes
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // Apply general rate limit to all API routes
  app.use("/api/", apiRateLimit);

  // Apply stricter rate limit to AI procedures
  app.use("/api/trpc/ai.", aiRateLimit);

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // Start background jobs
  startWeeklyDigestCron();
  startWeeklyAnalyticsCron();
  startDailyAlertCron();
  startInactivityAlertCron();
}

startServer().catch(console.error);

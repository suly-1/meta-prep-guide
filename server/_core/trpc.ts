import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "@shared/const";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { ENV } from "./env";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  // Auto-unblock: if blockedUntil has passed, lift the block before checking
  const user = ctx.user as {
    blocked?: number;
    blockedUntil?: Date | null;
    id?: number;
  };

  if (user.blocked === 1 && user.blockedUntil && user.id) {
    const expiry = new Date(user.blockedUntil);
    if (expiry <= new Date()) {
      // Expiry has passed — auto-unblock in DB (fire-and-forget, non-fatal)
      try {
        const db = await getDb();
        if (db) {
          await db
            .update(users)
            .set({ blocked: 0, blockReason: null, blockedUntil: null })
            .where(eq(users.id, user.id));
          console.log(
            `[Auth] Auto-unblocked user #${user.id} (blockedUntil expired)`
          );
          // Treat as unblocked for this request
          user.blocked = 0;
        }
      } catch (err) {
        console.warn("[Auth] Auto-unblock failed:", err);
        // Fall through — still enforce the block if DB update failed
      }
    }
  }

  // Block access for users flagged by the owner
  if (user.blocked === 1) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "ACCESS_REVOKED",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  })
);

/**
 * ownerProcedure — only the account whose openId matches OWNER_OPEN_ID
 * can call this. Use for highly sensitive data (disclaimer audit log, etc.).
 */
export const ownerProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }

    if (!ENV.ownerOpenId || ctx.user.openId !== ENV.ownerOpenId) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  })
);

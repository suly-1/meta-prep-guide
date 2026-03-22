import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { collabRouter } from "./routers/collab";
import { leaderboardRouter } from "./routers/leaderboard";
import { ctciRouter } from "./routers/ctci";
import { aiRouter } from "./routers/ai";
import { onboardingRouter } from "./routers/onboarding";
import { ratingsRouter } from "./routers/ratings";
import { ctciProgressRouter } from "./routers/ctciProgress";
import { mockHistoryRouter } from "./routers/mockHistory";
import { disclaimerRouter } from "./routers/disclaimer";
import { deployStatusRouter } from "./routers/deployStatus";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  ctci: ctciRouter,
  ai: aiRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  collab: collabRouter,
  leaderboard: leaderboardRouter,
  onboarding: onboardingRouter,
  ratings: ratingsRouter,
  ctciProgress: ctciProgressRouter,
  mockHistory: mockHistoryRouter,
  disclaimer: disclaimerRouter,
  deployStatus: deployStatusRouter,
});

export type AppRouter = typeof appRouter;

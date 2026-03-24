import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
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
import { feedbackRouter } from "./routers/feedback";
import { userScoresRouter } from "./routers/userScores";
import { sprintPlanRouter } from "./routers/sprintPlan";
import { analyticsRouter } from "./routers/analytics";
import { favoritesRouter } from "./routers/favorites";
import { progressRouter } from "./routers/progress";
import { siteAccessRouter } from "./routers/siteAccess";
import { adminUsersRouter } from "./routers/adminUsers";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  ctci: ctciRouter,
  ai: aiRouter,
  auth: router({
    me: publicProcedure.query(opts => {
      const u = opts.ctx.user;
      if (!u) return null;
      // Omit openId from the public response — it's an internal OAuth identifier
      // that should not be exposed to the frontend or logged in browser devtools.
      const { openId: _openId, loginMethod: _loginMethod, ...safeUser } = u;
      // Include blocked flag so the frontend BlockedGate can redirect blocked users
      return safeUser;
    }),
    /** Returns whether the current user is the site owner (OWNER_OPEN_ID match). */
    isOwner: protectedProcedure.query(({ ctx }) => {
      return {
        isOwner: !!ENV.ownerOpenId && ctx.user.openId === ENV.ownerOpenId,
      };
    }),
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
  feedback: feedbackRouter,
  userScores: userScoresRouter,
  sprintPlan: sprintPlanRouter,
  analytics: analyticsRouter,
  favorites: favoritesRouter,
  progress: progressRouter,
  siteAccess: siteAccessRouter,
  adminUsers: adminUsersRouter,
});

export type AppRouter = typeof appRouter;

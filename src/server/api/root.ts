import { postRouter } from "~/server/api/routers/post";
import { authRouter } from "~/server/api/routers/auth";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { vaultRouter } from "./routers/vault";
import { recipientsRouter } from "./routers/recipients";
import { recipientAccessRouter } from "./routers/recipientAccess";
import { triggerRouter } from "./routers/trigger";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  auth: authRouter,
  vault: vaultRouter,
  recipients: recipientsRouter,
  recipientAccess: recipientAccessRouter,
  trigger: triggerRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);

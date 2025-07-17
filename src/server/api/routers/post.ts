import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  // Example: Get user's profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return {
      id: ctx.session.user.id,
      email: ctx.session.user.email,
      username: ctx.session.user.username,
      isAdmin: ctx.session.user.isAdmin,
    };
  }),

  // This will be replaced with actual vault functionality later
  getLatest: protectedProcedure.query(async ({ ctx }) => {
    // Placeholder for now
    return null;
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
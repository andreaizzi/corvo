import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "~/server/api/trpc";
import {
    createUser,
    updatePassword,
    verifyUserEmail,
    deactivateUser,
    registerSchema,
    passwordSchema,
} from "~/server/auth/utils";

export const authRouter = createTRPCRouter({
    // Register a new user
    register: publicProcedure
        .input(registerSchema)
        .mutation(async ({ input }) => {
            try {
                const user = await createUser({
                    email: input.email,
                    password: input.password,
                    username: input.username,
                    fullName: input.fullName,
                });

                return {
                    success: true,
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                    },
                };
            } catch (error) {
                if (error instanceof Error) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: error.message,
                    });
                }
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to create user",
                });
            }
        }),

    // Get current user session
    getSession: publicProcedure.query(async ({ ctx }) => {
        return ctx.session;
    }),

    // Get current user profile
    getProfile: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.db.query.users.findFirst({
            where: (users, { eq }) => eq(users.id, ctx.session.user.id),
            with: {
                // userPreferences: true,
                // checkInConfig: true,
            },
        });

        if (!user) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "User not found",
            });
        }

        return {
            id: user.id,
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            avatarUrl: user.avatarUrl,
            emailVerified: user.emailVerified,
            isAdmin: user.isAdmin,
            isActive: user.isActive,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
            // preferences: user.userPreferences,
            // checkInConfig: user.checkInConfig,
        };
    }),

    // Update password
    updatePassword: protectedProcedure
        .input(
            z.object({
                currentPassword: z.string(),
                newPassword: passwordSchema,
            })
        )
        .mutation(async ({ ctx, input }) => {
            // First verify the current password
            const user = await ctx.db.query.users.findFirst({
                where: (users, { eq }) => eq(users.id, ctx.session.user.id),
            });

            if (!user?.passwordHash) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "User not found",
                });
            }

            const bcrypt = await import("bcryptjs");
            const validPassword = await bcrypt.compare(
                input.currentPassword,
                user.passwordHash
            );

            if (!validPassword) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Current password is incorrect",
                });
            }

            // Update to new password
            await updatePassword(ctx.session.user.id, input.newPassword);

            return { success: true };
        }),

    // Verify email
    verifyEmail: protectedProcedure
        .input(
            z.object({
                token: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // In a real implementation, you would verify the token
            // For now, we'll just mark the email as verified
            await verifyUserEmail(ctx.session.user.id);

            return { success: true };
        }),

    // Deactivate account
    deactivateAccount: protectedProcedure
        .input(
            z.object({
                password: z.string(),
                reason: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Verify password before deactivation
            const user = await ctx.db.query.users.findFirst({
                where: (users, { eq }) => eq(users.id, ctx.session.user.id),
            });

            if (!user?.passwordHash) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "User not found",
                });
            }

            const bcrypt = await import("bcryptjs");
            const validPassword = await bcrypt.compare(
                input.password,
                user.passwordHash
            );

            if (!validPassword) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Password is incorrect",
                });
            }

            // Deactivate the account
            await deactivateUser(ctx.session.user.id);

            return { success: true };
        }),
});
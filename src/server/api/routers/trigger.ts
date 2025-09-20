import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { sendRecipientNotificationEmail } from "~/lib/email/recipientNotification";
import { decryptAccessCode } from "~/lib/encryption/recipientEncryption";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
    recipients
} from "~/server/db/schema";

export const triggerRouter = createTRPCRouter({
    // Manually activate trigger for a user (for testing/admin purposes)
    activateTrigger: protectedProcedure
        .input(
            z.object({
                userId: z.string().uuid().optional(), // If not provided, use current user
                testMode: z.boolean().default(true), // In test mode, don't actually send emails
            })
        )
        .mutation(async ({ ctx, input }) => {
            const targetUserId = input.userId ?? ctx.session.user.id;

            // Verify the user has admin rights or is activating their own trigger
            if (targetUserId !== ctx.session.user.id && !ctx.session.user.isAdmin) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You can only activate your own trigger",
                });
            }

            // Get all recipients for this user
            const userRecipients = await ctx.db.query.recipients.findMany({
                where: eq(recipients.userId, targetUserId),
                with: {
                    recipientFileKeys: true,
                },
            });

            if (userRecipients.length === 0) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "No recipients found for this user",
                });
            }

            const activationResults = [];

            // Process each recipient
            for (const recipient of userRecipients) {
                if (!recipient.accessCodeEncrypted) {
                    activationResults.push({
                        recipientId: recipient.id,
                        recipientName: recipient.fullName,
                        status: "error",
                        message: "No access code generated",
                    });
                    continue;
                }

                // Skip if already activated
                // TODO: Redefine isActive meaning and logic
                if (recipient.isActive) {
                    activationResults.push({
                        recipientId: recipient.id,
                        recipientName: recipient.fullName,
                        status: "already_active",
                        message: "Access code already activated",
                    });
                    continue;
                }

                // Check if recipient has any files assigned
                if (recipient.recipientFileKeys.length === 0) {
                    activationResults.push({
                        recipientId: recipient.id,
                        recipientName: recipient.fullName,
                        status: "no_files",
                        message: "No files assigned to recipient",
                    });
                    continue;
                }

                try {
                    // Decrypt access code
                    const accessCode = await decryptAccessCode({
                        encrypted: recipient.accessCodeEncrypted,
                        iv: recipient.encryptionIv,
                    });


                    // Activate the access code
                    await ctx.db
                        .update(recipients)
                        .set({
                            isActive: true,
                            activatedAt: new Date(),
                        })
                        .where(eq(recipients.id, recipient.id));

                    // Send notification email (unless in test mode)
                    if (!input.testMode) {
                        await sendRecipientNotificationEmail({
                            recipientEmail: recipient.email,
                            recipientName: recipient.fullName,
                            accessCode,
                            fileCount: recipient.recipientFileKeys.length,
                        });
                    }

                    activationResults.push({
                        recipientId: recipient.id,
                        recipientName: recipient.fullName,
                        status: "success",
                        message: input.testMode
                            ? "Activated (email not sent - test mode)"
                            : "Activated and email sent",
                        accessUrl: `${process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'}/vault/access`,
                        accessCode,
                    });
                } catch (error) {
                    console.error(`Failed to activate recipient ${recipient.id}:`, error);
                    activationResults.push({
                        recipientId: recipient.id,
                        recipientName: recipient.fullName,
                        status: "error",
                        message: error instanceof Error ? error.message : "Unknown error",
                    });
                }
            }

            return {
                success: true,
                results: activationResults,
            };
        }),

    // Get trigger status for a user
    getTriggerStatus: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        // Get all recipients with their access codes
        const userRecipients = await ctx.db.query.recipients.findMany({
            where: eq(recipients.userId, userId),
            with: {
                recipientFileKeys: true,
            },
        });

        return {
            userId,
            totalRecipients: userRecipients.length,
            activeRecipients: userRecipients.filter(r => r.isActive).length,
            readyForActivation: true, // TODO: Implement?
            recipients: userRecipients.map(r => ({
                id: r.id,
                fullName: r.fullName,
                email: r.email,
                hasAccessCode: !!r.accessCodeEncrypted,
                isActive: r.isActive ?? false,
                activatedAt: r.activatedAt,
                fileCount: r.recipientFileKeys.length ?? 0,
            })),
        };
    }),

    // Deactivate all triggers (for testing)
    deactivateAllTriggers: protectedProcedure.mutation(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        // Deactivate all active recipients for this user in one query
        const result = await ctx.db
            .update(recipients)
            .set({
                isActive: false,
                activatedAt: null,
            })
            .where(
                and(
                    eq(recipients.userId, userId),
                    eq(recipients.isActive, true)
                )
            );

        return {
            success: true,
            deactivatedCount: result.entries.length ?? 0,
        };
    }),
});
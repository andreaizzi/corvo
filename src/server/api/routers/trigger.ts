import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
    recipients,
    recipientAccessCodes,
    recipientFileKeys,
    users,
} from "~/server/db/schema";
import { decryptAccessCode } from "~/lib/encryption/recipientEncryption";
import { sendRecipientNotificationEmail } from "~/lib/email/recipientNotification";

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
                    accessCode: {
                        with: {
                            recipientFileKeys: true,
                        },
                    },
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
                if (!recipient.accessCode) {
                    activationResults.push({
                        recipientId: recipient.id,
                        recipientName: recipient.fullName,
                        status: "error",
                        message: "No access code generated",
                    });
                    continue;
                }

                // Skip if already activated
                if (recipient.accessCode.isActive) {
                    activationResults.push({
                        recipientId: recipient.id,
                        recipientName: recipient.fullName,
                        status: "already_active",
                        message: "Access code already activated",
                    });
                    continue;
                }

                // Check if recipient has any files assigned
                if (recipient.accessCode.recipientFileKeys.length === 0) {
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
                        encrypted: recipient.accessCode.accessCodeEncrypted,
                        iv: recipient.accessCode.encryptionIv,
                    });

                    // Activate the access code
                    await ctx.db
                        .update(recipientAccessCodes)
                        .set({
                            isActive: true,
                            activatedAt: new Date(),
                        })
                        .where(eq(recipientAccessCodes.id, recipient.accessCode.id));

                    // Send notification email (unless in test mode)
                    if (!input.testMode) {
                        await sendRecipientNotificationEmail({
                            recipientEmail: recipient.email,
                            recipientName: recipient.fullName,
                            accessCode,
                            fileCount: recipient.accessCode.recipientFileKeys.length,
                        });
                    }

                    activationResults.push({
                        recipientId: recipient.id,
                        recipientName: recipient.fullName,
                        status: "success",
                        message: input.testMode
                            ? "Activated (email not sent - test mode)"
                            : "Activated and email sent",
                        accessUrl: `${process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'}/access/${accessCode}`,
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
                accessCode: {
                    with: {
                        recipientFileKeys: true,
                    },
                },
            },
        });

        const totalRecipients = userRecipients.length;
        const recipientsWithAccessCodes = userRecipients.filter(r => r.accessCode).length;
        const activatedRecipients = userRecipients.filter(r => r.accessCode?.isActive).length;
        const recipientsWithFiles = userRecipients.filter(
            r => r.accessCode && r.accessCode.recipientFileKeys.length > 0
        ).length;

        return {
            totalRecipients,
            recipientsWithAccessCodes,
            activatedRecipients,
            recipientsWithFiles,
            readyForActivation: recipientsWithFiles > 0 && activatedRecipients === 0,
            recipients: userRecipients.map(r => ({
                id: r.id,
                name: r.fullName,
                email: r.email,
                hasAccessCode: !!r.accessCode,
                isActive: r.accessCode?.isActive ?? false,
                activatedAt: r.accessCode?.activatedAt,
                fileCount: r.accessCode?.recipientFileKeys.length ?? 0,
            })),
        };
    }),

    // Deactivate all triggers (for testing)
    deactivateAllTriggers: protectedProcedure.mutation(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        // Get all recipient access codes for this user
        const userRecipients = await ctx.db.query.recipients.findMany({
            where: eq(recipients.userId, userId),
            with: {
                accessCode: true,
            },
        });

        const accessCodeIds = userRecipients
            .filter(r => r.accessCode?.isActive)
            .map(r => r.accessCode!.id);

        if (accessCodeIds.length === 0) {
            return { success: true, deactivatedCount: 0 };
        }

        // Deactivate all access codes
        await ctx.db
            .update(recipientAccessCodes)
            .set({
                isActive: false,
                activatedAt: null,
            })
            .where(
                and(
                    eq(recipientAccessCodes.isActive, true),
                    inArray(recipientAccessCodes.id, accessCodeIds)
                )
            );

        return {
            success: true,
            deactivatedCount: accessCodeIds.length,
        };
    }),
});
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import * as fs from "fs/promises";
import { z } from "zod";
import {
    decryptAccessCode
} from "~/lib/encryption/recipientEncryption";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
    recipientAccessLogs,
    recipientFileKeys,
    recipients
} from "~/server/db/schema";

export const recipientAccessRouter = createTRPCRouter({
    // Login with email and access code
    login: publicProcedure
        .input(
            z.object({
                email: z.string().email(),
                accessCode: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Find recipient by email
            const recipient = await ctx.db.query.recipients.findFirst({
                where: eq(recipients.email, input.email)
            });

            if (!recipient?.accessCodeEncrypted) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Invalid email or access code",
                });
            }

            // Check if access code is active
            if (!recipient.isActive) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Access not yet granted. The legacy has not been activated.",
                });
            }

            // Decrypt the stored access code
            const storedAccessCode = await decryptAccessCode({
                encrypted: recipient.accessCodeEncrypted,
                iv: recipient.encryptionIv,
            });

            // Compare access codes
            if (storedAccessCode !== input.accessCode) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Invalid email or access code",
                });
            }

            // Return recipient info and salt for key derivation
            return {
                recipientId: recipient.id,
                recipientName: recipient.fullName,
                recipientEmail: recipient.email,
                activatedAt: recipient.activatedAt,
                codeSalt: recipient.codeSalt,
            };
        }),

    // Get files for authenticated recipient
    getFiles: publicProcedure
        .input(
            z.object({
                recipientId: z.string().uuid(),
            })
        )
        .query(async ({ ctx, input }) => {
            // Verify the recipient is active
            const recipient = await ctx.db.query.recipients.findFirst({
                where: and(
                    eq(recipients.id, input.recipientId),
                    eq(recipients.isActive, true)
                ),
                with: {
                    recipientFileKeys: {
                        with: {
                            vaultItem: true,
                        },
                    },
                },
            });

            if (!recipient) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Invalid session",
                });
            }

            // Return file list
            const files = recipient.recipientFileKeys
                .filter(rfk => rfk.vaultItem && !rfk.vaultItem.deletedAt)
                .map(rfk => ({
                    id: rfk.vaultItem.id,
                    title: rfk.vaultItem.title,
                    fileName: rfk.vaultItem.fileName,
                    fileSize: rfk.vaultItem.fileSize,
                    fileType: rfk.vaultItem.fileType,
                    uploadedAt: rfk.vaultItem.createdAt,
                }));

            return files;
        }),

    // Download file for authenticated recipient
    downloadFile: publicProcedure
        .input(
            z.object({
                recipientId: z.string().uuid(),
                fileId: z.string().uuid(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Verify access
            const fileKey = await ctx.db.query.recipientFileKeys.findFirst({
                where: and(
                    eq(recipientFileKeys.recipientId, input.recipientId),
                    eq(recipientFileKeys.vaultItemId, input.fileId)
                ),
                with: {
                    vaultItem: true,
                    recipient: true
                },
            });

            if (!fileKey) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Access denied",
                });
            }

            const vaultItem = fileKey.vaultItem;
            if (!vaultItem?.filePath) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "File not found",
                });
            }

            // Log access
            await ctx.db.insert(recipientAccessLogs).values({
                recipientId: input.recipientId,
                vaultItemId: input.fileId,
                accessType: "download",
                ipAddress: ctx.headers.get("x-forwarded-for") ?? "unknown",
                userAgent: ctx.headers.get("user-agent") ?? "unknown",
            });

            // Read encrypted file
            try {
                const encryptedData = await fs.readFile(vaultItem.filePath);
                const encryptedBase64 = encryptedData.toString("base64");

                return {
                    encryptedData: encryptedBase64,
                    fileName: vaultItem.fileName,
                    fileType: vaultItem.fileType,
                    fileIv: vaultItem.encryptionIv?.split(":")[0] ?? "",
                    wrappedFileKey: fileKey.encryptedFileKey,
                    wrapIv: fileKey.encryptionIv,
                };
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to read file",
                });
            }
        }),
});
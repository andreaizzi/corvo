import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
    recipients,
    recipientAccessCodes,
    recipientFileKeys,
    vaultItems
} from "~/server/db/schema";
import {
    generateAccessCode,
    encryptAccessCode,
    decryptAccessCode,
    deriveRecipientKey,
    wrapFileKeyForRecipient,
} from "~/lib/encryption/recipientEncryption";
import {
    base64ToArrayBuffer,
    generateRandomBytes,
    arrayBufferToBase64,
    clientEncryption
} from "~/lib/encryption/encryption";

export const recipientsRouter = createTRPCRouter({
    // Create a new recipient
    create: protectedProcedure
        .input(
            z.object({
                email: z.string().email(),
                fullName: z.string().min(1).max(255),
                phoneNumber: z.string().optional(),
                relationship: z.string().optional(),
                notes: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Check if recipient already exists
            const existing = await ctx.db.query.recipients.findFirst({
                where: and(
                    eq(recipients.userId, userId),
                    eq(recipients.email, input.email)
                ),
            });

            if (existing) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Recipient with this email already exists",
                });
            }

            // Create recipient
            const [recipient] = await ctx.db
                .insert(recipients)
                .values({
                    userId,
                    ...input,
                })
                .returning();

            if (!recipient) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to create recipient",
                });
            }

            // Generate and encrypt access code
            const accessCode = generateAccessCode();
            console.log("Generated access code:", accessCode);
            const recipientSalt = generateRandomBytes(16);

            // Encrypt access code with system master key
            const { encrypted, iv } = await encryptAccessCode(accessCode);

            // Store encrypted access code
            await ctx.db.insert(recipientAccessCodes).values({
                recipientId: recipient.id,
                accessCodeEncrypted: encrypted,
                encryptionIv: iv,
                codeSalt: arrayBufferToBase64(recipientSalt.buffer),
                isActive: false,
            });

            return recipient;
        }),

    // Get all recipients for the user
    getAll: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        const userRecipients = await ctx.db.query.recipients.findMany({
            where: eq(recipients.userId, userId),
            with: {
                accessCode: true,
            },
            orderBy: (recipients, { asc }) => [asc(recipients.fullName)],
        });

        // Count assigned files for each recipient
        const recipientsWithCounts = await Promise.all(
            userRecipients.map(async (recipient) => {
                if (!recipient.accessCode) {
                    return { ...recipient, assignedFilesCount: 0 };
                }

                const fileKeys = await ctx.db.query.recipientFileKeys.findMany({
                    where: eq(recipientFileKeys.accessCodeId, recipient.accessCode.id),
                });

                return {
                    ...recipient,
                    assignedFilesCount: fileKeys.length,
                };
            })
        );

        return recipientsWithCounts;
    }),

    // Get a single recipient
    get: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            const recipient = await ctx.db.query.recipients.findFirst({
                where: and(
                    eq(recipients.id, input.id),
                    eq(recipients.userId, userId)
                ),
                with: {
                    accessCode: {
                        with: {
                            recipientFileKeys: {
                                with: {
                                    vaultItem: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!recipient) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Recipient not found",
                });
            }

            return recipient;
        }),

    // Update recipient
    update: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                email: z.string().email().optional(),
                fullName: z.string().min(1).max(255).optional(),
                phoneNumber: z.string().nullable().optional(),
                relationship: z.string().nullable().optional(),
                notes: z.string().nullable().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Verify ownership
            const existing = await ctx.db.query.recipients.findFirst({
                where: and(
                    eq(recipients.id, input.id),
                    eq(recipients.userId, userId)
                ),
            });

            if (!existing) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Recipient not found",
                });
            }

            // Update recipient
            const { id, ...updateData } = input;
            const [updated] = await ctx.db
                .update(recipients)
                .set(updateData)
                .where(eq(recipients.id, id))
                .returning();

            return updated;
        }),

    // Delete recipient
    delete: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Verify ownership
            const recipient = await ctx.db.query.recipients.findFirst({
                where: and(
                    eq(recipients.id, input.id),
                    eq(recipients.userId, userId)
                ),
            });

            if (!recipient) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Recipient not found",
                });
            }

            // Delete recipient (cascade will handle access codes and file keys)
            await ctx.db.delete(recipients).where(eq(recipients.id, input.id));

            return { success: true };
        }),

    // Assign file to recipient
/*     assignFile: protectedProcedure
        .input(
            z.object({
                recipientId: z.string().uuid(),
                fileId: z.string().uuid(),
                userPassword: z.string(), // Need user password to decrypt file key
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Verify recipient ownership
            const recipient = await ctx.db.query.recipients.findFirst({
                where: and(
                    eq(recipients.id, input.recipientId),
                    eq(recipients.userId, userId)
                ),
                with: {
                    accessCode: true,
                },
            });

            if (!recipient) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Recipient not found",
                });
            }

            // Verify file ownership
            const file = await ctx.db.query.vaultItems.findFirst({
                where: and(
                    eq(vaultItems.id, input.fileId),
                    eq(vaultItems.userId, userId),
                    eq(vaultItems.itemType, "file"),
                    isNull(vaultItems.deletedAt)
                ),
            });

            if (!file) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "File not found",
                });
            }

            // Ensure recipient has access code
            if (!recipient.accessCode) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Recipient access code not found",
                });
            }

            // Check if file already assigned
            const existing = await ctx.db.query.recipientFileKeys.findFirst({
                where: and(
                    eq(recipientFileKeys.accessCodeId, recipient.accessCode.id),
                    eq(recipientFileKeys.vaultItemId, input.fileId)
                ),
            });

            if (existing) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "File already assigned to this recipient",
                });
            }

            // Get recipient's access code
            const accessCode = await decryptAccessCode({
                encrypted: recipient.accessCode.accessCodeEncrypted,
                iv: recipient.accessCode.encryptionIv,
            });

            // Derive recipient key
            const recipientSalt = new Uint8Array(
                base64ToArrayBuffer(recipient.accessCode.codeSalt)
            );
            const recipientKey = await deriveRecipientKey(accessCode, recipientSalt);

            // Parse file encryption metadata
            if (!file.encryptionIv || !file.wrappedKeyUser || !file.keyDerivationSalt) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "File encryption metadata missing",
                });
            }

            const [fileIvBase64, wrapIvBase64] = file.encryptionIv.split(":");
            const wrapIv = new Uint8Array(base64ToArrayBuffer(wrapIvBase64));

            // Note: In production, you'd verify the user's password and derive their key
            // For now, we'll assume the client has already provided the unwrapped file key
            // This is a simplification - in reality, you'd need to handle this more securely

            // Generate new IV for recipient wrapping
            const recipientWrapIv = generateRandomBytes(12);

            // For this implementation, we'll need the client to send the file key
            // In a production system, you might handle this differently
            throw new TRPCError({
                code: "NOT_IMPLEMENTED",
                message: "File assignment requires client-side key unwrapping. Use assignFileWithKey instead.",
            });
        }),
 */
    // Assign file with already unwrapped key (called from client after unwrapping)
    assignFileWithKey: protectedProcedure
        .input(
            z.object({
                recipientId: z.string().uuid(),
                fileId: z.string().uuid(),
                fileKeyBase64: z.string(), // Base64 encoded raw file key
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Verify recipient ownership
            const recipient = await ctx.db.query.recipients.findFirst({
                where: and(
                    eq(recipients.id, input.recipientId),
                    eq(recipients.userId, userId)
                ),
                with: {
                    accessCode: true,
                },
            });

            if (!recipient?.accessCode) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Recipient or access code not found",
                });
            }

            // Verify file ownership
            const file = await ctx.db.query.vaultItems.findFirst({
                where: and(
                    eq(vaultItems.id, input.fileId),
                    eq(vaultItems.userId, userId),
                    isNull(vaultItems.deletedAt)
                ),
            });

            if (!file) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "File not found",
                });
            }

            // Check if already assigned
            const existing = await ctx.db.query.recipientFileKeys.findFirst({
                where: and(
                    eq(recipientFileKeys.accessCodeId, recipient.accessCode.id),
                    eq(recipientFileKeys.vaultItemId, input.fileId)
                ),
            });

            if (existing) {
                return { success: true, alreadyAssigned: true };
            }

            // Import the file key
            const fileKeyBuffer = base64ToArrayBuffer(input.fileKeyBase64);
            const fileKey = await crypto.subtle.importKey(
                'raw',
                fileKeyBuffer,
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );

            // Get recipient's access code
            const accessCode = await decryptAccessCode({
                encrypted: recipient.accessCode.accessCodeEncrypted,
                iv: recipient.accessCode.encryptionIv,
            });

            // Derive recipient key
            const recipientSalt = new Uint8Array(
                base64ToArrayBuffer(recipient.accessCode.codeSalt)
            );
            const recipientKey = await deriveRecipientKey(accessCode, recipientSalt);

            // Wrap file key with recipient key
            const recipientWrapIv = generateRandomBytes(12);
            const wrappedFileKey = await wrapFileKeyForRecipient(
                fileKey,
                recipientKey,
                recipientWrapIv
            );

            // Store encrypted file key
            await ctx.db.insert(recipientFileKeys).values({
                accessCodeId: recipient.accessCode.id,
                vaultItemId: input.fileId,
                encryptedFileKey: arrayBufferToBase64(wrappedFileKey),
                encryptionIv: arrayBufferToBase64(recipientWrapIv.buffer),
            });

            return { success: true, alreadyAssigned: false };
        }),

    // Remove file assignment
    unassignFile: protectedProcedure
        .input(
            z.object({
                recipientId: z.string().uuid(),
                fileId: z.string().uuid(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Verify recipient ownership
            const recipient = await ctx.db.query.recipients.findFirst({
                where: and(
                    eq(recipients.id, input.recipientId),
                    eq(recipients.userId, userId)
                ),
                with: {
                    accessCode: true,
                },
            });

            if (!recipient?.accessCode) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Recipient not found",
                });
            }

            // Delete the file key assignment
            await ctx.db
                .delete(recipientFileKeys)
                .where(
                    and(
                        eq(recipientFileKeys.accessCodeId, recipient.accessCode.id),
                        eq(recipientFileKeys.vaultItemId, input.fileId)
                    )
                );

            return { success: true };
        }),

    // Get files assigned to a recipient
    getAssignedFiles: protectedProcedure
        .input(z.object({ recipientId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Verify recipient ownership
            const recipient = await ctx.db.query.recipients.findFirst({
                where: and(
                    eq(recipients.id, input.recipientId),
                    eq(recipients.userId, userId)
                ),
                with: {
                    accessCode: {
                        with: {
                            recipientFileKeys: {
                                with: {
                                    vaultItem: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!recipient?.accessCode) {
                return [];
            }

            return recipient.accessCode.recipientFileKeys
                .filter(rfk => rfk.vaultItem && !rfk.vaultItem.deletedAt)
                .map(rfk => ({
                    id: rfk.vaultItem!.id,
                    title: rfk.vaultItem!.title,
                    fileName: rfk.vaultItem!.fileName,
                    fileSize: rfk.vaultItem!.fileSize,
                    fileType: rfk.vaultItem!.fileType,
                    createdAt: rfk.vaultItem!.createdAt,
                    assignedAt: rfk.createdAt,
                }));
        }),
});
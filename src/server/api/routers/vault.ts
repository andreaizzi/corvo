import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { and, eq, isNull } from "drizzle-orm";
import * as fs from "fs/promises";
import * as path from "path";
import { z } from "zod";
import { arrayBufferToBase64, ENCRYPTION_CONFIG, generateRandomBytes } from "~/lib/encryption/encryption";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { categories, users, vaultItems } from "~/server/db/schema";

// Storage configuration
const STORAGE_BASE_PATH = path.join(process.cwd(), "storage", "vault");

// Ensure storage directory exists
async function ensureStorageDir(userId: string) {
    const userDir = path.join(STORAGE_BASE_PATH, userId);
    await fs.mkdir(userDir, { recursive: true });
    return userDir;
}

export const vaultRouter = createTRPCRouter({
    getUserSalt: protectedProcedure
        .query(async ({ ctx }) => {
            const userId = ctx.session.user.id;

            const user = await ctx.db.query.users.findFirst({
                where: eq(users.id, userId),
            });

            if (!user) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "User not found",
                });
            }

            // If user doesn't have a salt yet, generate one
            if (!user.keyDerivationSalt) {
                const salt = generateRandomBytes(ENCRYPTION_CONFIG.saltLength);
                const saltBase64 = arrayBufferToBase64(salt.buffer as ArrayBuffer);

                await ctx.db
                    .update(users)
                    .set({ keyDerivationSalt: saltBase64 })
                    .where(eq(users.id, userId));

                return saltBase64;
            }

            return user.keyDerivationSalt;
        }),

    // Create a new vault item (file upload)
    createFile: protectedProcedure
        .input(
            z.object({
                categoryId: z.string().uuid().optional(),
                title: z.string().min(1).max(255),
                description: z.string().optional(),
                fileName: z.string(),
                fileSize: z.number(),
                fileType: z.string(),
                encryptedData: z.string(), // Base64 encoded encrypted file
                encryptionIv: z.string(),
                wrappedFileKey: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Ensure storage directory exists
            const userDir = await ensureStorageDir(userId);

            // Create vault item record
            const [vaultItem] = await ctx.db
                .insert(vaultItems)
                .values({
                    userId,
                    categoryId: input.categoryId,
                    itemType: "file",
                    title: input.title,
                    description: input.description,
                    fileName: input.fileName,
                    fileSize: input.fileSize,
                    fileType: input.fileType,
                    filePath: "", // Will be updated after file is saved
                    encryptionAlgorithm: "AES-256-GCM",
                    encryptionIv: input.encryptionIv,
                    wrappedFileKey: input.wrappedFileKey,
                })
                .returning();

            if (!vaultItem) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to create vault item",
                });
            }

            // Save encrypted file to disk
            const filePath = path.join(userDir, `${vaultItem.id}.enc`);
            const encryptedBuffer = Buffer.from(input.encryptedData, "base64");
            await fs.writeFile(filePath, encryptedBuffer);

            // Update vault item with file path
            await ctx.db
                .update(vaultItems)
                .set({ filePath })
                .where(eq(vaultItems.id, vaultItem.id));

            return { ...vaultItem, filePath };
        }),

    // Get all vault items for the user
    getFiles: protectedProcedure
        .input(
            z.object({
                categoryId: z.string().uuid().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            const user = await ctx.db.query.users.findFirst({
                where: eq(users.id, userId),
                columns: { keyDerivationSalt: true },
            });

            const conditions = [
                eq(vaultItems.userId, userId),
                eq(vaultItems.itemType, "file"),
                isNull(vaultItems.deletedAt),
            ];

            if (input.categoryId) {
                conditions.push(eq(vaultItems.categoryId, input.categoryId));
            }

            const files = await ctx.db.query.vaultItems.findMany({
                where: and(...conditions),
                orderBy: (items, { desc }) => [desc(items.createdAt)],
                with: {
                    recipientFileKeys: {
                        with: {
                            recipient: true,
                        },
                    },
                },
            });

            return files.map((file) => ({
                ...file,
                keyDerivationSalt: user?.keyDerivationSalt ?? "",
                recipients: file.recipientFileKeys.map((fileKey) => ({
                    id: fileKey.recipient.id,
                    email: fileKey.recipient.email,
                    fullName: fileKey.recipient.fullName,
                    phoneNumber: fileKey.recipient.phoneNumber,
                    relationship: fileKey.recipient.relationship,
                    isActive: fileKey.recipient.isActive,
                    activatedAt: fileKey.recipient.activatedAt,
                })),
            }));
        }),

    // Get a single file with encryption metadata
    getFile: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            const user = await ctx.db.query.users.findFirst({
                where: eq(users.id, userId),
                columns: { keyDerivationSalt: true },
            });

            const file = await ctx.db.query.vaultItems.findFirst({
                where: and(
                    eq(vaultItems.id, input.id),
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

            /* return {
                id: file.id,
                title: file.title,
                description: file.description,
                fileName: file.fileName,
                fileSize: file.fileSize,
                fileType: file.fileType,
                encryptionIv: file.encryptionIv,
                wrappedFileKey: file.wrappedFileKey,
                keyDerivationSalt: file.keyDerivationSalt,
            }; */

            return {
                ...file,
                keyDerivationSalt: user?.keyDerivationSalt ?? ""
            };
        }),

    // Download file (get encrypted content)
    downloadFile: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            const user = await ctx.db.query.users.findFirst({
                where: eq(users.id, userId),
                columns: { keyDerivationSalt: true },
            });

            const file = await ctx.db.query.vaultItems.findFirst({
                where: and(
                    eq(vaultItems.id, input.id),
                    eq(vaultItems.userId, userId),
                    eq(vaultItems.itemType, "file"),
                    isNull(vaultItems.deletedAt)
                ),
            });

            if (!file?.filePath) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "File not found",
                });
            }

            // Read encrypted file from disk
            try {
                const encryptedData = await fs.readFile(file.filePath);
                const encryptedBase64 = encryptedData.toString("base64");

                // Update last accessed timestamp
                await ctx.db
                    .update(vaultItems)
                    .set({ lastAccessedAt: new Date() })
                    .where(eq(vaultItems.id, input.id));

                return {
                    encryptedData: encryptedBase64,
                    fileName: file.fileName,
                    fileType: file.fileType,
                    encryptionIv: file.encryptionIv,
                    wrappedFileKey: file.wrappedFileKey,
                    keyDerivationSalt: user?.keyDerivationSalt ?? ""
                };
            } catch {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to read file",
                });
            }
        }),

    // Update file metadata
    updateFile: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                title: z.string().min(1).max(255).optional(),
                description: z.string().optional(),
                categoryId: z.string().uuid().nullable().optional(),
                isFavorite: z.boolean().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Verify ownership
            const file = await ctx.db.query.vaultItems.findFirst({
                where: and(
                    eq(vaultItems.id, input.id),
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

            // Update file
            const { id, ...updateData } = input;
            await ctx.db
                .update(vaultItems)
                .set(updateData)
                .where(eq(vaultItems.id, id));

            return { success: true };
        }),

    // Delete file (soft delete)
    deleteFile: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Verify ownership
            const file = await ctx.db.query.vaultItems.findFirst({
                where: and(
                    eq(vaultItems.id, input.id),
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

            // Soft delete
            await ctx.db
                .update(vaultItems)
                .set({ deletedAt: new Date() })
                .where(eq(vaultItems.id, input.id));

            return { success: true };
        }),

    // Verify user password (for encryption key derivation)
    verifyPassword: protectedProcedure
        .input(z.object({ password: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Get user with password hash
            const user = await ctx.db.query.users.findFirst({
                where: eq(users.id, userId),
            });

            if (!user?.passwordHash) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "User not found",
                });
            }

            // Verify password
            const isValid = await bcrypt.compare(input.password, user.passwordHash);

            if (!isValid) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Invalid password",
                });
            }

            return { valid: true };
        }),

    // Get categories
    getCategories: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        const userCategories = await ctx.db.query.categories.findMany({
            where: eq(categories.userId, userId),
            orderBy: (cats, { asc }) => [asc(cats.position), asc(cats.name)],
        });

        return userCategories;
    }),

    // Create category
    createCategory: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1).max(100),
                description: z.string().optional(),
                icon: z.string().optional(),
                color: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            const [category] = await ctx.db
                .insert(categories)
                .values({
                    userId,
                    ...input,
                })
                .returning();

            return category;
        }),
});
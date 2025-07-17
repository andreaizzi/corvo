import bcrypt from "bcryptjs";
import { db } from "~/server/db";
import { users, userPreferences } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Validation schemas
export const registerSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    username: z.string().min(3, "Username must be at least 3 characters").optional(),
    fullName: z.string().min(1, "Full name is required").optional(),
});

export const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

// Hash password
export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
}

// Compare password with hash
export async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// Create a new user
export async function createUser({
    email,
    password,
    username,
    fullName,
}: {
    email: string;
    password: string;
    username?: string;
    fullName?: string;
}) {
    try {
        // Check if user already exists
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (existingUser) {
            throw new Error("User with this email already exists");
        }

        // Check if username is taken
        if (username) {
            const existingUsername = await db.query.users.findFirst({
                where: eq(users.username, username),
            });

            if (existingUsername) {
                throw new Error("Username is already taken");
            }
        }

        // Hash the password
        const passwordHash = await hashPassword(password);

        // Create the user
        const [newUser] = await db
            .insert(users)
            .values({
                email,
                passwordHash,
                username,
                fullName,
                emailVerified: null, // Email not verified yet
                isActive: true,
                isAdmin: false,
            })
            .returning();

        if (!newUser) {
            throw new Error("Failed to create user");
        }

        // Create default user preferences
        await db.insert(userPreferences).values({
            userId: newUser.id,
        });

        // Create default check-in configuration
        /* await db.insert(checkInConfigs).values({
            userId: newUser.id,
        }); */

        return {
            id: newUser.id,
            email: newUser.email,
            username: newUser.username,
            fullName: newUser.fullName,
        };
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
}

// Update user password
export async function updatePassword(userId: string, newPassword: string) {
    try {
        const passwordHash = await hashPassword(newPassword);

        await db
            .update(users)
            .set({ passwordHash })
            .where(eq(users.id, userId));

        return true;
    } catch (error) {
        console.error("Error updating password:", error);
        throw error;
    }
}

// Verify user email
export async function verifyUserEmail(userId: string) {
    try {
        await db
            .update(users)
            .set({
                emailVerified: new Date(),
            })
            .where(eq(users.id, userId));

        return true;
    } catch (error) {
        console.error("Error verifying email:", error);
        throw error;
    }
}

// Deactivate user account
export async function deactivateUser(userId: string) {
    try {
        await db
            .update(users)
            .set({
                isActive: false,
                deletedAt: new Date(),
            })
            .where(eq(users.id, userId));

        return true;
    } catch (error) {
        console.error("Error deactivating user:", error);
        throw error;
    }
}

// Reactivate user account
export async function reactivateUser(userId: string) {
    try {
        await db
            .update(users)
            .set({
                isActive: true,
                deletedAt: null,
            })
            .where(eq(users.id, userId));

        return true;
    } catch (error) {
        console.error("Error reactivating user:", error);
        throw error;
    }
}
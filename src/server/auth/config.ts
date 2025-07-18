import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "~/server/db";
import {
  accounts,
  users,
} from "~/server/db/schema";
import { eq } from "drizzle-orm";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;
      username?: string | null;
      isAdmin: boolean;
      isActive: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    email?: string | null;
    username?: string | null;
    isAdmin?: boolean;
    isActive?: boolean;
  }
}

// Validation schema for credentials
const credentialsSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "email@example.com",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        try {
          // Validate input
          const { email, password } = credentialsSchema.parse(credentials);

          // Find user by email
          const user = await db.query.users.findFirst({
            where: eq(users.email, email),
          });

          if (!user?.passwordHash) {
            return null;
          }

          // Check if user is active
          if (!user.isActive) {
            throw new Error("Account is deactivated");
          }

          // Verify password
          const passwordValid = await bcrypt.compare(password, user.passwordHash);
          if (!passwordValid) {
            return null;
          }

          // Update last login timestamp
          await db
            .update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, user.id));

          return {
            id: user.id,
            email: user.email,
            name: user.fullName ?? user.username,
            image: user.avatarUrl,
            username: user.username,
            isAdmin: user.isAdmin ?? false,
            isActive: user.isActive ?? true,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    // The following tables are prepared for future implementation
    // https://authjs.dev/getting-started/adapters/drizzle#passing-your-own-schemas
    // sessionsTable: sessions,
    // verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: "jwt", // Required for credentials provider
  },
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.username = user.username;
        token.isAdmin = user.isAdmin;
        token.isActive = user.isActive;
      }
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.id as string,
        email: token.email as string,
        username: token.username as string | null,
        isAdmin: token.isAdmin as boolean,
        isActive: token.isActive as boolean,
      },
    }),
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/new-user",
  },
} satisfies NextAuthConfig;
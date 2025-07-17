import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

// Enable UUID extension for PostgreSQL
export const enableUuid = sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
export const enablePgcrypto = sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM.
 * Use the same database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `corvo_${name}`);

// =====================================================
// USER MANAGEMENT SYSTEM
// =====================================================

// Core users table (updated to match your schema while keeping NextAuth compatibility)
export const users = createTable(
  "user",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).unique().notNull(),
    username: varchar("username", { length: 100 }).unique(),
    passwordHash: varchar("password_hash", { length: 255 }),
    fullName: varchar("full_name", { length: 255 }),
    avatarUrl: text("avatar_url"),
    emailVerified: timestamp("email_verified", {
      mode: "date",
      withTimezone: true,
    }),
    isActive: boolean("is_active").default(true),
    isAdmin: boolean("is_admin").default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    // NextAuth compatibility fields
    name: varchar("name", { length: 255 }),
    image: varchar("image", { length: 255 }),
  },
  (t) => [
    index("idx_users_email").on(t.email),
    index("idx_users_username").on(t.username),
    index("idx_users_active").on(t.isActive).where(sql`${t.isActive} = true`),
  ]
);

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("t_user_id_idx").on(t.userId)],
);

// NextAuth accounts table (for OAuth providers)
export const accounts = createTable(
  "account",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ]
);

// Email verification tokens
export const emailVerificationTokens = createTable(
  "email_verification_token",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).unique().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (t) => [index("idx_email_verification_token").on(t.token)]
);

// Password reset tokens
export const passwordResetTokens = createTable(
  "password_reset_token",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).unique().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (t) => [index("idx_password_reset_token").on(t.token)]
);

// User preferences
export const userPreferences = createTable("user_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .unique()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  notificationEmail: boolean("notification_email").default(true),
  notificationSms: boolean("notification_sms").default(false),
  notificationPush: boolean("notification_push").default(false),
  timezone: varchar("timezone", { length: 100 }).default("UTC"),
  language: varchar("language", { length: 10 }).default("en"),
  theme: varchar("theme", { length: 20 }).default("light"),
  securityAlerts: boolean("security_alerts").default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// NextAuth verification tokens
export const verificationTokens = createTable(
  "verification_token",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
);

// =====================================================
// ADMINISTRATION & MONITORING
// =====================================================

// System configuration
export const systemConfig = createTable("system_config", {
  id: uuid("id").defaultRandom().primaryKey(),
  configKey: varchar("config_key", { length: 255 }).unique().notNull(),
  configValue: text("config_value").notNull(),
  configType: varchar("config_type", { length: 50 }).notNull(), // 'string', 'number', 'boolean', 'json'
  description: text("description"),
  isEncrypted: boolean("is_encrypted").default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});
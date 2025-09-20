import { sql, relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
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
export const createTable = pgTableCreator((name) => `${name}`);

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
    keyDerivationSalt: text("key_derivation_salt"),
  },
  (t) => [
    index("idx_users_email").on(t.email),
    index("idx_users_username").on(t.username),
    index("idx_users_active").on(t.isActive).where(sql`${t.isActive} = true`),
  ]
);

/*// NextAuth sessions table

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
); */

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
/* export const emailVerificationTokens = createTable(
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
); */

// Password reset tokens
/* export const passwordResetTokens = createTable(
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
); */

// User preferences
/*
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
});*/

// NextAuth verification tokens for magic links
/* export const verificationTokens = createTable(
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
); */

// =====================================================
// ADMINISTRATION & MONITORING
// =====================================================

// System configuration
/* export const systemConfig = createTable("system_config", {
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
}); */

// Categories table
export const categories = createTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    icon: varchar("icon", { length: 50 }),
    color: varchar("color", { length: 7 }),
    isDefault: boolean("is_default").default(false),
    position: integer("position").default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (t) => [
    uniqueIndex("idx_categories_user_name").on(t.userId, t.name),
    index("idx_categories_user").on(t.userId),
  ]
);

// Tags table
export const tags = createTable(
  "tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 50 }).notNull(),
    color: varchar("color", { length: 7 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (t) => [
    uniqueIndex("idx_tags_user_name").on(t.userId, t.name),
    index("idx_tags_user").on(t.userId),
  ]
);

// Vault items table
export const vaultItems = createTable(
  "vault_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    itemType: varchar("item_type", { length: 50 }).notNull(), // 'file', 'note', 'message', 'credential'
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    contentEncrypted: text("content_encrypted"), // For notes/messages

    // File-specific fields
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileSize: bigint("file_size", { mode: "number" }).notNull(),
    fileType: varchar("file_type", { length: 100 }).notNull(),
    filePath: text("file_path").notNull(),
    thumbnailPath: text("thumbnail_path"),

    // Encryption-specific fields
    encryptionAlgorithm: varchar("encryption_algorithm", { length: 50 }).default("AES-256-GCM"),
    encryptionIv: text("encryption_iv").notNull(),
    wrappedFileKey: text("wrapped_key_user").notNull(),

    metadata: jsonb("metadata"),
    isFavorite: boolean("is_favorite").default(false).notNull(),
    recipientAccessCount: integer("recipient_access_count").default(0).notNull(),
    lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("idx_vault_items_user").on(t.userId),
    index("idx_vault_items_category").on(t.categoryId),
    index("idx_vault_items_type").on(t.itemType),
    index("idx_vault_items_created").on(t.createdAt),
  ]
);

// Vault item tags junction table
export const vaultItemTags = createTable(
  "vault_item_tags",
  {
    vaultItemId: uuid("vault_item_id")
      .notNull()
      .references(() => vaultItems.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.vaultItemId, t.tagId] }),
    index("idx_vault_item_tags_item").on(t.vaultItemId),
    index("idx_vault_item_tags_tag").on(t.tagId),
  ]
);

// =====================================================
// RECIPIENT MANAGEMENT SYSTEM
// =====================================================

// Recipients table - stores recipient information
export const recipients = createTable(
  "recipients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    phoneNumber: varchar("phone_number", { length: 50 }),
    relationship: varchar("relationship", { length: 100 }),
    notes: text("notes"),

    // Access code fields (merged from recipient_access_codes)
    accessCodeEncrypted: text("access_code_encrypted").notNull(),
    encryptionIv: text("encryption_iv").notNull(),
    codeSalt: text("code_salt").notNull(), // Salt for recipient key derivation
    isActive: boolean("is_active").default(false),
    activatedAt: timestamp("activated_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (t) => [
    uniqueIndex("idx_recipients_user_email").on(t.userId, t.email),
    index("idx_recipients_user").on(t.userId),
    index("idx_recipients_email").on(t.email),
  ]
);


// Recipient file keys - file keys encrypted with recipient's key
export const recipientFileKeys = createTable(
  "recipient_file_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => recipients.id, { onDelete: "cascade" }),
    vaultItemId: uuid("vault_item_id")
      .notNull()
      .references(() => vaultItems.id, { onDelete: "cascade" }),

    // File key encrypted with recipient's key
    encryptedFileKey: text("encrypted_file_key").notNull(),
    encryptionIv: text("encryption_iv").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (t) => [
    uniqueIndex("idx_recipient_file_keys_unique").on(t.recipientId, t.vaultItemId),
    index("idx_recipient_file_keys_recipient").on(t.recipientId),
    index("idx_recipient_file_keys_vault_item").on(t.vaultItemId),
  ]
);

// Recipient access logs - audit trail for recipient access
export const recipientAccessLogs = createTable(
  "recipient_access_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => recipients.id, { onDelete: "cascade" }),
    vaultItemId: uuid("vault_item_id")
      .notNull()
      .references(() => vaultItems.id, { onDelete: "cascade" }),
    accessType: varchar("access_type", { length: 50 }).notNull(), // 'view', 'download'
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    accessGranted: boolean("access_granted").default(true),
    denialReason: varchar("denial_reason", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (t) => [
    index("idx_recipient_access_logs_recipient").on(t.recipientId),
    index("idx_recipient_access_logs_vault_item").on(t.vaultItemId),
    index("idx_recipient_access_logs_created").on(t.createdAt),
  ]
);

// =====================================================
// RELATIONS
// =====================================================

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  // One-to-many: User has many sessions
  // sessions: many(sessions),
  // One-to-many: User has many accounts (OAuth providers)
  accounts: many(accounts),
  // One-to-many: User has many email verification tokens
  // emailVerificationTokens: many(emailVerificationTokens),
  // One-to-many: User has many password reset tokens
  // passwordResetTokens: many(passwordResetTokens),
  // One-to-one: User has one user preferences
  // userPreferences: one(userPreferences),
  categories: many(categories),
  tags: many(tags),
  vaultItems: many(vaultItems),
  recipients: many(recipients),
}));

// Session relations
/* export const sessionsRelations = relations(sessions, ({ one }) => ({
  // Many-to-one: Session belongs to one user
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
})); */

// Account relations
export const accountsRelations = relations(accounts, ({ one }) => ({
  // Many-to-one: Account belongs to one user
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

// Email verification token relations
/* export const emailVerificationTokensRelations = relations(emailVerificationTokens, ({ one }) => ({
  // Many-to-one: Token belongs to one user
  user: one(users, {
    fields: [emailVerificationTokens.userId],
    references: [users.id],
  }),
})); */

// Password reset token relations
/* export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  // Many-to-one: Token belongs to one user
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
})); */

// User preferences relations
/* export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  // One-to-one: Preferences belong to one user
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
})); */

// Categories relations
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  vaultItems: many(vaultItems),
}));

// Tags relations
export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
  vaultItemTags: many(vaultItemTags),
}));

// Vault items relations
export const vaultItemsRelations = relations(vaultItems, ({ one, many }) => ({
  user: one(users, {
    fields: [vaultItems.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [vaultItems.categoryId],
    references: [categories.id],
  }),
  vaultItemTags: many(vaultItemTags),
  recipientFileKeys: many(recipientFileKeys),
}));

// Vault item tags relations
export const vaultItemTagsRelations = relations(vaultItemTags, ({ one }) => ({
  vaultItem: one(vaultItems, {
    fields: [vaultItemTags.vaultItemId],
    references: [vaultItems.id],
  }),
  tag: one(tags, {
    fields: [vaultItemTags.tagId],
    references: [tags.id],
  }),
}));

// Recipients relations
export const recipientsRelations = relations(recipients, ({ one, many }) => ({
  user: one(users, {
    fields: [recipients.userId],
    references: [users.id],
  }),
  recipientFileKeys: many(recipientFileKeys),
  accessLogs: many(recipientAccessLogs),
}));

// Recipient file keys relations
export const recipientFileKeysRelations = relations(recipientFileKeys, ({ one }) => ({
  recipient: one(recipients, {
    fields: [recipientFileKeys.recipientId],
    references: [recipients.id],
  }),
  vaultItem: one(vaultItems, {
    fields: [recipientFileKeys.vaultItemId],
    references: [vaultItems.id],
  }),
}));

// Recipient access logs relations
export const recipientAccessLogsRelations = relations(recipientAccessLogs, ({ one }) => ({
  recipient: one(recipients, {
    fields: [recipientAccessLogs.recipientId],
    references: [recipients.id],
  }),
  vaultItem: one(vaultItems, {
    fields: [recipientAccessLogs.vaultItemId],
    references: [vaultItems.id],
  }),
}));
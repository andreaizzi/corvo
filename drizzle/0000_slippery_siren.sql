CREATE TABLE "corvo_account" (
	"user_id" uuid NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "corvo_account_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "corvo_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"icon" varchar(50),
	"color" varchar(7),
	"is_default" boolean DEFAULT false,
	"position" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corvo_email_verification_token" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "corvo_email_verification_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "corvo_password_reset_token" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "corvo_password_reset_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "corvo_system_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"config_key" varchar(255) NOT NULL,
	"config_value" text NOT NULL,
	"config_type" varchar(50) NOT NULL,
	"description" text,
	"is_encrypted" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "corvo_system_config_config_key_unique" UNIQUE("config_key")
);
--> statement-breakpoint
CREATE TABLE "corvo_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"color" varchar(7),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corvo_user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"notification_email" boolean DEFAULT true,
	"notification_sms" boolean DEFAULT false,
	"notification_push" boolean DEFAULT false,
	"timezone" varchar(100) DEFAULT 'UTC',
	"language" varchar(10) DEFAULT 'en',
	"theme" varchar(20) DEFAULT 'light',
	"security_alerts" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "corvo_user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "corvo_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(100),
	"password_hash" varchar(255),
	"full_name" varchar(255),
	"avatar_url" text,
	"email_verified" timestamp with time zone,
	"is_active" boolean DEFAULT true,
	"is_admin" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"last_login_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"name" varchar(255),
	"image" varchar(255),
	CONSTRAINT "corvo_user_email_unique" UNIQUE("email"),
	CONSTRAINT "corvo_user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "corvo_vault_item_tags" (
	"vault_item_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "corvo_vault_item_tags_vault_item_id_tag_id_pk" PRIMARY KEY("vault_item_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "corvo_vault_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category_id" uuid,
	"item_type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"content_encrypted" text,
	"file_name" varchar(255),
	"file_size" bigint,
	"file_type" varchar(100),
	"file_path" text,
	"thumbnail_path" text,
	"metadata" jsonb,
	"is_favorite" boolean DEFAULT false,
	"recipient_access_count" integer DEFAULT 0,
	"last_accessed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp with time zone,
	"encryption_algorithm" varchar(50) DEFAULT 'AES-256-GCM',
	"encryption_iv" text,
	"wrapped_key_user" text,
	"key_derivation_salt" text
);
--> statement-breakpoint
ALTER TABLE "corvo_account" ADD CONSTRAINT "corvo_account_user_id_corvo_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."corvo_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corvo_categories" ADD CONSTRAINT "corvo_categories_user_id_corvo_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."corvo_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corvo_email_verification_token" ADD CONSTRAINT "corvo_email_verification_token_user_id_corvo_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."corvo_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corvo_password_reset_token" ADD CONSTRAINT "corvo_password_reset_token_user_id_corvo_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."corvo_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corvo_tags" ADD CONSTRAINT "corvo_tags_user_id_corvo_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."corvo_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corvo_user_preferences" ADD CONSTRAINT "corvo_user_preferences_user_id_corvo_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."corvo_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corvo_vault_item_tags" ADD CONSTRAINT "corvo_vault_item_tags_vault_item_id_corvo_vault_items_id_fk" FOREIGN KEY ("vault_item_id") REFERENCES "public"."corvo_vault_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corvo_vault_item_tags" ADD CONSTRAINT "corvo_vault_item_tags_tag_id_corvo_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."corvo_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corvo_vault_items" ADD CONSTRAINT "corvo_vault_items_user_id_corvo_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."corvo_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corvo_vault_items" ADD CONSTRAINT "corvo_vault_items_category_id_corvo_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."corvo_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "corvo_account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_categories_user" ON "corvo_categories" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_categories_user_name" ON "corvo_categories" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "idx_email_verification_token" ON "corvo_email_verification_token" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_password_reset_token" ON "corvo_password_reset_token" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_tags_user" ON "corvo_tags" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tags_user_name" ON "corvo_tags" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "corvo_user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_username" ON "corvo_user" USING btree ("username");--> statement-breakpoint
CREATE INDEX "idx_users_active" ON "corvo_user" USING btree ("is_active") WHERE "corvo_user"."is_active" = true;--> statement-breakpoint
CREATE INDEX "idx_vault_item_tags_item" ON "corvo_vault_item_tags" USING btree ("vault_item_id");--> statement-breakpoint
CREATE INDEX "idx_vault_item_tags_tag" ON "corvo_vault_item_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "idx_vault_items_user" ON "corvo_vault_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_vault_items_category" ON "corvo_vault_items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_vault_items_type" ON "corvo_vault_items" USING btree ("item_type");--> statement-breakpoint
CREATE INDEX "idx_vault_items_created" ON "corvo_vault_items" USING btree ("created_at");
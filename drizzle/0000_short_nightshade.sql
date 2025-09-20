CREATE TABLE "account" (
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
	CONSTRAINT "account_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "categories" (
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
CREATE TABLE "recipient_access_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_id" uuid NOT NULL,
	"vault_item_id" uuid NOT NULL,
	"access_type" varchar(50) NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"access_granted" boolean DEFAULT true,
	"denial_reason" varchar(255),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipient_file_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_id" uuid NOT NULL,
	"vault_item_id" uuid NOT NULL,
	"encrypted_file_key" text NOT NULL,
	"encryption_iv" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"phone_number" varchar(50),
	"relationship" varchar(100),
	"notes" text,
	"access_code_encrypted" text,
	"encryption_iv" text,
	"code_salt" text,
	"is_active" boolean DEFAULT false,
	"activated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"color" varchar(7),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
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
	"key_derivation_salt" text,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "vault_item_tags" (
	"vault_item_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "vault_item_tags_vault_item_id_tag_id_pk" PRIMARY KEY("vault_item_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "vault_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category_id" uuid,
	"item_type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"content_encrypted" text,
	"file_name" varchar(255) NOT NULL,
	"file_size" bigint NOT NULL,
	"file_type" varchar(100) NOT NULL,
	"file_path" text NOT NULL,
	"thumbnail_path" text,
	"encryption_algorithm" varchar(50) DEFAULT 'AES-256-GCM',
	"encryption_iv" text NOT NULL,
	"wrapped_key_user" text NOT NULL,
	"metadata" jsonb,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"recipient_access_count" integer DEFAULT 0 NOT NULL,
	"last_accessed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipient_access_logs" ADD CONSTRAINT "recipient_access_logs_recipient_id_recipients_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."recipients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipient_access_logs" ADD CONSTRAINT "recipient_access_logs_vault_item_id_vault_items_id_fk" FOREIGN KEY ("vault_item_id") REFERENCES "public"."vault_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipient_file_keys" ADD CONSTRAINT "recipient_file_keys_recipient_id_recipients_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."recipients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipient_file_keys" ADD CONSTRAINT "recipient_file_keys_vault_item_id_vault_items_id_fk" FOREIGN KEY ("vault_item_id") REFERENCES "public"."vault_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipients" ADD CONSTRAINT "recipients_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_item_tags" ADD CONSTRAINT "vault_item_tags_vault_item_id_vault_items_id_fk" FOREIGN KEY ("vault_item_id") REFERENCES "public"."vault_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_item_tags" ADD CONSTRAINT "vault_item_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_items" ADD CONSTRAINT "vault_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_items" ADD CONSTRAINT "vault_items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_categories_user_name" ON "categories" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "idx_categories_user" ON "categories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_recipient_access_logs_recipient" ON "recipient_access_logs" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "idx_recipient_access_logs_vault_item" ON "recipient_access_logs" USING btree ("vault_item_id");--> statement-breakpoint
CREATE INDEX "idx_recipient_access_logs_created" ON "recipient_access_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_recipient_file_keys_unique" ON "recipient_file_keys" USING btree ("recipient_id","vault_item_id");--> statement-breakpoint
CREATE INDEX "idx_recipient_file_keys_recipient" ON "recipient_file_keys" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "idx_recipient_file_keys_vault_item" ON "recipient_file_keys" USING btree ("vault_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_recipients_user_email" ON "recipients" USING btree ("user_id","email");--> statement-breakpoint
CREATE INDEX "idx_recipients_user" ON "recipients" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_recipients_email" ON "recipients" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tags_user_name" ON "tags" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "idx_tags_user" ON "tags" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_username" ON "user" USING btree ("username");--> statement-breakpoint
CREATE INDEX "idx_users_active" ON "user" USING btree ("is_active") WHERE "user"."is_active" = true;--> statement-breakpoint
CREATE INDEX "idx_vault_item_tags_item" ON "vault_item_tags" USING btree ("vault_item_id");--> statement-breakpoint
CREATE INDEX "idx_vault_item_tags_tag" ON "vault_item_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "idx_vault_items_user" ON "vault_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_vault_items_category" ON "vault_items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_vault_items_type" ON "vault_items" USING btree ("item_type");--> statement-breakpoint
CREATE INDEX "idx_vault_items_created" ON "vault_items" USING btree ("created_at");
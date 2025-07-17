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
CREATE TABLE "corvo_session" (
	"sessionToken" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
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
CREATE TABLE "corvo_verification_token" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "corvo_verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "corvo_account" ADD CONSTRAINT "corvo_account_user_id_corvo_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."corvo_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corvo_email_verification_token" ADD CONSTRAINT "corvo_email_verification_token_user_id_corvo_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."corvo_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corvo_password_reset_token" ADD CONSTRAINT "corvo_password_reset_token_user_id_corvo_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."corvo_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corvo_session" ADD CONSTRAINT "corvo_session_user_id_corvo_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."corvo_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corvo_user_preferences" ADD CONSTRAINT "corvo_user_preferences_user_id_corvo_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."corvo_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "corvo_account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_email_verification_token" ON "corvo_email_verification_token" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_password_reset_token" ON "corvo_password_reset_token" USING btree ("token");--> statement-breakpoint
CREATE INDEX "t_user_id_idx" ON "corvo_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "corvo_user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_username" ON "corvo_user" USING btree ("username");--> statement-breakpoint
CREATE INDEX "idx_users_active" ON "corvo_user" USING btree ("is_active") WHERE "corvo_user"."is_active" = true;
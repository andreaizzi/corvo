CREATE TABLE "corvo_recipient_access_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_id" uuid NOT NULL,
	"access_code_encrypted" text NOT NULL,
	"encryption_iv" text NOT NULL,
	"code_salt" text NOT NULL,
	"is_active" boolean DEFAULT false,
	"activated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "corvo_recipient_access_codes_recipient_id_unique" UNIQUE("recipient_id")
);
--> statement-breakpoint
CREATE TABLE "corvo_recipient_access_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"access_code_id" uuid NOT NULL,
	"vault_item_id" uuid NOT NULL,
	"access_type" varchar(50) NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"access_granted" boolean DEFAULT true,
	"denial_reason" varchar(255),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corvo_recipient_file_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"access_code_id" uuid NOT NULL,
	"vault_item_id" uuid NOT NULL,
	"encrypted_file_key" text NOT NULL,
	"encryption_iv" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corvo_recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"phone_number" varchar(50),
	"relationship" varchar(100),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "corvo_recipient_access_codes" ADD CONSTRAINT "corvo_recipient_access_codes_recipient_id_corvo_recipients_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."corvo_recipients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corvo_recipient_access_logs" ADD CONSTRAINT "corvo_recipient_access_logs_access_code_id_corvo_recipient_access_codes_id_fk" FOREIGN KEY ("access_code_id") REFERENCES "public"."corvo_recipient_access_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corvo_recipient_access_logs" ADD CONSTRAINT "corvo_recipient_access_logs_vault_item_id_corvo_vault_items_id_fk" FOREIGN KEY ("vault_item_id") REFERENCES "public"."corvo_vault_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corvo_recipient_file_keys" ADD CONSTRAINT "corvo_recipient_file_keys_access_code_id_corvo_recipient_access_codes_id_fk" FOREIGN KEY ("access_code_id") REFERENCES "public"."corvo_recipient_access_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corvo_recipient_file_keys" ADD CONSTRAINT "corvo_recipient_file_keys_vault_item_id_corvo_vault_items_id_fk" FOREIGN KEY ("vault_item_id") REFERENCES "public"."corvo_vault_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corvo_recipients" ADD CONSTRAINT "corvo_recipients_user_id_corvo_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."corvo_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_recipient_access_codes_recipient" ON "corvo_recipient_access_codes" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "idx_recipient_access_codes_active" ON "corvo_recipient_access_codes" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_recipient_access_logs_access_code" ON "corvo_recipient_access_logs" USING btree ("access_code_id");--> statement-breakpoint
CREATE INDEX "idx_recipient_access_logs_vault_item" ON "corvo_recipient_access_logs" USING btree ("vault_item_id");--> statement-breakpoint
CREATE INDEX "idx_recipient_access_logs_created" ON "corvo_recipient_access_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_recipient_file_keys_unique" ON "corvo_recipient_file_keys" USING btree ("access_code_id","vault_item_id");--> statement-breakpoint
CREATE INDEX "idx_recipient_file_keys_access_code" ON "corvo_recipient_file_keys" USING btree ("access_code_id");--> statement-breakpoint
CREATE INDEX "idx_recipient_file_keys_vault_item" ON "corvo_recipient_file_keys" USING btree ("vault_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_recipients_user_email" ON "corvo_recipients" USING btree ("user_id","email");--> statement-breakpoint
CREATE INDEX "idx_recipients_user" ON "corvo_recipients" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_recipients_email" ON "corvo_recipients" USING btree ("email");
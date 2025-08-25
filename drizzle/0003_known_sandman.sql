ALTER TABLE "corvo_vault_items" ALTER COLUMN "encryption_iv" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "corvo_vault_items" ALTER COLUMN "wrapped_key_user" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "corvo_vault_items" ALTER COLUMN "key_derivation_salt" SET NOT NULL;
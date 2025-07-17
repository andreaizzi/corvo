import { db } from ".";
import { systemConfig } from "./schema";

async function seed() {
    console.log("🌱 Seeding database...");

    try {
        // Insert system configuration
        await db.insert(systemConfig).values([
            {
                configKey: "max_file_size_mb",
                configValue: "100",
                configType: "number",
                description: "Maximum file size in megabytes",
            },
            {
                configKey: "session_timeout_minutes",
                configValue: "30",
                configType: "number",
                description: "Session timeout in minutes",
            },
            {
                configKey: "max_recipients_per_user",
                configValue: "50",
                configType: "number",
                description: "Maximum number of recipients per user",
            },
            {
                configKey: "default_check_interval_days",
                configValue: "30",
                configType: "number",
                description: "Default check-in interval in days",
            },
            {
                configKey: "default_grace_period_days",
                configValue: "7",
                configType: "number",
                description: "Default grace period in days",
            },
            {
                configKey: "backup_retention_days",
                configValue: "90",
                configType: "number",
                description: "Backup retention period in days",
            },
            {
                configKey: "notification_retry_delay_minutes",
                configValue: "5",
                configType: "number",
                description: "Delay between notification retries",
            },
            {
                configKey: "encryption_algorithm",
                configValue: "AES-256-GCM",
                configType: "string",
                description: "Encryption algorithm for data at rest",
            },
        ]);

        console.log("✅ System configuration seeded successfully");
        console.log("🎉 Database seeding completed!");
    } catch (error) {
        console.error("❌ Error seeding database:", error);
        throw error;
    }
}

// Run the seed function
seed()
    .then(() => {
        console.log("Seed script completed");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Seed script failed:", error);
        process.exit(1);
    });
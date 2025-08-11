#!/usr/bin/env node

/**
 * Script to generate a secure master key for Corvo Legacy System
 * Run with: node scripts/generate-master-key.js
 */

import crypto from "crypto";

console.log("Generating Corvo Legacy Master Key...\n");

// Generate 32 random bytes (256 bits)
const keyBytes = crypto.randomBytes(32);

// Convert to base64
const keyBase64 = keyBytes.toString("base64");

console.log("Add this to your .env file:");
console.log("----------------------------------------");
console.log(`CORVO_LEGACY_MASTER_KEY="${keyBase64}"`);
console.log("----------------------------------------\n");

console.log("IMPORTANT: Keep this key secure!");
console.log("- This key is used to encrypt recipient access codes");
console.log("- Losing this key means recipients cannot access their files");
console.log("- Store a backup of this key in a secure location");
console.log("- Never commit this key to version control");

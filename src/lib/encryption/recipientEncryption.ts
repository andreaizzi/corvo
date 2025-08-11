import {
    arrayBufferToBase64,
    base64ToArrayBuffer,
    stringToArrayBuffer,
    generateRandomBytes,
    ENCRYPTION_CONFIG
} from './encryption';

// System configuration for legacy access
const SYSTEM_CONFIG = {
    legacyKeyEnvVar: 'CORVO_LEGACY_MASTER_KEY',
    algorithm: 'AES-GCM',
    ivLength: 12,
    accessCodeLength: 32, // Not used with word-based codes
};

// Simple word list for access codes (expand this in production)
const WORD_LIST = [
    'apple', 'banana', 'cherry', 'dragon', 'eagle', 'falcon', 'garden', 'harbor',
    'island', 'jungle', 'kitten', 'ladder', 'marble', 'needle', 'orange', 'palace',
    'quartz', 'rabbit', 'silver', 'temple', 'umbrella', 'valley', 'window', 'yellow',
    'zebra', 'anchor', 'bridge', 'candle', 'desert', 'forest', 'glacier', 'hammer',
    'jacket', 'kernel', 'lemon', 'mirror', 'nectar', 'ocean', 'pebble', 'quiet',
    'river', 'sunset', 'tiger', 'ultra', 'violet', 'whisper', 'xerox', 'yogurt',
    'zipper', 'alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'gamma'
];

// Generate a word-based access code
export function generateAccessCode(): string {
    const words: string[] = [];

    // Generate 4 random words
    for (let i = 0; i < 4; i++) {
        const randomIndex = Math.floor(Math.random() * WORD_LIST.length);
        words.push(WORD_LIST[randomIndex]);
    }

    return words.join('-');
}

// Validate access code format
export function isValidAccessCode(code: string): boolean {
    const parts = code.split('-');
    if (parts.length !== 4) return false;

    // Check each part is a valid word from our list
    return parts.every(word => WORD_LIST.includes(word));
}

// Server-side only: Get system master key from environment
export function getSystemLegacyKey(): Uint8Array {
    if (typeof window !== 'undefined') {
        throw new Error('System legacy key cannot be accessed from client');
    }

    const keyBase64 = process.env.CORVO_LEGACY_MASTER_KEY;
    if (!keyBase64) {
        throw new Error('Legacy master key not configured. Set CORVO_LEGACY_MASTER_KEY environment variable.');
    }

    return new Uint8Array(base64ToArrayBuffer(keyBase64));
}

// Server-side: Import system master key as CryptoKey
export async function importSystemMasterKey(): Promise<CryptoKey> {
    const keyBytes = getSystemLegacyKey();

    return crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: SYSTEM_CONFIG.algorithm },
        false,
        ['encrypt', 'decrypt']
    );
}

// Server-side: Encrypt access code with system master key
export async function encryptAccessCode(accessCode: string): Promise<{
    encrypted: string;
    iv: string;
}> {
    const systemKey = await importSystemMasterKey();
    const iv = generateRandomBytes(SYSTEM_CONFIG.ivLength);

    const encrypted = await crypto.subtle.encrypt(
        { name: SYSTEM_CONFIG.algorithm, iv },
        systemKey,
        stringToArrayBuffer(accessCode)
    );

    return {
        encrypted: arrayBufferToBase64(encrypted),
        iv: arrayBufferToBase64(iv.buffer),
    };
}

// Server-side: Decrypt access code with system master key
export async function decryptAccessCode(encryptedData: {
    encrypted: string;
    iv: string;
}): Promise<string> {
    const systemKey = await importSystemMasterKey();
    const iv = new Uint8Array(base64ToArrayBuffer(encryptedData.iv));
    const encryptedBuffer = base64ToArrayBuffer(encryptedData.encrypted);

    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: SYSTEM_CONFIG.algorithm, iv },
        systemKey,
        encryptedBuffer
    );

    return new TextDecoder().decode(decryptedBuffer);
}

// Derive recipient key from access code (can be used client or server side)
export async function deriveRecipientKey(accessCode: string, salt: Uint8Array): Promise<CryptoKey> {
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        stringToArrayBuffer(accessCode),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: ENCRYPTION_CONFIG.iterations,
            hash: 'SHA-256',
        },
        passwordKey,
        { name: ENCRYPTION_CONFIG.algorithm, length: ENCRYPTION_CONFIG.keyLength },
        true,
        ['wrapKey', 'unwrapKey']
    );
}

// Wrap file key with recipient key
export async function wrapFileKeyForRecipient(
    fileKey: CryptoKey,
    recipientKey: CryptoKey,
    iv: Uint8Array
): Promise<ArrayBuffer> {
    return crypto.subtle.wrapKey(
        'raw',
        fileKey,
        recipientKey,
        {
            name: ENCRYPTION_CONFIG.algorithm,
            iv,
        }
    );
}

// Unwrap file key with recipient key (for recipient access)
export async function unwrapFileKeyWithRecipientKey(
    wrappedKey: ArrayBuffer,
    recipientKey: CryptoKey,
    iv: Uint8Array
): Promise<CryptoKey> {
    return crypto.subtle.unwrapKey(
        'raw',
        wrappedKey,
        recipientKey,
        {
            name: ENCRYPTION_CONFIG.algorithm,
            iv,
        },
        {
            name: ENCRYPTION_CONFIG.algorithm,
            length: ENCRYPTION_CONFIG.keyLength,
        },
        false,
        ['encrypt', 'decrypt']
    );
}

// Note: deriveRecipientKeyFromUrl is deprecated
// Recipients should get the salt from the server via validateAccessCode
// This function is kept for reference but should not be used
export async function deriveRecipientKeyFromUrl(accessCode: string): Promise<{
    key: CryptoKey;
    salt: Uint8Array;
}> {
    // DEPRECATED: This approach doesn't work because it generates a different salt
    // than what was used during file assignment
    throw new Error('Use deriveRecipientKey with salt from server instead');
}
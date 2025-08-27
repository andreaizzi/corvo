// Shared encryption utilities for client and server
export const ENCRYPTION_CONFIG = {
    algorithm: 'AES-GCM',
    keyLength: 256,
    ivLength: 12,
    saltLength: 16,
    iterations: 100000,
    tagLength: 128,
} as const;

// Convert ArrayBuffer to base64 string
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]!);
    }
    return btoa(binary);
}

// Convert base64 string to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

// Convert string to ArrayBuffer
export function stringToArrayBuffer(str: string): ArrayBuffer {
    const encoder = new TextEncoder();
    return encoder.encode(str).buffer;
}

// Generate random bytes
export function generateRandomBytes(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
}

// Client-side encryption functions
export const clientEncryption = {
    // Derive key from password using PBKDF2
    async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
        const passwordKey = await crypto.subtle.importKey(
            'raw',
            stringToArrayBuffer(password),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: new Uint8Array(salt),
                iterations: ENCRYPTION_CONFIG.iterations,
                hash: 'SHA-256',
            },
            passwordKey,
            { name: ENCRYPTION_CONFIG.algorithm, length: ENCRYPTION_CONFIG.keyLength },
            true,
            ['wrapKey', 'unwrapKey']
        );
    },

    // Generate a new file encryption key
    async generateFileKey(): Promise<CryptoKey> {
        return crypto.subtle.generateKey(
            {
                name: ENCRYPTION_CONFIG.algorithm,
                length: ENCRYPTION_CONFIG.keyLength,
            },
            true,
            ['encrypt', 'decrypt']
        );
    },

    // Wrap (encrypt) a key with another key
    async wrapKey(keyToWrap: CryptoKey, wrappingKey: CryptoKey, iv: Uint8Array): Promise<ArrayBuffer> {
        return crypto.subtle.wrapKey(
            'raw',
            keyToWrap,
            wrappingKey,
            {
                name: ENCRYPTION_CONFIG.algorithm,
                iv: new Uint8Array(iv),
            }
        );
    },

    // Unwrap (decrypt) a key with another key
    async unwrapKey(
        wrappedKey: ArrayBuffer,
        unwrappingKey: CryptoKey,
        iv: Uint8Array,
        extractable = false
    ): Promise<CryptoKey> {
        return crypto.subtle.unwrapKey(
            'raw',
            wrappedKey,
            unwrappingKey,
            {
                name: ENCRYPTION_CONFIG.algorithm,
                iv,
            },
            {
                name: ENCRYPTION_CONFIG.algorithm,
                length: ENCRYPTION_CONFIG.keyLength,
            },
            extractable,
            ['encrypt', 'decrypt']
        );
    },

    // Encrypt file data
    async encryptFile(
        fileData: ArrayBuffer,
        key: CryptoKey,
        iv: Uint8Array
    ): Promise<ArrayBuffer> {
        return crypto.subtle.encrypt(
            {
                name: ENCRYPTION_CONFIG.algorithm,
                iv,
            },
            key,
            fileData
        );
    },

    // Decrypt file data
    async decryptFile(
        encryptedData: ArrayBuffer,
        key: CryptoKey,
        iv: Uint8Array
    ): Promise<ArrayBuffer> {
        return crypto.subtle.decrypt(
            {
                name: ENCRYPTION_CONFIG.algorithm,
                iv,
            },
            key,
            encryptedData
        );
    },
};

// Secure key storage in memory only (not in sessionStorage)
class SecureKeyCache {
    private userKey: CryptoKey | null = null;
    private salt: Uint8Array | null = null;
    private timestamp: number | null = null;
    private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

    async deriveAndStore(password: string, salt?: Uint8Array): Promise<{ key: CryptoKey; salt: Uint8Array }> {
        // Use provided salt or generate new one (for first time)
        this.salt = salt ?? generateRandomBytes(ENCRYPTION_CONFIG.saltLength);

        // Derive the key
        this.userKey = await clientEncryption.deriveKey(password, this.salt);
        this.timestamp = Date.now();

        return { key: this.userKey, salt: this.salt };
    }

    get(): { key: CryptoKey; salt: Uint8Array } | null {
        if (!this.userKey || !this.salt || !this.timestamp) return null;

        const now = Date.now();
        if (now - this.timestamp > this.CACHE_DURATION) {
            this.clear();
            return null;
        }

        // Update timestamp on access to keep session alive
        this.timestamp = now;
        return { key: this.userKey, salt: this.salt };
    }

    clear(): void {
        this.userKey = null;
        this.salt = null;
        this.timestamp = null;
    }
}

export const keyCache = new SecureKeyCache();
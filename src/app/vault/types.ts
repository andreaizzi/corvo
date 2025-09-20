// Types matching your database structure for vault items

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";

type RouterOutput = inferRouterOutputs<AppRouter>;
export type VaultFile = RouterOutput['vault']['getFiles'][number];
export type Recipient = RouterOutput['recipients']['getAll'][number];
// getFiles returns an array. so we use [number] to get a single file type

export interface VaultItem {
    // Core fields from database
    id: string;
    userId: string;
    categoryId?: string;
    itemType: "file" | "note" | "message" | "credential";
    title: string;
    description?: string;
    contentEncrypted?: string; // For notes/messages

    // File-specific fields
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    filePath?: string;
    thumbnailPath?: string;

    // Encryption fields
    encryptionAlgorithm?: string;
    encryptionIv?: string;
    wrappedFileKey?: string;
    keyDerivationSalt?: string;

    // Metadata and tracking
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: Record<string, any>;
    isFavorite: boolean;
    recipientAccessCount: number;
    lastAccessedAt?: Date;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;

    // Additional display fields (not from DB, populated via relations)
    recipients?: Recipient[];
    tags?: Tag[];
    category?: Category;
}

export interface Category {
    id: string;
    userId: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    isDefault: boolean;
    position: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface Tag {
    id: string;
    userId: string;
    name: string;
    color?: string;
    createdAt: Date;
}

/* export interface Recipient {
    id: string;
    userId: string;
    email: string;
    fullName: string;
    phoneNumber?: string;
    relationship?: string;
    verificationRequired?: boolean;
    verificationCode?: string;
    isVerified: boolean;
    verifiedAt?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
} */

export interface RecipientPermission {
    id: string;
    recipientId: string;
    vaultItemId?: string;
    categoryId?: string;
    permissionType: "view" | "download";
    accessDurationDays?: number;
    maxAccessCount?: number;
    accessPassword?: string;
    notes?: string;
    createdAt: Date;
}

// For credentials extension (when itemType === 'credential')
export interface Credentials {
    id: string;
    vaultItemId: string; // References VaultItem with itemType='credential'
    websiteUrl?: string;
    appName?: string;
    username?: string;
    email?: string;
    passwordEncrypted?: string;
    totpSecretEncrypted?: string;
    recoveryCodesEncrypted?: string;
    notesEncrypted?: string;
    requires2fa: boolean;
    iconUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Helper type for vault items with credential details
export interface VaultItemWithCredentials extends VaultItem {
    credentials?: Credentials;
}

// Filter and sorting options for vault page
export interface VaultFilter {
    itemType?: VaultItem["itemType"];
    categoryId?: string;
    tagIds?: string[];
    isFavorite?: boolean;
    recipientId?: string;
    searchQuery?: string;
}

// Statistics for dashboard/overview
export interface VaultStats {
    totalItems: number;
    fileCount: number;
    noteCount: number;
    messageCount: number;
    credentialCount: number;
    totalStorageBytes: number;
    favoriteCount: number;
}
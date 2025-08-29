import type { VaultItem } from "./types";

export const mockVaultItems: VaultItem[] = [
    {
        id: "1",
        userId: "user1",
        itemType: "file",
        title: "Last Will and Testament",
        fileName: "will.pdf",
        fileSize: 2516582, // 2.4 MB
        fileType: "application/pdf",
        isFavorite: false,
        recipientAccessCount: 0,
        createdAt: new Date("2024-08-11"),
        updatedAt: new Date("2024-08-11"),
        encryptionAlgorithm: "AES-256-GCM",
    },
    {
        id: "2",
        userId: "user1",
        itemType: "file",
        title: "Personal Video Message",
        fileName: "message.mp4",
        fileSize: 130023424, // 124 MB
        fileType: "video/mp4",
        isFavorite: false,
        recipientAccessCount: 0,
        createdAt: new Date("2024-08-10"),
        updatedAt: new Date("2024-08-10"),
        encryptionAlgorithm: "AES-256-GCM",
    },
    {
        id: "3",
        userId: "user1",
        itemType: "file",
        title: "Bank Instructions",
        fileName: "bank_instructions.txt",
        fileSize: 1782579, // 1.7 MB
        fileType: "text/plain",
        isFavorite: false,
        recipientAccessCount: 0,
        createdAt: new Date("2024-08-10"),
        updatedAt: new Date("2024-08-10"),
        encryptionAlgorithm: "AES-256-GCM",
    },
    {
        id: "4",
        userId: "user1",
        itemType: "file",
        title: "Last family photo",
        fileName: "family.jpg",
        fileSize: 4404019, // 4.2 MB
        fileType: "image/jpeg",
        isFavorite: false,
        recipientAccessCount: 0,
        createdAt: new Date("2024-08-07"),
        updatedAt: new Date("2024-08-07"),
        encryptionAlgorithm: "AES-256-GCM",
    },
];

// Mock recipients data - would come from DB relations
export const mockRecipients = {
    "1": ["Mario Rossi", "Tony Pitony"],
    "2": ["Luca Verdi"],
    "3": ["Luca Verdi"],
    "4": ["Mario Rossi", "Tony Pitony"],
};

export const categories = [
    { id: "all", name: "All Assets", count: 47 },
    { id: "documents", name: "Documents", count: 23 },
    { id: "images", name: "Images", count: 12 },
    { id: "credentials", name: "Credentials", count: 8 },
];

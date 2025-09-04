// src/app/vault/hooks/useFileDownload.ts
import { useState } from "react";
import { useEncryption } from "~/lib/encryption/EncryptionContext";
import {
    arrayBufferToBase64,
    clientEncryption,
    ENCRYPTION_CONFIG,
    generateRandomBytes
} from "~/lib/encryption/encryption";
import { api } from "~/trpc/react";

interface UseFileUploadsProps {
    refetch: () => void;
    setOpenUploadDialog: (open: boolean) => void;
    // handlePasswordVerified: () => void;
}

export function useFileUpload({
    refetch,
    setOpenUploadDialog
}: UseFileUploadsProps) {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState("");
    const [fileDescription, setFileDescription] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    const { getKey } = useEncryption();
    const createFile = api.vault.createFile.useMutation({
        onSuccess: () => {
            void refetch();
            resetUploadDialog();
            setOpenUploadDialog(false);
        },
        onError: (err) => {
            resetUploadDialog();
        },
    });

    const encryptAndUpload = async () => {
        if (!uploadedFile) return;

        const keyData = getKey();
        if (!keyData) {
            throw new Error("No encryption key available");
        }

        setIsUploading(true);

        try {
            // Read file as ArrayBuffer
            const fileData = await uploadedFile.arrayBuffer();

            // Generate encryption keys and IV
            const iv = generateRandomBytes(ENCRYPTION_CONFIG.ivLength);
            const wrapIv = generateRandomBytes(ENCRYPTION_CONFIG.ivLength);

            // Use the stored user key and salt
            const { key: userKey, salt } = keyData;

            // Generate file encryption key
            const fileKey = await clientEncryption.generateFileKey();

            // Encrypt the file
            const encryptedData = await clientEncryption.encryptFile(fileData, fileKey, iv);

            // Wrap the file key with user's key
            const wrappedKey = await clientEncryption.wrapKey(fileKey, userKey, wrapIv);

            // Convert to base64 for transmission
            const encryptedBase64 = arrayBufferToBase64(encryptedData);
            const wrappedKeyBase64 = arrayBufferToBase64(wrappedKey);
            const ivBase64 = arrayBufferToBase64(iv.buffer as ArrayBuffer);
            const wrapIvBase64 = arrayBufferToBase64(wrapIv.buffer as ArrayBuffer);

            // Create the encrypted IV string (combines file IV and wrap IV)
            const encryptionIv = `${ivBase64}:${wrapIvBase64}`;

            // Upload to server
            await createFile.mutateAsync({
                title: fileName,
                description: fileDescription,
                fileName: uploadedFile.name,
                fileSize: uploadedFile.size,
                fileType: uploadedFile.type,
                encryptedData: encryptedBase64,
                encryptionIv,
                wrappedKeyUser: wrappedKeyBase64,
            });
        } catch (err) {
            console.error("Encryption error:", err);
            // setError("Failed to encrypt file");
        } finally {
            setIsUploading(false);
        }
    };

    const resetUploadDialog = () => {
        setUploadedFile(null);
        setFileName("");
        setFileDescription("");
    }

    const handleUpload = async (
        file: File,
        setShowPasswordDialog: (show: boolean) => void
    ) => {
        setIsUploading(true);
        setUploadedFile(file);
        const keyData = getKey();
        if (keyData) {
            await encryptAndUpload();
        } else {
            setShowPasswordDialog(true);
        }
    }

    return {
        uploadedFile,
        setUploadedFile,
        setFileName,
        setFileDescription,
        fileName,
        fileDescription,
        handleUpload,
        isUploading
    };
}
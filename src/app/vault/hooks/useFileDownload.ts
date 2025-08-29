// src/app/vault/hooks/useFileDownload.ts
import { useState } from "react";
import { useEncryption } from "~/lib/encryption/EncryptionContext";
import {
    arrayBufferToBase64,
    base64ToArrayBuffer,
    clientEncryption,
} from "~/lib/encryption/encryption";
import { api } from "~/trpc/react";
import type { VaultFile } from "../types";

export function useFileDownload() {
    const [downloadingFile, setDownloadingFile] = useState<VaultFile | null>(null);
    const { getKey } = useEncryption();
    const downloadFile = api.vault.downloadFile.useMutation();

    const decryptAndDownload = async (file: VaultFile) => {
        const keyData = getKey();
        if (!keyData) {
            throw new Error("No encryption key available");
        }

        try {
            const fileData = await downloadFile.mutateAsync({ id: file.id });
            const [fileIvBase64, wrapIvBase64] = fileData.encryptionIv.split(":");
            const fileIv = new Uint8Array(base64ToArrayBuffer(fileIvBase64!));
            const wrapIv = new Uint8Array(base64ToArrayBuffer(wrapIvBase64!));

            const { key: userKey } = keyData;
            const wrappedKey = base64ToArrayBuffer(fileData.wrappedKeyUser);
            const fileKey = await clientEncryption.unwrapKey(wrappedKey, userKey, wrapIv);

            const encryptedData = base64ToArrayBuffer(fileData.encryptedData);
            const decryptedData = await clientEncryption.decryptFile(
                encryptedData,
                fileKey,
                fileIv
            );

            const blob = new Blob([decryptedData], { type: fileData.fileType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileData.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Decryption error:", err);
            alert("Failed to decrypt file. Please try again.");
        } finally {
            setDownloadingFile(null);
        }
    };

    const handleDownload = async (
        file: VaultFile,
        setShowPasswordDialog: (show: boolean) => void
    ) => {
        setDownloadingFile(file);
        const keyData = getKey();
        if (keyData) {
            await decryptAndDownload(file);
        } else {
            setShowPasswordDialog(true);
        }
    };


    return {
        downloadingFile,
        setDownloadingFile,
        handleDownload,
        decryptAndDownload
    };
}
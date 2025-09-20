// src/app/vault/hooks/useRecipientAssignment.ts
import { useState } from "react";
import { useEncryption } from "~/lib/encryption/EncryptionContext";
import {
    arrayBufferToBase64,
    base64ToArrayBuffer,
    clientEncryption,
} from "~/lib/encryption/encryption";
import { api } from "~/trpc/react";
import type { VaultFile } from "../types";
import type { SelectionDetails } from "node_modules/@chakra-ui/react/dist/types/components/menu/namespace";

interface UseRecipientAssignmentProps {
    refetch: () => void;
    setOpenPasswordDialog: (show: boolean) => void;
    // handlePasswordVerified: () => void;
}

export function useRecipientAssignment({
    refetch,
    setOpenPasswordDialog,
}: UseRecipientAssignmentProps) {
    const [pendingFile, setPendingFile] = useState<VaultFile | null>(null);
    const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);

    const { getKey } = useEncryption();

    const assignFile = api.recipients.assignFileWithKey.useMutation({
        onSuccess: async () => {
            refetch();
        },
        onError: (error) => {
            alert(`Failed to assign file: ${error.message}`);
        },
    });

    const unassignFile = api.recipients.unassignFile.useMutation({
        onSuccess: () => {
            void refetch();
        },
    });

    const processFileAssignment = async (file: VaultFile, recipientId: string) => {
        const keyData = getKey();
        if (!keyData) {
            alert("No encryption key available");
            return;
        }

        try {
            const [fileIvBase64, wrapIvBase64] = file.encryptionIv.split(":");
            const wrapIv = new Uint8Array(base64ToArrayBuffer(wrapIvBase64!));
            const wrappedKey = base64ToArrayBuffer(file.wrappedFileKey);
            const fileKey = await clientEncryption.unwrapKey(
                wrappedKey,
                keyData.key,
                wrapIv,
                true
            );
            const fileKeyRaw = await crypto.subtle.exportKey("raw", fileKey);
            const fileKeyBase64 = arrayBufferToBase64(fileKeyRaw);

            await assignFile.mutateAsync({
                recipientId,
                fileId: file.id,
                fileKeyBase64,
            });
        } catch (err) {
            console.error("Failed to assign file:", err);
            alert("Failed to assign file. Please try again.");
        } finally {
            setPendingFile(null);
        }
    };

    const handleAssign = async (file: VaultFile, event: SelectionDetails) => {
        setPendingFile(file);
        const recipientId = event.value;
        setSelectedRecipientId(recipientId);

        const isAssigned = file.recipients.some((r) => r.id === recipientId);

        if (isAssigned) {
            await unassignFile.mutateAsync({ fileId: file.id, recipientId });
            setPendingFile(null);
        } else {
            const keyData = getKey();
            if (keyData) {
                await processFileAssignment(file, recipientId);
            } else {
                setOpenPasswordDialog(true);
            }
        }
    };

    return {
        pendingFile,
        setPendingFile,
        selectedRecipientId,
        setSelectedRecipientId,
        handleAssign,
        processFileAssignment,
    };
}
"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useEncryption } from "~/lib/encryption/EncryptionContext";
import { base64ToArrayBuffer, arrayBufferToBase64, clientEncryption } from "~/lib/encryption/encryption";
import PasswordPrompt from "~/app/vault/components/PasswordPrompt";

interface FileAssignmentProps {
    recipientId: string;
}

export default function FileAssignment({ recipientId }: FileAssignmentProps) {
    const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
    const [pendingFileId, setPendingFileId] = useState<string | null>(null);
    const [fileSalt, setFileSalt] = useState<Uint8Array | null>(null);

    const { getKey } = useEncryption();
    const utils = api.useUtils();

    // Get all user's files
    const { data: allFiles } = api.vault.getFiles.useQuery({});

    // Get files assigned to this recipient
    const { data: assignedFiles } = api.recipients.getAssignedFiles.useQuery({ recipientId });

    // Mutations
    const assignFile = api.recipients.assignFileWithKey.useMutation({
        onSuccess: () => {
            void utils.recipients.getAssignedFiles.invalidate({ recipientId });
            void utils.recipients.getAll.invalidate();
        },
        onError: (error) => {
            alert(`Failed to assign file: ${error.message}`);
        },
    });

    const unassignFile = api.recipients.unassignFile.useMutation({
        onSuccess: () => {
            void utils.recipients.getAssignedFiles.invalidate({ recipientId });
            void utils.recipients.getAll.invalidate();
        },
    });

    // Check if a file is assigned to this recipient
    const isFileAssigned = (fileId: string) => {
        return assignedFiles?.some(f => f.id === fileId) ?? false;
    };

    // Handle file assignment
    const handleAssignFile = async (fileId: string) => {
        const keyData = getKey();
        if (!keyData) {
            // Need to get password first
            setPendingFileId(fileId);

            // Get file metadata to get salt
            const file = allFiles?.find(f => f.id === fileId);
            if (file) {
                // We'll need to fetch the full file data to get the salt
                try {
                    const fileData = await utils.vault.getFile.fetch({ id: fileId });
                    const salt = new Uint8Array(base64ToArrayBuffer(fileData.keyDerivationSalt!));
                    setFileSalt(salt);
                    setShowPasswordPrompt(true);
                } catch (err) {
                    console.error("Failed to get file metadata:", err);
                    setPendingFileId(null);
                }
            }
        } else {
            // Key is already cached, proceed with assignment
            setPendingFileId(fileId);
            await processFileAssignment(fileId);
        }
    };

    // Process the actual file assignment
    const processFileAssignment = async (fileId: string) => {
        const keyData = getKey();
        if (!keyData) {
            alert("No encryption key available");
            return;
        }

        try {
            // per capire meglio puoi metterti affianco il file FileList.tsx (decryptAndDownload)
            // in cui avviene il download dei file, durante il quale anche bisogna
            // decriptare la chiave del file

            // Get file metadata
            const fileData = await utils.vault.getFile.fetch({ id: fileId });

            // Parse encryption metadata
            // fileIvBase64 non ci serve, perché serirebbe solo per decriptare il file
            // wrapIvBase64 invece ci serve perché è l'IV usato per "wrappare" la chiave del file
            const [fileIvBase64, wrapIvBase64] = fileData.encryptionIv!.split(":");
            const wrapIv = new Uint8Array(base64ToArrayBuffer(wrapIvBase64!));

            // unwrap il file usando la chiave dell'utente (derivata dalla password)
            // e otteniamo la fileKey come CryptoKey
            const wrappedKey = base64ToArrayBuffer(fileData.wrappedKeyUser!);
            const fileKey = await clientEncryption.unwrapKey(wrappedKey, keyData.key, wrapIv, true);

            // Ora che abbiamo la fileKey, dovremmo esportarla in formato raw
            // e convertirla in base64 per inviarla al server.
            // Il server si occuperà di generare l'access code e assegnare il file
            // al destinatario, e poi wrapperà la fileKey con l'access code.

            // Per rendere la fileKey esportabile, dobbiamo mettere true il parametro extractable
            // alla riga 111 di encryption.ts .
            // Questo permette di esportare la chiave in formato raw, ma bisogna capire
            // se è sicuro e se influenza qualcosa nel processo di decriptazione, dato che
            // questo metodo viene usato anche per decriptare i file quando li scarichiamo.
            // Riga 66 di FileList.tsx
            const fileKeyRaw = await crypto.subtle.exportKey('raw', fileKey);
            const fileKeyBase64 = arrayBufferToBase64(fileKeyRaw);

            // Assign the file with the unwrapped key
            await assignFile.mutateAsync({
                recipientId,
                fileId,
                fileKeyBase64,
            });

        } catch (err) {
            console.error("Failed to assign file:", err);
            alert("Failed to assign file. Please try again.");
        } finally {
            setPendingFileId(null);
        }
    };

    // Handle password verification
    const handlePasswordVerified = () => {
        setShowPasswordPrompt(false);
        setFileSalt(null);
        if (pendingFileId) {
            void processFileAssignment(pendingFileId);
        }
    };

    // Handle file unassignment
    const handleUnassignFile = async (fileId: string) => {
        if (confirm("Are you sure you want to remove access to this file?")) {
            await unassignFile.mutateAsync({ recipientId, fileId });
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
        return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    };

    return (
        <div className="mt-4 border-t pt-4">
            <h4 className="font-semibold mb-3">File Assignments</h4>

            {/* Assigned Files */}
            {assignedFiles && assignedFiles.length > 0 && (
                <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Assigned Files</h5>
                    <div className="space-y-2">
                        {assignedFiles.map(file => (
                            <div key={file.id} className="flex justify-between items-center bg-green-50 p-2 rounded">
                                <div>
                                    <span className="font-medium">{file.title}</span>
                                    <span className="text-sm text-gray-600 ml-2">
                                        ({file.fileName} - {formatFileSize(file.fileSize ?? 0)})
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleUnassignFile(file.id)}
                                    className="text-red-500 hover:underline text-sm"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Available Files */}
            <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Available Files</h5>
                <div className="space-y-2">
                    {allFiles?.filter(file => !isFileAssigned(file.id)).map(file => (
                        <div key={file.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                            <div>
                                <span className="font-medium">{file.title}</span>
                                <span className="text-sm text-gray-600 ml-2">
                                    ({file.fileName} - {formatFileSize(file.fileSize ?? 0)})
                                </span>
                            </div>
                            <button
                                onClick={() => handleAssignFile(file.id)}
                                className="text-blue-500 hover:underline text-sm"
                                disabled={assignFile.isPending && pendingFileId === file.id}
                            >
                                {assignFile.isPending && pendingFileId === file.id ? "Assigning..." : "Assign"}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {(!allFiles || allFiles.length === 0) && (
                <p className="text-gray-500 text-sm">No files available. Upload files to the vault first.</p>
            )}

            {showPasswordPrompt && (
                <PasswordPrompt
                    onPasswordVerified={handlePasswordVerified}
                    onCancel={() => {
                        setShowPasswordPrompt(false);
                        setPendingFileId(null);
                        setFileSalt(null);
                    }}
                    salt={fileSalt ?? undefined}
                />
            )}
        </div>
    );
}
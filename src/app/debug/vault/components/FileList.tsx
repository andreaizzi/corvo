"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import PasswordPrompt from "./PasswordPrompt";
import { useEncryption } from "~/lib/encryption/EncryptionContext";
import { base64ToArrayBuffer, clientEncryption } from "~/lib/encryption/encryption";

interface FileListProps {
    categoryId?: string;
}

export default function FileList({ categoryId }: FileListProps) {
    const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
    const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
    const [editingFile, setEditingFile] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");

    const [userSalt, setUserSalt] = useState<Uint8Array | null>(null);

    const { getKey } = useEncryption();


    const { data: userSaltBase64 } = api.vault.getUserSalt.useQuery();

    useEffect(() => {
        if (userSaltBase64) {
            setUserSalt(new Uint8Array(base64ToArrayBuffer(userSaltBase64)));
        }
    }, [userSaltBase64]);

    const utils = api.useUtils();

    const { data: files, refetch } = api.vault.getFiles.useQuery({ categoryId });
    const downloadFile = api.vault.downloadFile.useMutation();
    const updateFile = api.vault.updateFile.useMutation({
        onSuccess: () => {
            setEditingFile(null);
            void refetch();
        },
    });
    const deleteFile = api.vault.deleteFile.useMutation({
        onSuccess: () => {
            void refetch();
        },
    });

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
        return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    };

    const decryptAndDownload = async (fileId: string) => {
        setShowPasswordPrompt(false);

        try {
            // Get encrypted file data from server
            const fileData = await downloadFile.mutateAsync({ id: fileId });

            // Parse encryption metadata
            const [fileIvBase64, wrapIvBase64] = fileData.encryptionIv.split(":");
            const fileIv = new Uint8Array(base64ToArrayBuffer(fileIvBase64));
            const wrapIv = new Uint8Array(base64ToArrayBuffer(wrapIvBase64));

            // Get the key from cache (it should be there now)
            const keyData = getKey();
            if (!keyData) {
                throw new Error("No encryption key available");
            }
            // Use the stored user key
            const { key: userKey } = keyData;

            // Unwrap the file key
            const wrappedKey = base64ToArrayBuffer(fileData.wrappedKeyUser);
            const fileKey = await clientEncryption.unwrapKey(wrappedKey, userKey, wrapIv);

            // Decrypt the file
            const encryptedData = base64ToArrayBuffer(fileData.encryptedData);
            const decryptedData = await clientEncryption.decryptFile(encryptedData, fileKey, fileIv);

            // Create blob and download
            const blob = new Blob([decryptedData], { type: fileData.fileType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileData.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setDownloadingFile(null);
        } catch (err) {
            console.error("Decryption error:", err);
            alert("Failed to decrypt file. Please try again.");
            setDownloadingFile(null);
        }
    };

    const handleDownload = async (fileId: string) => {
        const keyData = getKey();
        if (!keyData && userSalt) {
            setDownloadingFile(fileId);
            setShowPasswordPrompt(true);
        } else if (keyData) {
            setDownloadingFile(fileId);
            void decryptAndDownload(fileId);
        } else {
            alert("User encryption salt not initialized. Please refresh the page.");
        }
    };

    const handleEdit = (file: any) => {
        setEditingFile(file.id);
        setEditTitle(file.title);
        setEditDescription(file.description || "");
    };

    const handleUpdate = () => {
        if (!editingFile) return;

        updateFile.mutate({
            id: editingFile,
            title: editTitle,
            description: editDescription,
        });
    };

    const handleDelete = (fileId: string) => {
        if (confirm("Are you sure you want to delete this file?")) {
            deleteFile.mutate({ id: fileId });
        }
    };

    const handleToggleFavorite = (fileId: string, currentState: boolean) => {
        updateFile.mutate({
            id: fileId,
            isFavorite: !currentState,
        });
    };

    const handlePasswordVerified = () => {
        setShowPasswordPrompt(false);
        if (downloadingFile) {
            decryptAndDownload(downloadingFile);
        }
    };

    if (!files) {
        return <div>Loading...</div>;
    }

    if (files.length === 0) {
        return (
            <div className="p-6 rounded-lg shadow text-center text-gray-500">
                No files uploaded yet
            </div>
        );
    }

    return (
        <div className="rounded-lg shadow">
            <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Your Files</h2>

                <div className="space-y-2">
                    {files.map((file) => (
                        <div key={file.id} className="border rounded p-4">
                            {editingFile === file.id ? (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="w-full p-2 border rounded"
                                    />
                                    <textarea
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        className="w-full p-2 border rounded"
                                        rows={2}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleUpdate}
                                            className="px-4 py-2 bg-blue-500 text-white rounded"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setEditingFile(null)}
                                            className="px-4 py-2 bg-gray-300 rounded"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-semibold flex items-center gap-2">
                                                {file.title}
                                                {file.isFavorite && <span className="text-yellow-500">★</span>}
                                            </h3>
                                            {file.description && (
                                                <p className="text-sm text-gray-600">{file.description}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleToggleFavorite(file.id, file.isFavorite)}
                                                className="text-sm text-gray-600 hover:text-yellow-500"
                                            >
                                                {file.isFavorite ? "★" : "☆"}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="text-sm text-gray-500 mb-2">
                                        <span>{file.fileName}</span>
                                        <span className="mx-2">•</span>
                                        <span>{formatFileSize(file.fileSize)}</span>
                                        <span className="mx-2">•</span>
                                        <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleDownload(file.id)}
                                            disabled={downloadingFile === file.id}
                                            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                                        >
                                            {downloadingFile === file.id ? "Downloading..." : "Download"}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(file)}
                                            className="px-4 py-2 bg-gray-300 rounded"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(file.id)}
                                            className="px-4 py-2 bg-red-500 text-white rounded"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {showPasswordPrompt && userSalt && (
                <PasswordPrompt
                    onPasswordVerified={handlePasswordVerified}
                    onCancel={() => {
                        setShowPasswordPrompt(false);
                        setDownloadingFile(null);
                    }}
                    salt={userSalt}
                />
            )}
        </div>
    );
}
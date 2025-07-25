"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { clientEncryption, base64ToArrayBuffer } from "~/lib/encryption/encryption";
import { useEncryption } from "~/lib/encryption/EncryptionContext";
import PasswordPrompt from "./PasswordPrompt";

interface FileListProps {
    categoryId?: string;
}

export default function FileList({ categoryId }: FileListProps) {
    const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
    const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
    const [editingFile, setEditingFile] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");

    const { getKey } = useEncryption();

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
        const keyData = getKey();
        if (!keyData) {
            setDownloadingFile(fileId);
            setShowPasswordPrompt(true);
            return;
        }

        setShowPasswordPrompt(false);

        try {
            // Get encrypted file data from server
            const fileData = await downloadFile.mutateAsync({ id: fileId });

            // Parse encryption metadata
            const [fileIvBase64, wrapIvBase64] = fileData.encryptionIv!.split(":");
            const fileIv = new Uint8Array(base64ToArrayBuffer(fileIvBase64!));
            const wrapIv = new Uint8Array(base64ToArrayBuffer(wrapIvBase64!));
            const salt = new Uint8Array(base64ToArrayBuffer(fileData.keyDerivationSalt!));

            // Use the stored user key
            const { key: userKey } = keyData;

            // Unwrap the file key
            const wrappedKey = base64ToArrayBuffer(fileData.wrappedKeyUser!);
            const fileKey = await clientEncryption.unwrapKey(wrappedKey, userKey, wrapIv);

            // Decrypt the file
            const encryptedData = base64ToArrayBuffer(fileData.encryptedData);
            const decryptedData = await clientEncryption.decryptFile(encryptedData, fileKey, fileIv);

            // Create blob and download
            const blob = new Blob([decryptedData], { type: fileData.fileType ?? undefined });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileData.fileName ?? "download";
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

    const handleDownload = (fileId: string) => {
        decryptAndDownload(fileId);
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
            <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
                No files uploaded yet
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
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

            {showPasswordPrompt && (
                <PasswordPrompt
                    onPasswordVerified={handlePasswordVerified}
                    onCancel={() => {
                        setShowPasswordPrompt(false);
                        setDownloadingFile(null);
                    }}
                />
            )}
        </div>
    );
}
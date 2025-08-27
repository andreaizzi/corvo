"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import {
    base64ToArrayBuffer,
    clientEncryption,
} from "~/lib/encryption/encryption";
import {
    deriveRecipientKey,
    unwrapFileKeyWithRecipientKey,
} from "~/lib/encryption/recipientEncryption";

interface RecipientSession {
    recipientId: string;
    recipientName: string;
    accessCodeId: string;
    codeSalt: string;
    accessCode: string;
}

interface RecipientPortalProps {
    session: RecipientSession;
}

export default function RecipientPortal({ session }: RecipientPortalProps) {
    const [recipientKey, setRecipientKey] = useState<CryptoKey | null>(null);
    const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

    // Get files for this recipient
    const { data: files, isLoading } = api.recipientAccess.getFiles.useQuery({
        recipientId: session.recipientId,
        accessCodeId: session.accessCodeId,
    });

    // Download file mutation
    const downloadFile = api.recipientAccess.downloadFile.useMutation();

    // Derive recipient key when component mounts
    useEffect(() => {
        const salt = new Uint8Array(base64ToArrayBuffer(session.codeSalt));

        deriveRecipientKey(session.accessCode, salt).then((key) => {
            setRecipientKey(key);
        }).catch(err => {
            console.error("Failed to derive recipient key:", err);
        });
    }, [session.accessCode, session.codeSalt]);

    const handleDownload = async (fileId: string, fileName: string) => {
        if (!recipientKey) {
            alert("Encryption key not ready. Please refresh the page.");
            return;
        }

        setDownloadingFileId(fileId);

        try {
            // Get encrypted file data
            const fileData = await downloadFile.mutateAsync({
                recipientId: session.recipientId,
                accessCodeId: session.accessCodeId,
                fileId,
            });

            // Parse IVs
            const fileIv = new Uint8Array(base64ToArrayBuffer(fileData.fileIv));
            const wrapIv = new Uint8Array(base64ToArrayBuffer(fileData.wrapIv));

            // Unwrap file key using recipient key
            const wrappedFileKey = base64ToArrayBuffer(fileData.wrappedFileKey);
            const fileKey = await unwrapFileKeyWithRecipientKey(
                wrappedFileKey,
                recipientKey,
                wrapIv
            );

            // Decrypt file
            const encryptedData = base64ToArrayBuffer(fileData.encryptedData);
            const decryptedData = await clientEncryption.decryptFile(
                encryptedData,
                fileKey,
                fileIv
            );

            // Create download
            const blob = new Blob([decryptedData], { type: fileData.fileType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileData.fileName || fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (err) {
            console.error("Download failed:", err);
            alert("Failed to download file. Please try again.");
        } finally {
            setDownloadingFileId(null);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
        return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    };

    const handleLogout = () => {
        // Reload the page to clear session
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white p-8 rounded-lg shadow mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Digital Legacy Files</h1>
                            <p className="text-gray-600">
                                Welcome, <strong>{session.recipientName}</strong>
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="bg-white p-8 rounded-lg shadow text-center">
                        <p className="text-gray-600">Loading your files...</p>
                    </div>
                ) : files && files.length > 0 ? (
                    <div className="bg-white p-8 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Available Files</h2>
                        <div className="space-y-4">
                            {files.map((file) => (
                                <div key={file.id} className="border rounded p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold">{file.title}</h3>
                                            <p className="text-sm text-gray-600">
                                                {file.fileName} • {formatFileSize(file.fileSize ?? 0)}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDownload(file.id, file.fileName ?? file.title)}
                                            disabled={downloadingFileId === file.id}
                                            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
                                        >
                                            {downloadingFileId === file.id ? "Downloading..." : "Download"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-8 rounded-lg shadow text-center">
                        <p className="text-gray-600">No files are currently available.</p>
                    </div>
                )}

                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Important Notice</h3>
                    <p className="text-sm text-blue-800">
                        These files have been shared with you as part of someone's digital legacy.
                        Please download and save any files you need, as access may be time-limited.
                        All files are encrypted and can only be accessed with your credentials.
                    </p>
                </div>
            </div>
        </div>
    );
}
"use client";

import { useState, useCallback, useEffect } from "react";
import { api } from "~/trpc/react";
import { clientEncryption, generateRandomBytes, arrayBufferToBase64, ENCRYPTION_CONFIG, base64ToArrayBuffer } from "~/lib/encryption/encryption";
import { useEncryption } from "~/lib/encryption/EncryptionContext";
import PasswordPrompt from "./PasswordPrompt";

interface FileUploadProps {
    categoryId?: string;
    onUploadComplete: () => void;
}

export default function FileUpload({ categoryId, onUploadComplete }: FileUploadProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");
    const [userSalt, setUserSalt] = useState<Uint8Array | null>(null);

    const { getKey } = useEncryption();

    // Get user salt on component mount
    const { data: userSaltBase64 } = api.vault.getUserSalt.useQuery();

    useEffect(() => {
        if (userSaltBase64) {
            setUserSalt(new Uint8Array(base64ToArrayBuffer(userSaltBase64)));
        }
    }, [userSaltBase64]);

    const createFile = api.vault.createFile.useMutation({
        onSuccess: () => {
            setSelectedFile(null);
            setTitle("");
            setDescription("");
            onUploadComplete();
        },
        onError: (err) => {
            setError(err.message);
            setUploading(false);
        },
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setTitle(file.name);
            setError("");
        }
    };

    const encryptAndUpload = async () => {
        if (!selectedFile) return;

        const keyData = getKey();
        if (!keyData) {
            setShowPasswordPrompt(true);
            return;
        }

        setUploading(true);
        setShowPasswordPrompt(false);
        setError("");

        try {
            // Read file as ArrayBuffer
            const fileData = await selectedFile.arrayBuffer();

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
            const ivBase64 = arrayBufferToBase64(iv.buffer);
            const wrapIvBase64 = arrayBufferToBase64(wrapIv.buffer);

            // Create the encrypted IV string (combines file IV and wrap IV)
            const encryptionIv = `${ivBase64}:${wrapIvBase64}`;

            // Upload to server
            await createFile.mutateAsync({
                categoryId,
                title,
                description,
                fileName: selectedFile.name,
                fileSize: selectedFile.size,
                fileType: selectedFile.type,
                encryptedData: encryptedBase64,
                encryptionIv,
                wrappedKeyUser: wrappedKeyBase64,
            });
        } catch (err) {
            console.error("Encryption error:", err);
            setError("Failed to encrypt file");
            setUploading(false);
        }
    };

    const handleUpload = useCallback(() => {
        if (!selectedFile || !title) {
            setError("Please select a file and enter a title");
            return;
        }

        encryptAndUpload();
    }, [selectedFile, title]);

    const handlePasswordVerified = () => {
        setShowPasswordPrompt(false);
        encryptAndUpload();
    };

    return (
        <div className="p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Upload File</h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">File</label>
                    <input
                        type="file"
                        onChange={handleFileSelect}
                        className="w-full p-2 border rounded"
                        disabled={uploading}
                    />
                </div>

                {selectedFile && (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-1">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full p-2 border rounded"
                                disabled={uploading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Description (optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full p-2 border rounded"
                                rows={3}
                                disabled={uploading}
                            />
                        </div>

                        <div className="text-sm text-gray-600">
                            File size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                    </>
                )}

                {error && (
                    <div className="text-red-500 text-sm">{error}</div>
                )}

                <button
                    onClick={handleUpload}
                    disabled={!selectedFile || !title || uploading}
                    className="w-full bg-blue-500 text-white p-2 rounded disabled:opacity-50"
                >
                    {uploading ? "Encrypting and uploading..." : "Upload"}
                </button>
            </div>

            {showPasswordPrompt && userSalt && (
                <PasswordPrompt
                    // isOpen={showPasswordPrompt}
                    onPasswordVerified={handlePasswordVerified}
                    onCancel={() => setShowPasswordPrompt(false)}
                    salt={userSalt}
                />
            )}
        </div>
    );
}
"use client";

import { useState } from "react";
import { useEncryption } from "~/lib/encryption/EncryptionContext";
import { api } from "~/trpc/react";

interface PasswordPromptProps {
    onPasswordVerified: () => void;
    onCancel: () => void;
    salt?: Uint8Array; // Optional salt for deriving the same key
}

export default function PasswordPrompt({ onPasswordVerified, onCancel, salt }: PasswordPromptProps) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { deriveAndStoreKey } = useEncryption();

    const verifyPassword = api.vault.verifyPassword.useMutation({
        onSuccess: async () => {
            try {
                // Derive and store the key in memory (not the password!)
                // Use provided salt if decrypting existing files
                await deriveAndStoreKey(password, salt);
                onPasswordVerified();
            } catch (err) {
                setError("Failed to derive encryption key");
            }
        },
        onError: () => {
            setError("Invalid password");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        verifyPassword.mutate({ password });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="p-6 rounded-lg max-w-md w-full">
                <h2 className="text-xl font-bold mb-4">Enter Your Password</h2>
                <p className="text-gray-600 mb-4">
                    Your password is required to unlock encryption for this session.
                </p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full p-2 border rounded mb-2"
                        autoFocus
                    />

                    {error && (
                        <p className="text-red-500 text-sm mb-2">{error}</p>
                    )}

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={verifyPassword.isPending}
                            className="flex-1 bg-blue-500 text-white p-2 rounded disabled:opacity-50"
                        >
                            {verifyPassword.isPending ? "Verifying..." : "Unlock Vault"}
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 bg-gray-300 p-2 rounded"
                        >
                            Cancel
                        </button>
                    </div>
                </form>

                <p className="text-xs text-gray-500 mt-4">
                    Note: Your encryption key will be kept in memory for this session only.
                    You&apos;ll need to re-enter your password after refreshing the page.
                </p>
            </div>
        </div>
    );
}
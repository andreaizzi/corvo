"use client";

import { useEncryption } from "~/lib/encryption/EncryptionContext";


export default function VaultStatus() {
    const { hasKey, clearKey } = useEncryption();

    if (!hasKey) {
        return (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                <span className="font-bold">Vault Locked:</span> You&apos;ll need to enter your password to access encrypted files.
            </div>
        );
    }

    return (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
            <div>
                <span className="font-bold">Vault Unlocked:</span> Your encryption key is loaded in memory.
            </div>
            <button
                onClick={clearKey}
                className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
                Lock Vault
            </button>
        </div>
    );
}
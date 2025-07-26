"use client";

import React, { createContext, useContext, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { keyCache } from "./encryption";

interface EncryptionContextType {
    hasKey: boolean;
    deriveAndStoreKey: (password: string, salt?: Uint8Array) => Promise<{ key: CryptoKey; salt: Uint8Array }>;
    getKey: () => { key: CryptoKey; salt: Uint8Array } | null;
    clearKey: () => void;
}

const EncryptionContext = createContext<EncryptionContextType | undefined>(undefined);

export function EncryptionProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();

    // Clear key when user logs out
    useEffect(() => {
        if (status === "unauthenticated") {
            keyCache.clear();
        }
    }, [status]);

    // Clear key when component unmounts (browser closes/refreshes)
    useEffect(() => {
        const handleBeforeUnload = () => {
            keyCache.clear();
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            keyCache.clear();
        };
    }, []);

    const deriveAndStoreKey = useCallback(async (password: string, salt?: Uint8Array) => {
        return keyCache.deriveAndStore(password, salt);
    }, []);

    const getKey = useCallback(() => {
        return keyCache.get();
    }, []);

    const clearKey = useCallback(() => {
        keyCache.clear();
    }, []);

    const hasKey = !!keyCache.get();

    return (
        <EncryptionContext.Provider
            value={{
                hasKey,
                deriveAndStoreKey,
                getKey,
                clearKey,
            }}
        >
            {children}
        </EncryptionContext.Provider>
    );
}

export function useEncryption() {
    const context = useContext(EncryptionContext);
    if (context === undefined) {
        throw new Error("useEncryption must be used within an EncryptionProvider");
    }
    return context;
}
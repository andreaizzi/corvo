"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import RecipientPortal from "./components/RecipientPortal";

export default function RecipientAccessPage() {
    const [email, setEmail] = useState("");
    const [accessCode, setAccessCode] = useState("");
    const [recipientSession, setRecipientSession] = useState<{
        recipientId: string;
        recipientName: string;
        accessCodeId: string;
        codeSalt: string;
        accessCode: string;
    } | null>(null);

    const login = api.recipientAccess.login.useMutation({
        onSuccess: (data) => {
            // Store session data
            setRecipientSession({
                recipientId: data.recipientId,
                recipientName: data.recipientName,
                accessCodeId: data.accessCodeId,
                codeSalt: data.codeSalt,
                accessCode: accessCode, // Keep the plaintext access code for key derivation
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!email || !accessCode) {
            alert("Please enter both email and access code");
            return;
        }

        // Convert access code to lowercase for case-insensitive comparison
        const normalizedCode = accessCode.toLowerCase().trim();

        login.mutate({
            email: email.trim(),
            accessCode: normalizedCode,
        });
    };

    // If logged in, show the portal
    if (recipientSession) {
        return <RecipientPortal session={recipientSession} />;
    }

    // Show login form
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow max-w-md w-full">
                <h1 className="text-2xl font-bold mb-6 text-center">Access Your Digital Legacy</h1>

                {login.error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {login.error.message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Use the email address where you received the notification
                        </p>
                    </div>

                    <div>
                        <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-1">
                            Access Code
                        </label>
                        <input
                            type="text"
                            id="accessCode"
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value)}
                            placeholder="word-word-word-word"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Enter the 4-word access code from your email
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={login.isPending}
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {login.isPending ? "Logging in..." : "Access Files"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    <p>Don&apos;t have your access code?</p>
                    <p>Check the email notification you received.</p>
                </div>
            </div>
        </div>
    );
}
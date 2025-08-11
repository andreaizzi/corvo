"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export default function TriggerTestPage() {
    const [activationResults, setActivationResults] = useState<any[]>([]);
    const [testMode, setTestMode] = useState(true);

    const utils = api.useUtils();
    const { data: triggerStatus, isLoading } = api.trigger.getTriggerStatus.useQuery();

    const activateTrigger = api.trigger.activateTrigger.useMutation({
        onSuccess: (data) => {
            setActivationResults(data.results);
            void utils.trigger.getTriggerStatus.invalidate();
        },
    });

    const deactivateTriggers = api.trigger.deactivateAllTriggers.useMutation({
        onSuccess: () => {
            setActivationResults([]);
            void utils.trigger.getTriggerStatus.invalidate();
        },
    });

    const handleActivate = () => {
        if (confirm(`Are you sure you want to activate the trigger${testMode ? ' in TEST MODE' : ' and SEND EMAILS'}?`)) {
            activateTrigger.mutate({ testMode });
        }
    };

    const handleDeactivate = () => {
        if (confirm("Are you sure you want to deactivate all triggers? This is for testing only.")) {
            deactivateTriggers.mutate();
        }
    };

    if (isLoading) {
        return <div className="container mx-auto p-6">Loading trigger status...</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Dead Man's Switch Test Page</h1>

            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 p-4 rounded mb-6">
                <strong>Warning:</strong> This page is for testing purposes only. In production,
                the trigger would be activated automatically based on check-in status.
            </div>

            {/* Status Overview */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h2 className="text-xl font-semibold mb-4">Trigger Status</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Total Recipients</p>
                        <p className="text-2xl font-bold">{triggerStatus?.totalRecipients ?? 0}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">With Access Codes</p>
                        <p className="text-2xl font-bold">{triggerStatus?.recipientsWithAccessCodes ?? 0}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Activated</p>
                        <p className="text-2xl font-bold">{triggerStatus?.activatedRecipients ?? 0}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">With Files</p>
                        <p className="text-2xl font-bold">{triggerStatus?.recipientsWithFiles ?? 0}</p>
                    </div>
                </div>

                {triggerStatus?.readyForActivation && (
                    <div className="mt-4 p-3 bg-green-100 text-green-700 rounded">
                        ✓ System is ready for trigger activation
                    </div>
                )}
            </div>

            {/* Recipient Details */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h2 className="text-xl font-semibold mb-4">Recipients</h2>
                <div className="space-y-2">
                    {triggerStatus?.recipients.map((recipient) => (
                        <div key={recipient.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <div>
                                <p className="font-medium">{recipient.name}</p>
                                <p className="text-sm text-gray-600">{recipient.email}</p>
                                <p className="text-xs text-gray-500">
                                    {recipient.fileCount} files assigned
                                </p>
                            </div>
                            <div className="text-right">
                                {recipient.isActive ? (
                                    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded text-sm">
                                        Active
                                    </span>
                                ) : recipient.hasAccessCode ? (
                                    <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                                        Ready
                                    </span>
                                ) : (
                                    <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded text-sm">
                                        No Access Code
                                    </span>
                                )}
                                {recipient.activatedAt && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Activated: {new Date(recipient.activatedAt).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Activation Controls */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h2 className="text-xl font-semibold mb-4">Trigger Controls</h2>

                <div className="mb-4">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={testMode}
                            onChange={(e) => setTestMode(e.target.checked)}
                            className="mr-2"
                        />
                        <span>Test Mode (don't send actual emails)</span>
                    </label>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleActivate}
                        disabled={activateTrigger.isPending || !triggerStatus?.readyForActivation}
                        className="bg-red-500 text-white px-6 py-2 rounded disabled:opacity-50"
                    >
                        {activateTrigger.isPending ? "Activating..." : "Activate Trigger"}
                    </button>

                    <button
                        onClick={handleDeactivate}
                        disabled={deactivateTriggers.isPending || triggerStatus?.activatedRecipients === 0}
                        className="bg-gray-500 text-white px-6 py-2 rounded disabled:opacity-50"
                    >
                        {deactivateTriggers.isPending ? "Deactivating..." : "Deactivate All (Test)"}
                    </button>
                </div>
            </div>

            {/* Activation Results */}
            {activationResults.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Activation Results</h2>
                    <div className="space-y-2">
                        {activationResults.map((result, index) => (
                            <div
                                key={index}
                                className={`p-3 rounded ${result.status === 'success'
                                        ? 'bg-green-100 text-green-700'
                                        : result.status === 'already_active'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-red-100 text-red-700'
                                    }`}
                            >
                                <p className="font-medium">{result.recipientName}</p>
                                <p className="text-sm">{result.message}</p>
                                {result.accessUrl && (
                                    <p className="text-xs mt-1 font-mono break-all">
                                        Access URL: {result.accessUrl}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
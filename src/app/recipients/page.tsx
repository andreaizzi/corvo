"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import FileAssignment from "./components/FileAssignment";

export default function RecipientsPage() {
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        email: "",
        fullName: "",
        phoneNumber: "",
        relationship: "",
        notes: "",
    });

    const utils = api.useUtils();
    const { data: recipients, isLoading } = api.recipients.getAll.useQuery();

    const createRecipient = api.recipients.create.useMutation({
        onSuccess: () => {
            void utils.recipients.getAll.invalidate();
            setIsCreating(false);
            resetForm();
        },
    });

    const updateRecipient = api.recipients.update.useMutation({
        onSuccess: () => {
            void utils.recipients.getAll.invalidate();
            setEditingId(null);
            resetForm();
        },
    });

    const deleteRecipient = api.recipients.delete.useMutation({
        onSuccess: () => {
            void utils.recipients.getAll.invalidate();
        },
    });

    const resetForm = () => {
        setFormData({
            email: "",
            fullName: "",
            phoneNumber: "",
            relationship: "",
            notes: "",
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingId) {
            updateRecipient.mutate({
                id: editingId,
                ...formData,
            });
        } else {
            createRecipient.mutate(formData);
        }
    };

    const handleEdit = (recipient: any) => {
        setEditingId(recipient.id);
        setFormData({
            email: recipient.email,
            fullName: recipient.fullName,
            phoneNumber: recipient.phoneNumber || "",
            relationship: recipient.relationship || "",
            notes: recipient.notes || "",
        });
        setIsCreating(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this recipient? This will remove all file assignments.")) {
            deleteRecipient.mutate({ id });
        }
    };

    if (isLoading) {
        return <div className="container mx-auto p-6">Loading recipients...</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Recipients</h1>

            <div className="mb-6">
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    {isCreating ? "Cancel" : "Add Recipient"}
                </button>
            </div>

            {isCreating && (
                <div className="bg-gray-900 p-6 rounded-lg mb-6">
                    <h2 className="text-xl font-bold mb-4">
                        {editingId ? "Edit Recipient" : "Add New Recipient"}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Email *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full p-2 border rounded"
                                required
                                disabled={!!editingId}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Full Name *</label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Phone Number</label>
                            <input
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                className="w-full p-2 border rounded"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Relationship</label>
                            <input
                                type="text"
                                value={formData.relationship}
                                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                                className="w-full p-2 border rounded"
                                placeholder="e.g., Spouse, Child, Friend"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Notes</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full p-2 border rounded"
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="bg-blue-500 text-white px-4 py-2 rounded"
                                disabled={createRecipient.isPending || updateRecipient.isPending}
                            >
                                {editingId ? "Update" : "Create"} Recipient
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCreating(false);
                                    setEditingId(null);
                                    resetForm();
                                }}
                                className="bg-gray-300 px-4 py-2 rounded"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-4">
                {recipients?.map((recipient) => (
                    <div key={recipient.id} className="p-6 rounded-lg shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-semibold">{recipient.fullName}</h3>
                                <p className="text-gray-600">{recipient.email}</p>
                                {recipient.phoneNumber && (
                                    <p className="text-gray-600">{recipient.phoneNumber}</p>
                                )}
                                {recipient.relationship && (
                                    <p className="text-sm text-gray-500">Relationship: {recipient.relationship}</p>
                                )}
                                {recipient.notes && (
                                    <p className="text-sm text-gray-500 mt-2">{recipient.notes}</p>
                                )}
                                <p className="text-sm text-gray-500 mt-2">
                                    Assigned Files: {recipient.assignedFilesCount}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Status: {recipient.accessCode?.isActive ? "Active" : "Inactive"}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSelectedRecipientId(
                                        selectedRecipientId === recipient.id ? null : recipient.id
                                    )}
                                    className="text-blue-500 hover:underline"
                                >
                                    {selectedRecipientId === recipient.id ? "Hide Files" : "Manage Files"}
                                </button>
                                <button
                                    onClick={() => handleEdit(recipient)}
                                    className="text-blue-500 hover:underline"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(recipient.id)}
                                    className="text-red-500 hover:underline"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>

                        {selectedRecipientId === recipient.id && (
                            <FileAssignment recipientId={recipient.id} />
                        )}
                    </div>
                ))}
            </div>

            {recipients?.length === 0 && (
                <div className="bg-gray-900 p-6 rounded-lg text-center text-gray-500">
                    No recipients added yet. Click "Add Recipient" to get started.
                </div>
            )}
        </div>
    );
}
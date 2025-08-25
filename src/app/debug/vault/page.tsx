"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { FileList, FileUpload, VaultStatus } from "./components";

export default function VaultPage() {
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

    const { data: categories, refetch: refetchCategories } = api.vault.getCategories.useQuery();
    const createCategory = api.vault.createCategory.useMutation({
        onSuccess: () => {
            // Refetch categories
            void refetchCategories();
        },
    });

    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [categoryName, setCategoryName] = useState("");

    const handleUploadComplete = () => {
        // Force refresh of file list
        setRefreshKey((k) => k + 1);
    };

    const handleCreateCategory = () => {
        if (!categoryName.trim()) return;

        createCategory.mutate({
            name: categoryName,
            description: "",
        });

        setCategoryName("");
        setShowCategoryForm(false);
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Digital Vault</h1>

            <VaultStatus />

            <div className="mb-6">
                <div className="flex gap-2 items-center mb-4">
                    <label className="font-medium">Category:</label>
                    <select
                        value={selectedCategory ?? ""}
                        onChange={(e) => setSelectedCategory(e.target.value || undefined)}
                        className="p-2 border rounded"
                    >
                        <option value="">All Files</option>
                        {categories?.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>

                    {!showCategoryForm && (
                        <button
                            onClick={() => setShowCategoryForm(true)}
                            className="px-4 py-2 bg-green-500 text-white rounded"
                        >
                            New Category
                        </button>
                    )}
                </div>

                {showCategoryForm && (
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            placeholder="Category name"
                            className="p-2 border rounded"
                            autoFocus
                        />
                        <button
                            onClick={handleCreateCategory}
                            className="px-4 py-2 bg-green-500 text-white rounded"
                        >
                            Create
                        </button>
                        <button
                            onClick={() => {
                                setShowCategoryForm(false);
                                setCategoryName("");
                            }}
                            className="px-4 py-2 bg-gray-300 rounded"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <div>
                    <FileUpload
                        categoryId={selectedCategory}
                        onUploadComplete={handleUploadComplete}
                    />
                </div>

                <div>
                    <FileList key={refreshKey} categoryId={selectedCategory} />
                </div>
            </div>
        </div>
    );
}
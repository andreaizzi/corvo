"use client";

import { Box, Container, Stack } from "@chakra-ui/react";
import { useState } from "react";
import { api } from "~/trpc/react";
import { VaultHeader } from "./components/VaultHeader";
import { SearchAndFilters } from "./components/SearchAndFilters";
import { CategoryTabs } from "./components/CategoryTabs";
import { FileGrid } from "./components/FileGrid";
import { FileManagementDialog, PasswordPromptDialog } from "./components";
import { useFileDownload, useRecipientAssignment } from "./hooks";
import type { VaultFile } from "./types";
import { categories } from "./data";

export default function VaultPage() {
    // State Management
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFile, setSelectedFile] = useState<VaultFile | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);

    // API Queries
    const { data: files, isLoading: filesLoading, refetch } = api.vault.getFiles.useQuery({});
    const { data: recipients, isLoading: recipientsLoading } = api.recipients.getAll.useQuery();

    // Custom Hooks
    const {
        downloadingFile,
        handleDownload,
        setDownloadingFile,
        decryptAndDownload
    } = useFileDownload();

    const {
        handleAssign,
        processFileAssignment,
        setPendingFile,
        pendingFile,
        selectedRecipientId,
    } = useRecipientAssignment({
        refetch: () => void refetch(),
        setShowPasswordDialog,
    });

    // Event Handlers
    const handleFileClick = (file: VaultFile) => {
        setSelectedFile(file);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setSelectedFile(null);
    };

    const handleClosePasswordDialog = () => {
        setShowPasswordDialog(false);
        setDownloadingFile(null);
        setPendingFile(null);
    };

    const handleDownloadClick = async (file: VaultFile) => {
        await handleDownload(file, setShowPasswordDialog);
    };

    const handlePasswordVerified = () => {
        if (downloadingFile) {
            void decryptAndDownload(downloadingFile);
        }
        if (pendingFile && selectedRecipientId) {
            void processFileAssignment(pendingFile, selectedRecipientId);
        }
    };

    const isLoading = filesLoading || recipientsLoading;

    return (
        <Box minH="100vh" bg="black">
            <Container p={{ base: 4, md: 6, lg: 8 }}>
                <Stack gap={6}>
                    <VaultHeader />

                    <SearchAndFilters
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                    />

                    <CategoryTabs
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onCategoryChange={setSelectedCategory}
                    />

                    <FileGrid
                        files={files}
                        recipients={recipients}
                        isLoading={isLoading}
                        downloadingFile={downloadingFile}
                        pendingFile={pendingFile}
                        onFileClick={handleFileClick}
                        onDownload={handleDownloadClick}
                        onAssign={handleAssign}
                    />
                </Stack>
            </Container>

            {selectedFile && (
                <FileManagementDialog
                    file={selectedFile}
                    downloadingFile={downloadingFile}
                    isOpen={isDialogOpen}
                    handleDownload={() => handleDownloadClick(selectedFile)}
                    onCloseAction={handleCloseDialog}
                    refetch={refetch}
                />
            )}

            {showPasswordDialog && (
                <PasswordPromptDialog
                    isOpen={showPasswordDialog}
                    onPasswordVerified={() => {
                        setShowPasswordDialog(false);
                        handlePasswordVerified();
                    }}
                    onCloseAction={handleClosePasswordDialog}
                />
            )}
        </Box>
    );
}
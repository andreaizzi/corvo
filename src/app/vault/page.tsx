"use client";

import { Box, Button, Container, Stack } from "@chakra-ui/react";
import { useState } from "react";
import { api } from "~/trpc/react";
import { FileManagementDialog, PasswordPromptDialog, UploadFileDialog } from "./components";
import { CategoryTabs } from "./components/CategoryTabs";
import { FileGrid } from "./components/FileGrid";
import { SearchAndFilters } from "./components/SearchAndFilters";
import { VaultHeader } from "./components/VaultHeader";
import { categories } from "./data";
import { useFileDownload, useRecipientAssignment } from "./hooks";
import { useFileUpload } from "./hooks/useFileUpload";
import type { VaultFile } from "./types";

export default function VaultPage() {
    // State Management
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFile, setSelectedFile] = useState<VaultFile | null>(null);
    const [openFileDialog, setOpenFileDialog] = useState(false);
    const [openUploadDialog, setOpenUploadDialog] = useState(false);
    const [openPasswordDialog, setOpenPasswordDialog] = useState(false);

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
        uploadedFile,
        setUploadedFile,
        handleUpload,
        isUploading,
        fileName,
        fileDescription,
        setFileName,
        setFileDescription
    } = useFileUpload({
        refetch: () => void refetch(),
        setOpenUploadDialog: setOpenUploadDialog,
    });

    const {
        handleAssign,
        processFileAssignment,
        setPendingFile,
        pendingFile,
        selectedRecipientId,
    } = useRecipientAssignment({
        refetch: () => void refetch(),
        setOpenPasswordDialog: setOpenPasswordDialog,
    });

    // Event Handlers
    const handleFileClick = (file: VaultFile) => {
        setSelectedFile(file);
        setOpenFileDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenFileDialog(false);
        setSelectedFile(null);
    };

    const handleClosePasswordDialog = () => {
        setOpenPasswordDialog(false);
        setDownloadingFile(null);
        setPendingFile(null);
    };

    const handleCloseUploadDialog = () => {
        setOpenUploadDialog(false);
        setUploadedFile(null);
        setFileName("");
        setFileDescription("");
    };

    const handleDownloadClick = async (file: VaultFile) => {
        await handleDownload(file, setOpenPasswordDialog);
    };

    const handlePasswordVerified = () => {
        if (downloadingFile) {
            void decryptAndDownload(downloadingFile);
        }
        if (pendingFile && selectedRecipientId) {
            void processFileAssignment(pendingFile, selectedRecipientId);
        }
        if (isUploading && uploadedFile) {
            void handleUpload(uploadedFile, setOpenPasswordDialog);
        }
    };

    const isLoading = filesLoading || recipientsLoading;

    return (
        <Box minH="100vh" bg="black">
            <Container p={{ base: 4, md: 6, lg: 8 }}>
                <Stack gap={6}>
                    <VaultHeader
                        setOpenUploadDialog={setOpenUploadDialog}
                    />

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
                    isOpen={openFileDialog}
                    handleDownload={() => handleDownloadClick(selectedFile)}
                    onCloseAction={handleCloseDialog}
                    refetch={refetch}
                />
            )}

            {openUploadDialog && (
                <UploadFileDialog
                    fileName={fileName}
                    fileDescription={fileDescription}
                    uploadedFile={uploadedFile}
                    isUploading={isUploading}
                    isOpen={openUploadDialog}
                    onClose={handleCloseUploadDialog}
                    setFileName={setFileName}
                    setFileDescription={setFileDescription}
                    setUploadedFile={setUploadedFile}
                    recipients={recipients}
                    onUpload={async () => {
                        await handleUpload(uploadedFile!, setOpenPasswordDialog);
                    }}
                />
            )}

            {openPasswordDialog && (
                <PasswordPromptDialog
                    isOpen={openPasswordDialog}
                    onPasswordVerified={() => {
                        setOpenPasswordDialog(false);
                        handlePasswordVerified();
                    }}
                    onCloseAction={handleClosePasswordDialog}
                />
            )}
        </Box>
    );
}
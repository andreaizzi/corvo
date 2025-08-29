// src/app/vault/components/FileGrid.tsx
import { Grid } from "@chakra-ui/react";
import { FileCard } from "./FileCard";
import { LoadingState } from "./LoadingState";
import type { VaultFile, Recipient } from "../types";
import type { SelectionDetails } from "node_modules/@chakra-ui/react/dist/types/components/menu/namespace";
import { EmptyState } from "./EmptyState";
import { useState } from "react";

interface FileGridProps {
    files: VaultFile[] | undefined;
    recipients: Recipient[] | undefined;
    isLoading: boolean;
    downloadingFile: VaultFile | null;
    pendingFile: VaultFile | null;
    onFileClick: (file: VaultFile) => void;
    onDownload: (file: VaultFile) => void;
    onAssign: (file: VaultFile, event: SelectionDetails) => Promise<void>;
}

export function FileGrid({
    files,
    recipients,
    isLoading,
    downloadingFile,
    pendingFile,
    onFileClick,
    onDownload,
    onAssign,
}: FileGridProps) {
    const [fileRecipientsHover, setFileRecipientsHover] = useState<VaultFile | null>(null);
    const [fileRecipientsOpen, setFileRecipientsOpen] = useState<VaultFile | null>(null);

    if (isLoading || !recipients) {
        return <LoadingState />;
    }

    if (!files || files.length === 0) {
        return <EmptyState />;
    }

    return (
        <Grid
            templateColumns={{
                base: "1fr",
                md: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
                xl: "repeat(4, 1fr)",
            }}
            gap={6}
        >
            {files?.map((file) => (
                <FileCard
                    key={file.id}
                    file={file}
                    recipients={recipients}
                    isDownloading={downloadingFile?.id === file.id}
                    isPending={pendingFile?.id === file.id}
                    isHovered={fileRecipientsHover?.id === file.id}
                    isOpen={fileRecipientsOpen?.id === file.id}
                    onFileClick={onFileClick}
                    onDownload={onDownload}
                    onAssign={onAssign}
                    onRecipientsHover={setFileRecipientsHover}
                    onRecipientsOpen={setFileRecipientsOpen}
                />
            ))}
        </Grid>
    );
}
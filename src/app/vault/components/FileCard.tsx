// src/app/vault/components/FileCard.tsx
import {
    Box,
    Button,
    Card,
    Flex,
    Icon,
    IconButton,
    Spinner,
    Stack,
    Text,
} from "@chakra-ui/react";
import { LuDownload, LuEye, LuSettings } from "react-icons/lu";
import { RecipientSelector } from "./RecipientSelector";
import { formatDate, formatFileSize, getFileIcon } from "../utils";
import type { VaultFile, Recipient } from "../types";
import type { SelectionDetails } from "node_modules/@chakra-ui/react/dist/types/components/menu/namespace";

interface FileCardProps {
    file: VaultFile;
    recipients: Recipient[];
    isDownloading: boolean;
    isPending: boolean;
    isHovered: boolean;
    isOpen: boolean;
    onFileClick: (file: VaultFile) => void;
    onDownload: (file: VaultFile) => void;
    onAssign: (file: VaultFile, event: SelectionDetails) => Promise<void>;
    onRecipientsHover: (file: VaultFile | null) => void;
    onRecipientsOpen: (file: VaultFile | null) => void;
}

export function FileCard({
    file,
    recipients,
    isDownloading,
    isPending,
    isHovered,
    isOpen,
    onFileClick,
    onDownload,
    onAssign,
    onRecipientsHover,
    onRecipientsOpen,
}: FileCardProps) {
    return (
        <Card.Root
            borderColor="zinc.800"
            borderWidth={1}
            _hover={{ borderColor: "zinc.700", cursor: "pointer" }}
            onClick={() => onFileClick(file)}
        >
            <Card.Body p={7}>
                <Stack gap={5}>
                    <FileHeader file={file} />

                    <RecipientSelector
                        file={file}
                        recipients={recipients}
                        isHovered={isHovered}
                        isOpen={isOpen}
                        isPending={isPending}
                        onAssign={onAssign}
                        onHover={onRecipientsHover}
                        onOpen={onRecipientsOpen}
                    />

                    <FileActions
                        isDownloading={isDownloading}
                        onManageClick={() => onFileClick(file)}
                        onViewClick={() => console.log("Preview", file.id)}
                        onDownloadClick={() => onDownload(file)}
                    />
                </Stack>
            </Card.Body>
        </Card.Root>
    );
}

function FileHeader({ file }: { file: VaultFile }) {
    return (
        <Flex gap={3} align="center">
            <IconButton colorPalette="gray" size="lg" variant="subtle">
                <Icon as={getFileIcon(file.fileType)} />
            </IconButton>
            <Box flex={1} width="50%">
                <Text fontSize="lg" fontWeight="medium" color="neutral.50" truncate>
                    {file.title}
                </Text>
                <Text fontWeight="md" fontSize="sm" color="fg.muted">
                    {formatFileSize(file.fileSize)} • {formatDate(file.createdAt)}
                </Text>
            </Box>
        </Flex>
    );
}

function FileActions({
    isDownloading,
    onManageClick,
    onViewClick,
    onDownloadClick,
}: {
    isDownloading: boolean;
    onManageClick: () => void;
    onViewClick: () => void;
    onDownloadClick: () => void;
}) {
    return (
        <Flex gap={2}>
            <Button
                flex={1}
                bg="#300c0c"
                color="red.300"
                _hover={{ bg: "red.900/50" }}
                size="lg"
                onClick={(e) => {
                    e.stopPropagation();
                    onManageClick();
                }}
            >
                <LuSettings /> Manage
            </Button>
            <IconButton
                colorPalette="gray"
                size="lg"
                variant="subtle"
                aria-label="View"
                onClick={(e) => {
                    e.stopPropagation();
                    onViewClick();
                }}
            >
                <LuEye />
            </IconButton>
            <IconButton
                colorPalette="gray"
                size="lg"
                variant="subtle"
                aria-label="Download"
                onClick={(e) => {
                    e.stopPropagation();
                    onDownloadClick();
                }}
                disabled={isDownloading}
            >
                {isDownloading ? <Spinner size="sm" /> : <LuDownload />}
            </IconButton>
        </Flex>
    );
}
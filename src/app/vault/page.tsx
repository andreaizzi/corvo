"use client";

import {
    Badge,
    Box,
    Button,
    Card,
    Container,
    Flex,
    Grid,
    Heading,
    Icon,
    IconButton,
    Input,
    InputGroup,
    Stack,
    Text
} from "@chakra-ui/react";
import { useState } from "react";
import {
    LuArrowUpDown,
    LuDownload,
    LuEye,
    LuFilter,
    LuSearch,
    LuSettings
} from "react-icons/lu";

import FileManagementDialog from "./components/FileManagementDialog";

import { useEncryption } from "~/lib/encryption/EncryptionContext";
import { base64ToArrayBuffer, clientEncryption } from "~/lib/encryption/encryption";
import { api } from "~/trpc/react";
import { PasswordPromptDialog } from "./components";
import { categories } from "./data";
import type { VaultFile } from "./type";
import { formatDate, formatFileSize, getFileIcon } from "./utils";


export default function VaultPage() {
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFile, setSelectedFile] = useState<VaultFile | null>(null);
    const [downloadingFile, setDownloadingFile] = useState<VaultFile | null>(null);
    const [fileSalt, setFileSalt] = useState<Uint8Array | null>(null);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const { getKey } = useEncryption();

    // In production, these would be tRPC queries
    const { data: files, refetch } = api.vault.getFiles.useQuery({/* categoryId: selectedCategory */ });
    // const { data: categories } = api.vault.getCategories.useQuery();
    const downloadFile = api.vault.downloadFile.useMutation();

    const decryptAndDownload = async (file: VaultFile) => {
        // setShowPasswordDialog(false);

        try {
            // Get encrypted file data from server
            const fileData = await downloadFile.mutateAsync({ id: file.id });

            // Parse encryption metadata
            const [fileIvBase64, wrapIvBase64] = fileData.encryptionIv.split(":");
            const fileIv = new Uint8Array(base64ToArrayBuffer(fileIvBase64!));
            const wrapIv = new Uint8Array(base64ToArrayBuffer(wrapIvBase64!));

            // Get the key from cache (it should be there now)
            const keyData = getKey();
            if (!keyData) {
                throw new Error("No encryption key available");
            }
            // Use the stored user key
            const { key: userKey } = keyData;

            // Unwrap the file key
            const wrappedKey = base64ToArrayBuffer(fileData.wrappedKeyUser);
            const fileKey = await clientEncryption.unwrapKey(wrappedKey, userKey, wrapIv);

            // Decrypt the file
            const encryptedData = base64ToArrayBuffer(fileData.encryptedData);
            const decryptedData = await clientEncryption.decryptFile(encryptedData, fileKey, fileIv);

            // Create blob and download
            const blob = new Blob([decryptedData], { type: fileData.fileType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileData.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setDownloadingFile(null);
        } catch (err) {
            console.error("Decryption error:", err);
            alert("Failed to decrypt file. Please try again.");
            setDownloadingFile(null);
        }
    };

    const handleFileClick = (file: VaultFile) => {
        setSelectedFile(file);
        setIsDialogOpen(true);
    };

    const handleDownload = async (file: VaultFile) => {
        const keyData = getKey();
        if (!keyData) {
            // We need to get the salt from the file first
            setDownloadingFile(file);

            try {
                // Get file metadata including salt using tRPC utils
                // const file = await api.vault.getFile.query({ id: fileId });
                const salt = new Uint8Array(base64ToArrayBuffer(file.keyDerivationSalt));
                setFileSalt(salt);
                setShowPasswordDialog(true);
            } catch (err) {
                console.error("Failed to get file metadata:", err);
                setDownloadingFile(null);
            }
        } else {
            // Key is already cached, proceed with download
            setDownloadingFile(file);
            void decryptAndDownload(file);
        }
    };

    const handlePasswordVerified = () => {
        setShowPasswordDialog(false);
        setFileSalt(null);
        if (downloadingFile) {
            void decryptAndDownload(downloadingFile);
        }
    };

    return (
        <Box minH="100vh" bg="black">
            <Container p={{ base: 4, md: 6, lg: 8 }}>
                <Stack gap={6}>
                    {/* Header */}
                    <Box>
                        <Heading size="4xl" color="white" fontWeight="bold" mb={2}>
                            Vault
                        </Heading>
                        <Text color="zinc.400" fontSize="md">
                            Securely store and manage your digital assets
                        </Text>
                    </Box>

                    {/* Search and Filters */}
                    <Flex gap={4} align="center">
                        <InputGroup flex={1} maxW="100%" startElement={<LuSearch />}>
                            <Input
                                placeholder="Search digital assets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                size="lg"
                            />
                        </InputGroup>

                        <Button
                            variant="outline"
                            size="lg"
                        >
                            <LuFilter />
                            Filter
                        </Button>

                        <IconButton
                            aria-label="Sort"
                            variant="outline"
                            size="lg"
                        >
                            <LuArrowUpDown />
                        </IconButton>
                    </Flex>

                    {/* Category Tabs */}
                    <Flex gap={2} wrap="wrap">
                        {categories.map((category) => (
                            <Button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                bg={selectedCategory === category.id ? "red.600" : "bg.subtle"}
                                color="white"
                                borderWidth={selectedCategory !== category.id ? 1 : 0}
                                borderColor="zinc.800"
                                _hover={{
                                    bg: selectedCategory === category.id ? "red.700" : "zinc.900",
                                }}
                                size="lg"
                            >
                                {category.name}
                                <Badge
                                    ml={3}
                                    bg={selectedCategory === category.id ? "red.700" : "zinc.900"}
                                    color="white"
                                    px={1.5}
                                    py={0.5}
                                    borderRadius="sm"
                                    fontSize="xs"
                                >
                                    {category.count}
                                </Badge>
                            </Button>
                        ))}
                    </Flex>

                    {!files ? <div>Loading... </div> : (
                        files.length === 0 ? (
                            <div className="p-6 rounded-lg shadow text-center text-gray-500">
                                No files found
                            </div>
                        ) :
                            <Grid
                                templateColumns={{
                                    base: "1fr",
                                    md: "repeat(2, 1fr)",
                                    lg: "repeat(3, 1fr)",
                                    xl: "repeat(4, 1fr)",
                                }}
                                gap={6}
                            >
                                {files.map((file) => (
                                    <Card.Root
                                        key={file.id}
                                        bg="#111111"
                                        borderColor="zinc.800"
                                        borderWidth={1}
                                        _hover={{ borderColor: "zinc.700", cursor: "pointer" }}
                                        onClick={() => handleFileClick(file)}
                                    >
                                        <Card.Body p={7}>
                                            <Stack gap={5}>
                                                {/* File Header */}
                                                <Flex gap={3} align="center">
                                                    <IconButton
                                                        colorPalette={"gray"}
                                                        size={"lg"}
                                                        variant={"subtle"}
                                                    >
                                                        <Icon as={getFileIcon(file.fileType)} />
                                                    </IconButton>
                                                    <Box flex={1} width="50%">
                                                        <Text
                                                            fontSize="lg"
                                                            fontWeight="medium"
                                                            color="neutral.50"
                                                            truncate
                                                        >
                                                            {file.title}
                                                        </Text>
                                                        <Text fontWeight="md" fontSize="sm" color="fg.muted">
                                                            {formatFileSize(file.fileSize)} • {formatDate(file.createdAt)}
                                                        </Text>
                                                    </Box>
                                                </Flex>

                                                {/* Recipients */}
                                                <Box>
                                                    <Text
                                                        fontSize="xs"
                                                        fontWeight="md"
                                                        color="fg.muted"
                                                        textTransform="uppercase"
                                                        mb={2}
                                                    >
                                                        Recipients
                                                    </Text>

                                                    {file.recipients && file.recipients.length > 0 ? (
                                                        <Flex gap={2} wrap="wrap">
                                                            {file.recipients.slice(0, 2).map((recipient, index) => (
                                                                <Badge
                                                                    key={index}
                                                                    borderRadius="sm"
                                                                    fontSize="sm"
                                                                    px={2.5}
                                                                    py={1}
                                                                >
                                                                    {recipient.fullName}
                                                                </Badge>
                                                            ))}
                                                            {file.recipients.length > 2 && (
                                                                <Badge
                                                                    borderRadius="sm"
                                                                    fontSize="sm"
                                                                    colorPalette="blue"
                                                                >
                                                                    +{file.recipients.length - 2}
                                                                </Badge>
                                                            )}
                                                        </Flex>
                                                    ) : (
                                                        <Badge
                                                            px={0}
                                                            py={0}
                                                            borderRadius="sm"
                                                            fontSize="sm"
                                                            bg={"transparent"}
                                                        >
                                                            No recipients
                                                        </Badge>
                                                    )}
                                                </Box>

                                                {/* Actions */}
                                                <Flex gap={2}>
                                                    <Button
                                                        flex={1}
                                                        bg="#300c0c"
                                                        color="red.300"
                                                        _hover={{ bg: "red.900/50" }}
                                                        size="lg"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleFileClick(file);
                                                        }}
                                                    >
                                                        <LuSettings /> Manage
                                                    </Button>
                                                    <IconButton
                                                        colorPalette={"gray"}
                                                        size={"lg"}
                                                        variant={"subtle"}
                                                        aria-label="View"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            console.log("Preview", file.id);
                                                        }}
                                                    > <LuEye /> </IconButton>
                                                    <IconButton
                                                        colorPalette={"gray"}
                                                        size={"lg"}
                                                        variant={"subtle"}
                                                        aria-label="View"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            void handleDownload(file);
                                                        }}
                                                        disabled={downloadingFile === file}
                                                    > <LuDownload /> </IconButton>
                                                </Flex>
                                            </Stack>
                                        </Card.Body>
                                    </Card.Root>
                                ))}
                            </Grid>
                    )}
                </Stack>
            </Container>

            {/* File Management Dialog */}
            {selectedFile && (
                <FileManagementDialog
                    file={selectedFile}
                    downloadingFile={downloadingFile}
                    isOpen={isDialogOpen}
                    handleDownload={() => handleDownload(selectedFile)}
                    onCloseAction={() => {
                        setIsDialogOpen(false);
                        setSelectedFile(null);
                    }}
                    refetch={refetch}
                />
            )}

            {/* Password Prompt Dialog */}
            {fileSalt && (
                <PasswordPromptDialog
                    isOpen={showPasswordDialog}
                    onPasswordVerified={() => {
                        handlePasswordVerified();
                    }}
                    onCloseAction={() => {
                        setShowPasswordDialog(false)
                        setFileSalt(null);
                        setDownloadingFile(null);
                    }}
                    salt={fileSalt}
                />
            )}
        </Box>
    );
}
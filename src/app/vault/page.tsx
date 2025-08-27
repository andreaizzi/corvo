"use client";

import {
    Badge,
    Box,
    Button,
    Card,
    Container,
    createListCollection,
    Flex,
    Grid,
    Heading,
    HStack,
    Icon,
    IconButton,
    Input,
    InputGroup,
    Portal,
    Select,
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

import type { SelectionDetails } from "node_modules/@chakra-ui/react/dist/types/components/menu/namespace";
import { useEncryption } from "~/lib/encryption/EncryptionContext";
import { arrayBufferToBase64, base64ToArrayBuffer, clientEncryption } from "~/lib/encryption/encryption";
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
    const [pendingFile, setPendingFile] = useState<VaultFile | null>(null);
    const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
    const [fileRecipientsHover, setFileRecipientsHover] = useState<VaultFile | null>(null); // flag to know when the user hovers on the recipients select field for a single file.
    const [fileRecipientsOpen, setFileRecipientsOpen] = useState<VaultFile | null>(null); // flag to know when the user has clicked on the recipients select field for a single file.
    const [fileSalt, setFileSalt] = useState<Uint8Array | null>(null);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const { getKey } = useEncryption();

    // In production, these would be tRPC queries
    const { data: files, refetch } = api.vault.getFiles.useQuery({/* categoryId: selectedCategory */ });
    // const { data: categories } = api.vault.getCategories.useQuery();
    const downloadFile = api.vault.downloadFile.useMutation();
    // get all recipients available
    const { data: recipients } = api.recipients.getAll.useQuery();

    const assignFile = api.recipients.assignFileWithKey.useMutation({
        onSuccess: () => {
            void refetch();
        },
        onError: (error) => {
            alert(`Failed to assign file: ${error.message}`);
        },
    });

    const unassignFile = api.recipients.unassignFile.useMutation({
        onSuccess: () => {
            void refetch();
            setPendingFile(null);
        },
    });

    const decryptAndDownload = async (file: VaultFile) => {
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

    const processFileAssignment = async (file: VaultFile, recipientId: string) => {
        const keyData = getKey();
        if (!keyData) {
            alert("No encryption key available");
            return;
        }

        try {
            const [fileIvBase64, wrapIvBase64] = file.encryptionIv.split(":");
            const wrapIv = new Uint8Array(base64ToArrayBuffer(wrapIvBase64!));

            const wrappedKey = base64ToArrayBuffer(file.wrappedKeyUser);
            const fileKey = await clientEncryption.unwrapKey(wrappedKey, keyData.key, wrapIv, true);

            const fileKeyRaw = await crypto.subtle.exportKey('raw', fileKey);
            const fileKeyBase64 = arrayBufferToBase64(fileKeyRaw);

            // Assign the file with the unwrapped key
            await assignFile.mutateAsync({
                "recipientId": recipientId,
                "fileId": file.id,
                fileKeyBase64,
            });

        } catch (err) {
            console.error("Failed to assign file:", err);
            alert("Failed to assign file. Please try again.");
        } finally {
            setPendingFile(null);
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
            await decryptAndDownload(file);
        }
    };

    const handlePasswordVerified = () => {
        setShowPasswordDialog(false);
        setFileSalt(null);
        if (downloadingFile) {
            void decryptAndDownload(downloadingFile);
        }
        if (pendingFile && selectedRecipientId) {
            // If there is a pending file for assignment, proceed with assignment
            void processFileAssignment(pendingFile, selectedRecipientId);
        }
    };

    const handleAssign = async (file: VaultFile, event: SelectionDetails) => {
        setPendingFile(file);
        const selectedId = event.value;
        const isAssigned = file.recipients.some(r => r.id === selectedId);
        if (isAssigned) {
            unassignFile.mutate({ fileId: file.id, recipientId: selectedId });
        } else {
            const keyData = getKey();
            if (!keyData) {
                try {
                    const salt = new Uint8Array(base64ToArrayBuffer(file.keyDerivationSalt));
                    setFileSalt(salt);
                    setShowPasswordDialog(true);
                } catch (err) {
                    console.error("Failed to get file metadata:", err);
                    setDownloadingFile(null);
                }
            } else {
                await processFileAssignment(file, selectedId);
            }
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

                    {!files || !recipients ? <div>Loading... </div> : (
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
                                                    <>
                                                        <Select.Root
                                                            collection={createListCollection({
                                                                items: recipients.map((recipient) => ({
                                                                    id: recipient.id,
                                                                    name: recipient.fullName,
                                                                })),
                                                                itemToString: (item) => item.name,
                                                                itemToValue: (item) => item.id,
                                                            })}
                                                            size="sm"
                                                            defaultValue={file.recipients.map(r => r.id)}
                                                            positioning={{ sameWidth: true }}
                                                            onSelect={async (e) => {
                                                                setSelectedRecipientId(e.value);
                                                                await handleAssign(file, e);
                                                            }}
                                                            closeOnSelect={false}
                                                            onClick={(e) => {
                                                                setFileRecipientsOpen(file);
                                                                e.stopPropagation();
                                                            }}
                                                            value={file.recipients.map(r => r.id)}
                                                            gap={0}
                                                            onMouseOver={() => {
                                                                setFileRecipientsHover(file)
                                                            }}
                                                            onMouseOut={() => {
                                                                if (!pendingFile && !fileRecipientsOpen) {
                                                                    setFileRecipientsHover(null)
                                                                }
                                                            }}
                                                            onPointerDownOutside={() => {
                                                                setFileRecipientsOpen(null);
                                                                setFileRecipientsHover(null)
                                                            }}
                                                            open={fileRecipientsHover?.id === file.id || fileRecipientsOpen?.id === file.id}
                                                            disabled={!!pendingFile && pendingFile.id === file.id}
                                                        >
                                                            <Select.HiddenSelect />
                                                            <Select.Label mb={0}><Text
                                                                fontSize="xs"
                                                                fontWeight="md"
                                                                color="fg.muted"
                                                                textTransform="uppercase"
                                                                mb={0}
                                                            >
                                                                Recipients
                                                            </Text></Select.Label>
                                                            <Select.Control>
                                                                <Select.Trigger
                                                                    p={0}
                                                                    borderColor="transparent"
                                                                    _hover={{ borderColor: "fg.muted", cursor: "pointer" }}
                                                                >
                                                                    <Select.ValueText placeholder="No recipients">
                                                                        <HStack gap="2">
                                                                            {file.recipients.length === 0 ? (
                                                                                <Badge
                                                                                    px={0}
                                                                                    py={0}
                                                                                    borderRadius="sm"
                                                                                    fontSize="sm"
                                                                                    bg={"transparent"}
                                                                                >
                                                                                    No recipients
                                                                                </Badge>
                                                                            ) : (
                                                                                <>
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
                                                                                </>
                                                                            )}
                                                                        </HStack>
                                                                    </Select.ValueText>
                                                                </Select.Trigger>
                                                                <Select.IndicatorGroup>

                                                                </Select.IndicatorGroup>
                                                            </Select.Control>
                                                            <Portal >
                                                                <Select.Positioner>
                                                                    <Select.Content>
                                                                        {recipients.map((recipient) => (
                                                                            <Select.Item item={recipient} key={recipient.id} justifyContent="flex-start">
                                                                                <Select.ItemIndicator />
                                                                                <Badge
                                                                                    borderRadius="sm"
                                                                                    fontSize="sm"
                                                                                    px={2.5}
                                                                                    py={1}
                                                                                >
                                                                                    {recipient.fullName}
                                                                                </Badge>
                                                                            </Select.Item>
                                                                        ))}
                                                                    </Select.Content>
                                                                </Select.Positioner>
                                                            </Portal>
                                                        </Select.Root>
                                                    </>
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
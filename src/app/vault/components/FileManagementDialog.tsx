"use client";

import {
    Badge,
    Box,
    Button,
    Card,
    CloseButton,
    createListCollection,
    Dialog,
    Field,
    Flex,
    Grid,
    Heading,
    Icon,
    IconButton,
    Input,
    InputGroup,
    Select,
    Spinner,
    Stack,
    Tabs,
    Text
} from "@chakra-ui/react";
import { useState } from "react";
import {
    LuCopy,
    LuDownload,
    LuEye,
    LuFileText,
    LuShield,
    LuTriangleAlert,
    LuUsers,
} from "react-icons/lu";
import { api } from "~/trpc/react";
import type { Recipient, VaultFile } from "../types";
import { formatDate, formatFileSize, getFileIcon } from "../utils";
import { RecipientBadges } from "./RecipientSelector";
import type { SelectionDetails } from "node_modules/@chakra-ui/react/dist/types/components/menu/namespace";

function CopyButton({ text, ariaLabel = "Copy" }: { text?: string; ariaLabel?: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text ?? "");
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <IconButton
            aria-label={ariaLabel}
            size="xs"
            variant="ghost"
            onClick={handleCopy}
            color={copied ? "green.400" : "fg.muted"}
        >
            <LuCopy />
        </IconButton>
    );
}

function GreyLabel({ children }: { children: React.ReactNode }) {
    return (
        <Text fontSize="sm" fontWeight="semibold" color="fg.muted" mb={1}>
            {children}
        </Text>
    );
}

export function FileManagementDialog({
    file,
    recipients,
    downloadingFile,
    isOpen,
    handleDownload,
    onCloseAction,
    refetch,
    handleAssign
}: {
    file: VaultFile;
    recipients: Recipient[];
    downloadingFile: VaultFile | null;
    isOpen: boolean;
    handleDownload: (file: VaultFile) => void;
    handleAssign: (file: VaultFile, event: SelectionDetails) => Promise<void>;
    onCloseAction: () => void;
    refetch: () => void;
}) {
    const [assetName, setAssetName] = useState(file.title);
    const [description, setDescription] = useState(file.description ?? "");
    const [isSaving, setIsSaving] = useState(false);

    const updateFile = api.vault.updateFile.useMutation({
        onMutate: () => {
            setIsSaving(true);
        },
        onSuccess: () => {
            setIsSaving(false);
            refetch();
            onCloseAction();
        },
        onError: () => {
            setIsSaving(false);
        }
    });

    const deleteFile = api.vault.deleteFile.useMutation({
        onSuccess: () => {
            void refetch();
        }
    });

    const collection = createListCollection({
        items: recipients.map((recipient) => ({
            id: recipient.id,
            name: recipient.fullName,
        })),
        itemToString: (item) => item.name,
        itemToValue: (item) => item.id,
    });

    const handleSave = () => {
        // Handle save logic here
        updateFile.mutate({
            id: file.id,
            title: assetName,
            description: description,
        });
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onCloseAction} size="xl">
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content
                    borderRadius="md"
                    overflow="hidden"
                >
                    {/* Header */}
                    <Dialog.Header p={6} pb={4}>
                        <Flex align="center" gap={4}>
                            <IconButton
                                variant="subtle"
                                size="xl"
                                borderRadius={4}
                                pointerEvents="none"
                            ><Icon as={getFileIcon(file.fileType)} /></IconButton>
                            <Box>
                                <Dialog.Title>
                                    <Heading size="2xl" color="text.fg" fontWeight="semibold">
                                        {file.title}
                                    </Heading>
                                </Dialog.Title>
                                <Text color="fg.muted" fontSize="md">
                                    {file.fileName}
                                </Text>
                            </Box>
                        </Flex>
                        <Dialog.CloseTrigger asChild position="absolute" top={6} right={6}>
                            <CloseButton />
                        </Dialog.CloseTrigger>
                    </Dialog.Header>

                    {/* Body */}
                    <Dialog.Body px={6} pb={4}>
                        <Tabs.Root defaultValue="metadata" colorPalette={"red"}>
                            <Tabs.List>
                                <Tabs.Trigger
                                    value="metadata"
                                    _selected={{
                                        color: "red.600",
                                    }}
                                >
                                    <LuFileText size={16} />
                                    <Text>Metadata</Text>
                                </Tabs.Trigger>
                                <Tabs.Trigger
                                    value="recipients"
                                    _selected={{
                                        color: "red.600",
                                    }}
                                >
                                    <LuUsers size={16} />
                                    <Text>Recipients</Text>
                                </Tabs.Trigger>
                                <Tabs.Trigger
                                    value="security"
                                    _selected={{
                                        color: "red.600",
                                    }}
                                >
                                    <LuShield size={16} />
                                    <Text>Security</Text>
                                </Tabs.Trigger>
                                <Tabs.Trigger
                                    value="danger"
                                    _selected={{
                                        color: "red.600",
                                    }}
                                >
                                    <LuTriangleAlert size={16} />
                                    <Text>Danger Zone</Text>
                                </Tabs.Trigger>
                            </Tabs.List>

                            <Tabs.Content value="metadata">
                                <Grid templateColumns="1fr 1fr" gap={6}>
                                    {/* Left Column - File Information */}
                                    <Stack gap={4}>
                                        <Box>
                                            <Heading size="xl" color="neutral.50" fontWeight="semibold" mb={4}>
                                                File Information
                                            </Heading>
                                            <Card.Root borderRadius="sm" variant={"subtle"}>
                                                <Card.Body>
                                                    <Grid templateColumns="1fr 1fr" gap={5}>
                                                        <Box>
                                                            <GreyLabel>
                                                                FILE ID
                                                            </GreyLabel>
                                                            <InputGroup endElement={<CopyButton text={file.id} />}>
                                                                <Input value={file.id.substring(0, 8) + "..."} size="sm" disabled pointerEvents="none" />
                                                            </InputGroup>
                                                        </Box>
                                                        <Box>
                                                            <GreyLabel>
                                                                FILE TYPE
                                                            </GreyLabel>
                                                            <Text fontSize="sm" color="neutral.50">
                                                                {file.fileType ?? "Unknown"}
                                                            </Text>
                                                        </Box>
                                                        <Box>
                                                            <GreyLabel>
                                                                FILE SIZE
                                                            </GreyLabel>
                                                            <Text fontSize="sm" color="neutral.50">
                                                                {formatFileSize(file.fileSize)}
                                                            </Text>
                                                        </Box>
                                                        <Box>
                                                            <GreyLabel>
                                                                ENCRYPTION
                                                            </GreyLabel>
                                                            <Text fontSize="sm" color="green.600">
                                                                {file.encryptionAlgorithm ?? "None"}
                                                            </Text>
                                                        </Box>
                                                    </Grid>

                                                    <Box mt={5}>
                                                        <GreyLabel>
                                                            FILE PATH
                                                        </GreyLabel>
                                                        <InputGroup endElement={<CopyButton text={file.filePath} />}>
                                                            <Input value={file.filePath} size="sm" disabled pointerEvents="none" />
                                                        </InputGroup>
                                                    </Box>
                                                </Card.Body>
                                            </Card.Root>
                                        </Box>

                                        <Box>
                                            <Heading size="xl" color="neutral.50" fontWeight="semibold" mb={4}>
                                                Timestamps
                                            </Heading>
                                            <Card.Root borderRadius="sm" variant={"subtle"}>
                                                <Card.Body>
                                                    <Stack gap={3}>
                                                        <Flex justify="space-between">
                                                            <Text fontSize="sm" color="fg.muted">Created:</Text>
                                                            <Text fontSize="sm" color="neutral.50">
                                                                {formatDate(file.createdAt) /* TODO: More accurate date with time */}
                                                            </Text>
                                                        </Flex>
                                                        <Flex justify="space-between">
                                                            <Text fontSize="sm" color="fg.muted">Last Modified:</Text>
                                                            <Text fontSize="sm" color="neutral.50">
                                                                {formatDate(file.updatedAt)}
                                                            </Text>
                                                        </Flex>
                                                        {file.lastAccessedAt && (
                                                            <Flex justify="space-between">
                                                                <Text fontSize="sm" color="fg.muted">Last Accessed:</Text>
                                                                <Text fontSize="sm" color="neutral.50">
                                                                    {formatDate(file.lastAccessedAt)}
                                                                </Text>
                                                            </Flex>
                                                        )}
                                                    </Stack>
                                                </Card.Body>
                                            </Card.Root>
                                        </Box>
                                    </Stack>

                                    {/* Right Column - Details & Actions */}
                                    <Stack gap={4}>
                                        <Box>
                                            <Heading size="xl" color="neutral.50" fontWeight="semibold" mb={4}>
                                                Details
                                            </Heading>
                                            <Stack gap={3}>
                                                <Box>
                                                    <Field.Root required>
                                                        <Field.Label fontSize="sm" fontWeight="semibold">
                                                            Asset Name <Field.RequiredIndicator />
                                                        </Field.Label>
                                                        <Input
                                                            value={assetName}
                                                            onChange={(e) => setAssetName(e.target.value)}
                                                            size="sm"
                                                        />
                                                    </Field.Root>
                                                </Box>
                                                <Box>
                                                    <Field.Root required>
                                                        <Field.Label fontSize="sm" fontWeight="semibold">
                                                            Description
                                                        </Field.Label>
                                                        <Input
                                                            value={description}
                                                            onChange={(e) => setDescription(e.target.value)}
                                                            size="sm"
                                                        />
                                                    </Field.Root>
                                                </Box>
                                            </Stack>
                                        </Box>

                                        <Box>
                                            <Heading size="xl" color="neutral.50" fontWeight="semibold" mb={4}>
                                                Quick Actions
                                            </Heading>
                                            <Grid templateColumns="1fr 1fr" gap={4}>
                                                <Button
                                                    bg="red.900"
                                                    color="red.300"
                                                    _hover={{ bg: "red.900/50" }}
                                                    size="md"
                                                    fontWeight="semibold"
                                                    onClick={() => handleDownload(file)}
                                                    disabled={file === downloadingFile}
                                                >
                                                    {file === downloadingFile ? <Spinner size="sm" /> : <LuDownload />}
                                                    Download
                                                </Button>
                                                <Button
                                                    bg="zinc.900"
                                                    color="zinc.200"
                                                    _hover={{ bg: "zinc.800" }}
                                                    size="md"
                                                    fontWeight="semibold"
                                                >
                                                    <LuEye /> Preview
                                                </Button>
                                            </Grid>
                                        </Box>
                                    </Stack>
                                </Grid>
                            </Tabs.Content>

                            <Tabs.Content value="recipients" pt={4}>
                                <Stack gap={6}>
                                    <Box>
                                        <Heading size="xl" color="neutral.50" fontWeight="semibold" mb={4}>
                                            Assigned Recipients
                                        </Heading>
                                        <Select.Root
                                            collection={collection}
                                            size="sm"
                                            defaultValue={file.recipients.map((r) => r.id)}
                                            // positioning={{ sameWidth: true, slide: true, offset: { mainAxis: 0 } }}
                                            onSelect={async (e) => {
                                                await handleAssign(file, e);
                                            }}
                                            closeOnSelect={false}
                                            // onClick={(e) => {
                                            //     onOpen(file);
                                            //     e.stopPropagation();
                                            // }}
                                            value={file.recipients.map((r) => r.id)}
                                            gap={0}
                                        // onOpenChange={(e) => setOpenRecipient(e.open)}
                                        /* onMouseOver={() => onHover(file)}
                                        onMouseOut={() => {
                                            if (!isPending && !isOpen) {
                                                onHover(null);
                                            }
                                        }}
                                        onPointerDownOutside={() => {
                                            onOpen(null);
                                            onHover(null);
                                        }} */
                                        // open={isHovered || isOpen}
                                        // disabled={isPending}
                                        >
                                            <Select.HiddenSelect />
                                            <Select.Label mb={0}>
                                                <Text
                                                    fontSize="xs"
                                                    fontWeight="md"
                                                    color="fg.muted"
                                                    textTransform="uppercase"
                                                    mb={0}
                                                >
                                                    Recipients
                                                </Text>
                                            </Select.Label>
                                            <Select.Control>
                                                <Select.Trigger
                                                    p={0}
                                                    borderColor="transparent"
                                                    _hover={{ borderColor: "fg.muted", cursor: "pointer" }}
                                                >
                                                    <Select.ValueText placeholder="No recipients">
                                                        <RecipientBadges recipients={file.recipients} fontSize="md"/>
                                                    </Select.ValueText>
                                                </Select.Trigger>
                                                <Select.IndicatorGroup />
                                            </Select.Control>
                                            <Select.Positioner top="-50px">
                                                <Select.Content>
                                                    {recipients.map((recipient) => (
                                                        <Select.Item
                                                            item={recipient}
                                                            key={recipient.id}
                                                            justifyContent="flex-start"
                                                        >
                                                            <Select.ItemIndicator />
                                                            <Badge borderRadius="sm" fontSize="sm" px={2.5} py={1}>
                                                                {recipient.fullName}
                                                            </Badge>
                                                        </Select.Item>
                                                    ))}
                                                </Select.Content>
                                            </Select.Positioner>
                                        </Select.Root>
                                        <Stack gap={3}>
                                            {file.recipients?.map((recipient, index) => (
                                                <Card.Root key={index} borderRadius="sm">
                                                    <Card.Body p={4}>
                                                        <Flex justify="space-between" align="center">
                                                            <Text color="neutral.50">{recipient.fullName}</Text>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                color="red.400"
                                                            >
                                                                Remove
                                                            </Button>
                                                        </Flex>
                                                    </Card.Body>
                                                </Card.Root>
                                            ))}
                                        </Stack>
                                    </Box>

                                    <Box>
                                        <Button size="md">
                                            Add Recipient
                                        </Button>
                                    </Box>
                                </Stack>
                            </Tabs.Content>
                            <Tabs.Content value="security" pt={4}>
                                <Stack gap={6}>
                                    <Box>
                                        <Card.Root borderRadius="sm" variant="subtle">
                                            <Card.Body p={5}>
                                                <Stack gap={4}>
                                                    <Box>
                                                        <GreyLabel>
                                                            ENCRYPTION STATUS
                                                        </GreyLabel>
                                                        <Badge bg="green.900" color="green.300" px={2} py={1}>
                                                            Encrypted with {file.encryptionAlgorithm}
                                                        </Badge>
                                                    </Box>
                                                    <Box>
                                                        <GreyLabel>
                                                            ACCESS CONTROL
                                                        </GreyLabel>
                                                        <Text fontSize="sm" color="neutral.50">
                                                            Only designated recipients can access this file after trigger activation
                                                        </Text>
                                                    </Box>
                                                    <Box>
                                                        <GreyLabel>
                                                            RECIPIENT ACCESS COUNT
                                                        </GreyLabel>
                                                        <Text fontSize="sm" color="neutral.50">
                                                            {file.recipientAccessCount} times
                                                        </Text>
                                                    </Box>
                                                </Stack>
                                            </Card.Body>
                                        </Card.Root>
                                    </Box>
                                </Stack>
                            </Tabs.Content>

                            <Tabs.Content value="danger" pt={4}>
                                <Card.Root bg="red.900/20" borderColor="red.900" borderWidth={1} borderRadius="sm">
                                    <Card.Body p={5}>
                                        <Text fontSize="md" fontWeight="semibold" color="red.400" mb={2}>
                                            Delete File
                                        </Text>
                                        <Text fontSize="sm" color="zinc.400" mb={4}>
                                            Once you delete a file, there is no going back. Please be certain.
                                        </Text>
                                        <Button
                                            size="md"
                                            width="fit-content"
                                        >
                                            Delete this file
                                        </Button>
                                    </Card.Body>
                                </Card.Root>
                            </Tabs.Content>
                        </Tabs.Root>
                    </Dialog.Body>

                    {/* Footer */}
                    <Dialog.Footer>
                        <Dialog.ActionTrigger asChild>
                            <Button variant="outline">Cancel</Button>
                        </Dialog.ActionTrigger>
                        <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    );
}
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
    IconButton,
    Input,
    InputGroup,
    Stack,
    Text,
    Icon
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

import { formatDate, formatFileSize, getFileIcon } from "./utils";
import { categories } from "./data";
import { api } from "~/trpc/react";
import type { VaultFile } from "./type";


export default function VaultPage() {
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFile, setSelectedFile] = useState<VaultFile | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // In production, these would be tRPC queries
    const { data: files, refetch } = api.vault.getFiles.useQuery({/* categoryId: selectedCategory */});
    // const { data: categories } = api.vault.getCategories.useQuery();

    const handleFileClick = (file: VaultFile) => {
        setSelectedFile(file);
        setIsDialogOpen(true);
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
                                        onClick={() => handleFileClick(file as unknown as VaultFile)} // Type assertion to satisfy TS
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
                                                    <Box flex={1} maxW="100%">
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
                                                {file.recipients && file.recipients.length > 0 && (
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
                                                    <Flex gap={2} wrap="wrap">
                                                        {file.recipients.slice(0, 2).map((recipient, index) => (
                                                            <Badge
                                                                key={index}
                                                                bg="zinc.900"
                                                                color="zinc.200"
                                                                px={2.5}
                                                                py={1}
                                                                borderRadius="sm"
                                                                fontSize="sm"
                                                            >
                                                                {recipient.fullName}
                                                            </Badge>
                                                        ))}
                                                        {file.recipients.length > 2 && (
                                                            <Badge
                                                                px={2.5}
                                                                py={1}
                                                                borderRadius="sm"
                                                                fontSize="sm"
                                                                colorPalette="blue"
                                                            >
                                                                +{file.recipients.length - 2}
                                                            </Badge>
                                                        )}
                                                    </Flex>
                                                </Box>
                                            )}

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
                                                            handleFileClick(file as unknown as VaultFile);
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
                                                            console.log("Download", file.id);
                                                        }}
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
                    isOpen={isDialogOpen}
                    onCloseAction={() => {
                        setIsDialogOpen(false);
                        setSelectedFile(null);
                    }}
                    file={selectedFile}
                />
            )}
        </Box>
    );
}
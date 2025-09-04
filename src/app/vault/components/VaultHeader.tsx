// src/app/vault/components/VaultHeader.tsx
import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";
import { LuUpload } from "react-icons/lu";

export function VaultHeader({
    setOpenUploadDialog,
}: {
    setOpenUploadDialog: (open: boolean) => void;
}) {
    return (
        <Flex gap="4" justify="space-between" align="center">
            <Box>
                <Heading size="4xl" color="white" fontWeight="bold" mb={2}>
                    Vault
                </Heading>
                <Text color="zinc.400" fontSize="md">
                    Securely store and manage your digital assets
                </Text>
            </Box>
            <Box>
                <Button
                    flex={1}
                    size="lg"
                    colorPalette={"red"}
                    onClick={() => setOpenUploadDialog(true)}
                >
                    <LuUpload /> Upload file
                </Button>
            </Box>
        </Flex>
    );
}
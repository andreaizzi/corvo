// src/app/vault/components/VaultHeader.tsx
import { Box, Heading, Text } from "@chakra-ui/react";

export function VaultHeader() {
    return (
        <Box>
            <Heading size="4xl" color="white" fontWeight="bold" mb={2}>
                Vault
            </Heading>
            <Text color="zinc.400" fontSize="md">
                Securely store and manage your digital assets
            </Text>
        </Box>
    );
}
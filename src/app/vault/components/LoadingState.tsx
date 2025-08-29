// src/app/vault/components/LoadingState.tsx
import { Box, Spinner, Text } from "@chakra-ui/react";

export function LoadingState() {
    return (
        <Box textAlign="center" py={12}>
            <Spinner size="lg" color="white" mb={4} />
            <Text color="zinc.400">Loading files...</Text>
        </Box>
    );
}
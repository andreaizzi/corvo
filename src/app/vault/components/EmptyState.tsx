import { Box, Text } from "@chakra-ui/react";

export function EmptyState() {
    return (
        <Box textAlign="center" py={12}>
            <Text color="zinc.400" fontSize="lg">
                No files found
            </Text>
            <Text color="zinc.500" fontSize="sm" mt={2}>
                Upload your first file to get started
            </Text>
        </Box>
    );
}
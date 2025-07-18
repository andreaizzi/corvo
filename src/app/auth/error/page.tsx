"use client";

import {
    Alert,
    AlertDescription,
    Box,
    Button,
    Container,
    Heading,
    Stack,
    Text
} from "@chakra-ui/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FiHome, FiRefreshCw } from "react-icons/fi";

const errors: Record<string, { title: string; description: string }> = {
    Configuration: {
        title: "Configuration Error",
        description: "There is a problem with the server configuration.",
    },
    AccessDenied: {
        title: "Access Denied",
        description: "You do not have permission to sign in.",
    },
    Verification: {
        title: "Verification Error",
        description: "The verification token has expired or has already been used.",
    },
    Default: {
        title: "Authentication Error",
        description: "An error occurred during the authentication process.",
    },
};

export default function AuthErrorPage() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");

    const errorInfo = error && errors[error] ? errors[error] : errors.Default;

    return (
        <Container maxW="md" py={{ base: "12", md: "24" }}>
            <Stack gap="8" align="center">
                <Box textAlign="center">
                    <Heading size="lg" mb={2}>Authentication Error</Heading>
                    <Text color="fg.muted">
                        We encountered an issue while trying to authenticate you.
                    </Text>
                </Box>

                <Alert.Root
                    status="error"
                    variant="subtle"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    textAlign="center"
                    height="200px"
                    borderRadius="lg"
                >
                    <Alert.Indicator boxSize="40px" mr={0} />
                    <Alert.Title mt={4} mb={1} fontSize="lg">
                        {errorInfo!.title}
                    </Alert.Title>
                    <AlertDescription maxWidth="sm">
                        {errorInfo!.description}
                    </AlertDescription>
                </Alert.Root>

                {error && (
                    <Box
                        bg="bg.surface"
                        p={4}
                        borderRadius="md"
                        borderWidth="1px"
                        width="100%"
                    >
                        <Text fontSize="sm" fontFamily="mono" color="fg.muted">
                            Error code: {error}
                        </Text>
                    </Box>
                )}

                <Stack direction={{ base: "column", sm: "row" }} gap={4} width="100%">
                    <Button
                        colorScheme="blue"
                        size="lg"
                        flex={1}
                        asChild
                    >
                        <Link href="/auth/signin">
                            <FiRefreshCw /> Try Again
                        </Link>
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        flex={1}
                        asChild
                    >
                        <Link href="/">
                            <FiHome /> Go Home
                        </Link>
                    </Button>
                </Stack>

                <Text fontSize="sm" color="fg.muted" textAlign="center">
                    If this problem persists, please contact support.
                </Text>
            </Stack>
        </Container>
    );
}
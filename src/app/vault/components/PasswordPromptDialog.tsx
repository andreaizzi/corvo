"use client";

import {
    Button,
    Dialog,
    Field,
    Input,
    Stack,
    Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { useEncryption } from "~/lib/encryption/EncryptionContext";
import { api } from "~/trpc/react";

interface PasswordPromptDialogProps {
    isOpen: boolean;
    onPasswordVerified: () => void;
    onCloseAction: () => void;
    salt?: Uint8Array;
}

export default function PasswordPromptDialog({
    isOpen,
    onPasswordVerified,
    onCloseAction,
    salt
}: PasswordPromptDialogProps) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { deriveAndStoreKey } = useEncryption();

    const verifyPassword = api.vault.verifyPassword.useMutation({
        onSuccess: async () => {
            try {
                // Derive and store the key in memory
                // Use provided salt if decrypting existing files
                await deriveAndStoreKey(password, salt);
                onPasswordVerified();
            } catch (err) {
                setError("Failed to derive encryption key");
            }
        },
        onError: () => {
            setError("Invalid password");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        verifyPassword.mutate({ password });
    };

    const handleClose = () => {
        setPassword("");
        setError("");
        onCloseAction();
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={handleClose} size="md">
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content borderRadius="md" overflow="hidden">
                    {/* Header */}
                    <Dialog.Header p={6} pb={4}>
                        <Dialog.Title>
                            <Text fontSize="xl" fontWeight="bold" color="neutral.50">
                                Enter Your Password
                            </Text>
                        </Dialog.Title>
                    </Dialog.Header>

                    {/* Body */}
                    <Dialog.Body px={6} pb={4}>
                        <Stack gap={4}>
                            <Text fontSize="md" color="fg.muted">
                                Your password is required to unlock encryption for this session.
                            </Text>

                            <form onSubmit={handleSubmit} id="password-form">
                                <Stack gap={3}>
                                    <Field.Root required>
                                        <Field.Label fontSize="sm" fontWeight="semibold">
                                            Password <Field.RequiredIndicator />
                                        </Field.Label>
                                        <Input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter your password"
                                            size="md"
                                            autoFocus
                                        />
                                        {error && (
                                            <Field.ErrorText color="red.400" fontSize="sm">
                                                {error}
                                            </Field.ErrorText>
                                        )}
                                    </Field.Root>
                                </Stack>
                            </form>

                            <Text fontSize="xs" color="fg.muted" mt={2}>
                                Note: Your encryption key will be kept in memory for this session only.
                                You&apos;ll need to re-enter your password after refreshing the page.
                            </Text>
                        </Stack>
                    </Dialog.Body>

                    {/* Footer */}
                    <Dialog.Footer p={6} pt={4}>
                        <Stack direction="row" gap={2} width="full">
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                flex={1}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                form="password-form"
                                loading={verifyPassword.isPending}
                                loadingText="Verifying..."
                                flex={1}
                                colorPalette="blue"
                            >
                                Unlock Vault
                            </Button>
                        </Stack>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    );
}
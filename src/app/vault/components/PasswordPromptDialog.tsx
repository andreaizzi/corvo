"use client";

import {
    Button,
    Dialog,
    Field,
    Input,
    Stack,
    Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { base64ToArrayBuffer } from "~/lib/encryption/encryption";
import { useEncryption } from "~/lib/encryption/EncryptionContext";
import { api } from "~/trpc/react";

interface PasswordPromptDialogProps {
    isOpen: boolean;
    onPasswordVerified: () => void;
    onCloseAction: () => void;
}

export function PasswordPromptDialog({
    isOpen,
    onPasswordVerified,
    onCloseAction,
}: PasswordPromptDialogProps) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [userSalt, setUserSalt] = useState<Uint8Array | null>(null);

    const { deriveAndStoreKey } = useEncryption();

    const { data: userSaltBase64, isLoading: saltLoading } = api.vault.getUserSalt.useQuery(
        undefined,
        {
            enabled: isOpen,
        }
    );

    useEffect(() => {
        if (userSaltBase64) {
            setUserSalt(new Uint8Array(base64ToArrayBuffer(userSaltBase64)));
        }
    }, [userSaltBase64]);

    const verifyPassword = api.vault.verifyPassword.useMutation({
        onSuccess: async () => {
            if (!userSalt) {
                setError("User encryption salt not available");
                setLoading(false);
                return;
            }

            try {
                await deriveAndStoreKey(password, userSalt);
                setLoading(false);
                onPasswordVerified();
                setPassword(""); // Clear password from memory
            } catch (err) {
                setError("Failed to derive encryption key");
                setLoading(false);
            }
        },
        onError: () => {
            setError("Invalid password");
            setLoading(false);
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
                                            disabled={loading || saltLoading}
                                            autoFocus
                                        />
                                        {error && (
                                            <Field.ErrorText color="red.400" fontSize="sm">
                                                {error}
                                            </Field.ErrorText>
                                        )}
                                    </Field.Root>
                                    {saltLoading && (
                                        <div>
                                            Loading encryption settings...
                                        </div>
                                    )}
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
                                disabled={loading || saltLoading || !userSalt}
                                colorPalette="blue"
                            >
                                {loading ? "Verifying..." : "Unlock Vault"}
                            </Button>
                        </Stack>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    );
}
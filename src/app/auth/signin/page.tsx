"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FiEye, FiEyeOff } from "react-icons/fi";
import {
    Box,
    Button,
    Container,
    Field,
    Heading,
    Input,
    Stack,
    Text,
    IconButton,
} from "@chakra-ui/react";
import { Toaster, toaster } from "~/components/ui/toaster"

export default function SignInPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{
        email?: string;
        password?: string;
    }>({});

    // Get callback URL or default to dashboard
    const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
    const error = searchParams.get("error");

    const validateForm = () => {
        const newErrors: typeof errors = {};

        if (!email) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Email is invalid";
        }

        if (!password) {
            newErrors.password = "Password is required";
        } else if (password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        setErrors({});

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
                callbackUrl,
            });

            if (result?.error) {
                toaster.create({
                    title: "Authentication failed",
                    description: "Invalid email or password",
                    type: "error",
                    duration: 5000,
                });
            } else if (result?.ok) {
                toaster.create({
                    title: "Success!",
                    description: "You have been signed in successfully",
                    type: "success",
                    duration: 3000,
                });
                router.push(callbackUrl);
                router.refresh();
            }
        } catch (error) {
            toaster.create({
                title: "An error occurred",
                description: "Please try again later",
                type: "error",
                duration: 5000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container maxW="md" py={{ base: "12", md: "24" }}>
            <Toaster />
            <Stack gap="8">
                <Stack gap="6" align="center">
                    <Heading size={{ base: "lg", md: "xl" }}>
                        Sign in to your account
                    </Heading>
                    <Text color="fg.muted">
                        Don&apos;t have an account?{" "}
                        <Link href="/auth/signup" style={{ color: "var(--chakra-colors-blue-500)" }}>
                            Sign up
                        </Link>
                    </Text>
                </Stack>

                {error && (
                    <Box 
                        bg="red.50" 
                        border="1px" 
                        borderColor="red.200" 
                        borderRadius="lg" 
                        p={4}
                        color="red.800"
                    >
                        <Text fontWeight="bold">Authentication Error</Text>
                        <Text>
                            {error === "CredentialsSignin"
                                ? "Invalid email or password"
                                : "An error occurred during sign in"}
                        </Text>
                    </Box>
                )}

                <Box
                    as="form"
                    onSubmit={handleSubmit}
                    bg="bg.surface"
                    p={{ base: "6", md: "8" }}
                    borderRadius="lg"
                    boxShadow="sm"
                    borderWidth="1px"
                >
                    <Stack gap="5">
                        <Field.Root invalid={!!errors.email}>
                            <Field.Label htmlFor="email">Email</Field.Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                size="lg"
                                autoComplete="email"
                            />
                            <Field.ErrorText>{errors.email}</Field.ErrorText>
                        </Field.Root>

                        <Field.Root invalid={!!errors.password}>
                            <Field.Label htmlFor="password">Password</Field.Label>
                            <Box position="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    size="lg"
                                    paddingRight="3rem"
                                />
                                <IconButton
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    onClick={() => setShowPassword(!showPassword)}
                                    variant="ghost"
                                    size="sm"
                                    position="absolute"
                                    right="0.5rem"
                                    top="50%"
                                    transform="translateY(-50%)"
                                >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </IconButton>
                            </Box>
                            <Field.ErrorText>{errors.password}</Field.ErrorText>
                        </Field.Root>

                        <Stack gap="4">
                            <Button
                                type="submit"
                                colorScheme="blue"
                                size="lg"
                                fontSize="md"
                                loading={isLoading}
                                loadingText="Signing in..."
                            >
                                Sign in
                            </Button>

                            <Text fontSize="sm" color="fg.muted" textAlign="center">
                                <Link href="/auth/forgot-password" style={{ color: "var(--chakra-colors-blue-500)" }}>
                                    Forgot your password?
                                </Link>
                            </Text>
                        </Stack>
                    </Stack>
                </Box>

                <Text fontSize="xs" color="fg.subtle" textAlign="center">
                    By signing in, you agree to our Terms of Service and Privacy Policy
                </Text>
            </Stack>
        </Container>
    );
}
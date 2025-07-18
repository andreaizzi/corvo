"use client";

import {
    Box,
    Button,
    Container,
    Field,
    Heading,
    IconButton,
    Input,
    List,
    Progress,
    Stack,
    Text
} from "@chakra-ui/react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiCheck, FiEye, FiEyeOff, FiX } from "react-icons/fi";
import { Toaster, toaster } from "~/components/ui/toaster";
import { api } from "~/trpc/react";

interface PasswordStrength {
    score: number;
    requirements: {
        length: boolean;
        uppercase: boolean;
        lowercase: boolean;
        number: boolean;
        special: boolean;
    };
}

function getPasswordStrength(password: string): PasswordStrength {
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password),
    };

    const score = Object.values(requirements).filter(Boolean).length;

    return { score, requirements };
}

export default function SignUpPage() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        username: "",
        fullName: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const passwordStrength = getPasswordStrength(formData.password);

    const createUserMutation = api.auth.register.useMutation({
        onSuccess: async () => {
            toaster.create({
                title: "Account created successfully!",
                description: "Please sign in with your credentials",
                type: "success",
                duration: 5000,
                closable: true,
            });

            // Automatically sign in the user
            const result = await signIn("credentials", {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (result?.ok) {
                router.push("/dashboard");
                router.refresh();
            }
        },
        onError: (error) => {
            toaster.create({
                title: "Registration failed",
                description: error.message || "An error occurred during registration",
                type: "error",
                duration: 5000,
                closable: true,
            });
        },
    });

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Email is invalid";
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (passwordStrength.score < 5) {
            newErrors.password = "Password does not meet all requirements";
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        if (formData.username && formData.username.length < 3) {
            newErrors.username = "Username must be at least 3 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        createUserMutation.mutate({
            email: formData.email,
            password: formData.password,
            username: formData.username || undefined,
            fullName: formData.fullName || undefined,
        });
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: "" }));
        }
    };

    return (
        <Container maxW="md" py={{ base: "12", md: "24" }}>
            <Toaster />
            <Stack gap="8">
                <Stack gap="6" align="center">
                    <Heading size={{ base: "lg", md: "xl" }}>Create your account</Heading>
                    <Text color="fg.muted">
                        Already have an account?{" "}
                        <Link href="/auth/signin" style={{ color: "var(--chakra-colors-blue-500)" }}>
                            Sign in
                        </Link>
                    </Text>
                </Stack>

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
                                value={formData.email}
                                onChange={(e) => handleInputChange("email", e.target.value)}
                                placeholder="Enter your email"
                                size="lg"
                                autoComplete="email"
                            />
                            <Field.ErrorText>{errors.email}</Field.ErrorText>
                        </Field.Root>

                        <Field.Root>
                            <Field.Label htmlFor="username">Username (optional)</Field.Label>
                            <Input
                                id="username"
                                type="text"
                                value={formData.username}
                                onChange={(e) => handleInputChange("username", e.target.value)}
                                placeholder="Choose a username"
                                size="lg"
                                autoComplete="username"
                            />
                            <Field.HelperText>You can use this to sign in instead of email</Field.HelperText>
                            {errors.username && (
                                <Field.ErrorText>{errors.username}</Field.ErrorText>
                            )}
                        </Field.Root>

                        <Field.Root>
                            <Field.Label htmlFor="fullName">Full Name (optional)</Field.Label>
                            <Input
                                id="fullName"
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => handleInputChange("fullName", e.target.value)}
                                placeholder="Enter your full name"
                                size="lg"
                                autoComplete="name"
                            />
                        </Field.Root>

                        <Field.Root invalid={!!errors.password}>
                            <Field.Label htmlFor="password">Password</Field.Label>
                            <Box position="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => handleInputChange("password", e.target.value)}
                                    placeholder="Create a password"
                                    autoComplete="new-password"
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

                            {formData.password && (
                                <Box mt={3}>
                                    <Progress.Root
                                        value={passwordStrength.score * 20}
                                        size="xs"
                                        colorScheme={
                                            passwordStrength.score <= 2 ? "red" :
                                                passwordStrength.score <= 3 ? "orange" :
                                                    passwordStrength.score <= 4 ? "yellow" :
                                                        "green"
                                        }
                                        mb={2}
                                    >
                                        <Progress.Track>
                                            <Progress.Range />
                                        </Progress.Track>
                                    </Progress.Root>
                                    <List.Root gap={1} fontSize="sm">
                                        <List.Item>
                                            <List.Indicator
                                                as={passwordStrength.requirements.length ? FiCheck : FiX}
                                                color={passwordStrength.requirements.length ? "green.500" : "red.500"}
                                            />
                                            At least 8 characters
                                        </List.Item>
                                        <List.Item>
                                            <List.Indicator
                                                as={passwordStrength.requirements.uppercase ? FiCheck : FiX}
                                                color={passwordStrength.requirements.uppercase ? "green.500" : "red.500"}
                                            />
                                            One uppercase letter
                                        </List.Item>
                                        <List.Item>
                                            <List.Indicator
                                                as={passwordStrength.requirements.lowercase ? FiCheck : FiX}
                                                color={passwordStrength.requirements.lowercase ? "green.500" : "red.500"}
                                            />
                                            One lowercase letter
                                        </List.Item>
                                        <List.Item>
                                            <List.Indicator
                                                as={passwordStrength.requirements.number ? FiCheck : FiX}
                                                color={passwordStrength.requirements.number ? "green.500" : "red.500"}
                                            />
                                            One number
                                        </List.Item>
                                        <List.Item>
                                            <List.Indicator
                                                as={passwordStrength.requirements.special ? FiCheck : FiX}
                                                color={passwordStrength.requirements.special ? "green.500" : "red.500"}
                                            />
                                            One special character
                                        </List.Item>
                                    </List.Root>
                                </Box>
                            )}
                        </Field.Root>

                        <Field.Root invalid={!!errors.confirmPassword}>
                            <Field.Label htmlFor="confirmPassword">Confirm Password</Field.Label>
                            <Box position="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                                    placeholder="Confirm your password"
                                    autoComplete="new-password"
                                    size="lg"
                                    paddingRight="3rem"
                                />
                                <IconButton
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    variant="ghost"
                                    size="sm"
                                    position="absolute"
                                    right="0.5rem"
                                    top="50%"
                                    transform="translateY(-50%)"
                                >
                                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                                </IconButton>
                            </Box>
                            <Field.ErrorText>{errors.confirmPassword}</Field.ErrorText>
                        </Field.Root>

                        <Button
                            type="submit"
                            colorScheme="blue"
                            size="lg"
                            fontSize="md"
                            loading={createUserMutation.isPending}
                            loadingText="Creating account..."
                        >
                            Create account
                        </Button>
                    </Stack>
                </Box>

                <Text fontSize="xs" color="fg.subtle" textAlign="center">
                    By creating an account, you agree to our Terms of Service and Privacy Policy
                </Text>
            </Stack>
        </Container>
    );
}
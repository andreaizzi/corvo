"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
    Box,
    Container,
    Heading,
    Text,
    Stack,
    Card,
    Button,
    Skeleton,
    Badge,
    Avatar,
    Tag,
    Table,
    Code,
    Tabs,
    Group,
    Separator,
} from "@chakra-ui/react";
import { toaster } from "~/components/ui/toaster";
import { api } from "~/trpc/react";
import { FiLogOut, FiUser, FiShield, FiSettings } from "react-icons/fi";

export default function SessionPage() {
    const { data: session, status } = useSession();
    const [isSigningOut, setIsSigningOut] = useState(false);

    // Fetch detailed profile if user is authenticated
    const { data: profile, isLoading: profileLoading } = api.auth.getProfile.useQuery(
        undefined,
        {
            enabled: !!session?.user,
        }
    );

    const handleSignOut = async () => {
        setIsSigningOut(true);
        try {
            await signOut({ callbackUrl: "/auth/signin" });
        } catch {
            toaster.error({
                title: "Error signing out",
                description: "Please try again",
            });
            setIsSigningOut(false);
        }
    };

    if (status === "loading") {
        return (
            <Container maxW="4xl" py={8}>
                <Stack gap={4}>
                    <Skeleton height="40px" />
                    <Skeleton height="200px" />
                    <Skeleton height="200px" />
                </Stack>
            </Container>
        );
    }

    return (
        <Container maxW="4xl" py={8}>
            <Stack gap={8}>
                <Box>
                    <Heading size="lg" mb={2}>Session & User Information</Heading>
                    <Text color="fg.muted">
                        View your current session status and user profile details
                    </Text>
                </Box>

                <Tabs.Root defaultValue="session">
                    <Tabs.List>
                        <Tabs.Trigger value="session">Session Info</Tabs.Trigger>
                        <Tabs.Trigger value="profile">User Profile</Tabs.Trigger>
                        <Tabs.Trigger value="raw">Raw Data</Tabs.Trigger>
                    </Tabs.List>

                    <Tabs.Content value="session">
                        <Card.Root>
                            <Card.Header>
                                <Heading size="md">Current Session</Heading>
                            </Card.Header>
                            <Card.Body>
                                <Stack gap={4}>
                                    <Box>
                                        <Text fontWeight="semibold" mb={2}>Status</Text>
                                        <Badge
                                            colorPalette={status === "authenticated" ? "green" : "red"}
                                            size="md"
                                        >
                                            {status === "authenticated" ? "Authenticated" : "Not Authenticated"}
                                        </Badge>
                                    </Box>

                                    {session?.user && (
                                        <>
                                            <Separator />
                                            <Table.Root variant="outline">
                                                <Table.Body>
                                                    <Table.Row>
                                                        <Table.Cell fontWeight="semibold">User ID</Table.Cell>
                                                        <Table.Cell><Code>{session.user.id}</Code></Table.Cell>
                                                    </Table.Row>
                                                    <Table.Row>
                                                        <Table.Cell fontWeight="semibold">Email</Table.Cell>
                                                        <Table.Cell>{session.user.email}</Table.Cell>
                                                    </Table.Row>
                                                    <Table.Row>
                                                        <Table.Cell fontWeight="semibold">Username</Table.Cell>
                                                        <Table.Cell>{session.user.username ?? "Not set"}</Table.Cell>
                                                    </Table.Row>
                                                    <Table.Row>
                                                        <Table.Cell fontWeight="semibold">Name</Table.Cell>
                                                        <Table.Cell>{session.user.name ?? "Not set"}</Table.Cell>
                                                    </Table.Row>
                                                    <Table.Row>
                                                        <Table.Cell fontWeight="semibold">Admin</Table.Cell>
                                                        <Table.Cell>
                                                            <Badge colorPalette={session.user.isAdmin ? "purple" : "gray"}>
                                                                {session.user.isAdmin ? "Yes" : "No"}
                                                            </Badge>
                                                        </Table.Cell>
                                                    </Table.Row>
                                                    <Table.Row>
                                                        <Table.Cell fontWeight="semibold">Active</Table.Cell>
                                                        <Table.Cell>
                                                            <Badge colorPalette={session.user.isActive ? "green" : "red"}>
                                                                {session.user.isActive ? "Yes" : "No"}
                                                            </Badge>
                                                        </Table.Cell>
                                                    </Table.Row>
                                                </Table.Body>
                                            </Table.Root>
                                        </>
                                    )}

                                    {status === "authenticated" && (
                                        <Button
                                            colorPalette="red"
                                            variant="outline"
                                            onClick={handleSignOut}
                                            loading={isSigningOut}
                                        >
                                            <FiLogOut />
                                            Sign Out
                                        </Button>
                                    )}

                                    {status === "unauthenticated" && (
                                        <Stack gap={3}>
                                            <Text>You are not currently signed in.</Text>
                                            <Group>
                                                <Button asChild colorPalette="blue">
                                                    <Link href="/auth/signin">
                                                        <FiUser />
                                                        Sign In
                                                    </Link>
                                                </Button>
                                                <Button asChild variant="outline">
                                                    <Link href="/auth/signup">
                                                        Create Account
                                                    </Link>
                                                </Button>
                                            </Group>
                                        </Stack>
                                    )}
                                </Stack>
                            </Card.Body>
                        </Card.Root>
                    </Tabs.Content>

                    <Tabs.Content value="profile">
                        {session?.user ? (
                            <Card.Root>
                                <Card.Header>
                                    <Heading size="md">User Profile</Heading>
                                </Card.Header>
                                <Card.Body>
                                    {profileLoading ? (
                                        <Stack gap={3}>
                                            <Skeleton height="60px" />
                                            <Skeleton height="40px" />
                                            <Skeleton height="40px" />
                                        </Stack>
                                    ) : profile ? (
                                        <Stack gap={6}>
                                            <Box display="flex" alignItems="center" gap={4}>
                                                <Avatar.Root size="xl">
                                                    <Avatar.Image src={profile?.avatarUrl ?? undefined} />
                                                    <Avatar.Fallback>{profile?.fullName ?? profile?.username ?? profile?.email}</Avatar.Fallback>
                                                </Avatar.Root>
                                                <Box>
                                                    <Heading size="sm">{profile?.fullName ?? profile?.username ?? "User"}</Heading>
                                                    <Text color="fg.muted">{profile?.email}</Text>
                                                </Box>
                                            </Box>

                                            <Separator />

                                            <Stack gap={3}>
                                                <Box>
                                                    <Text fontWeight="semibold" mb={1}>Account Information</Text>
                                                    <Table.Root variant="outline" size="sm">
                                                        <Table.Body>
                                                            <Table.Row>
                                                                <Table.Cell>Email Verified</Table.Cell>
                                                                <Table.Cell>
                                                                    <Badge colorPalette={profile?.emailVerified ? "green" : "orange"}>
                                                                        {profile?.emailVerified ? "Verified" : "Unverified"}
                                                                    </Badge>
                                                                </Table.Cell>
                                                            </Table.Row>
                                                            <Table.Row>
                                                                <Table.Cell>Account Created</Table.Cell>
                                                                <Table.Cell>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "N/A"}</Table.Cell>
                                                            </Table.Row>
                                                            <Table.Row>
                                                                <Table.Cell>Last Login</Table.Cell>
                                                                <Table.Cell>
                                                                    {profile?.lastLoginAt
                                                                        ? new Date(profile.lastLoginAt).toLocaleString()
                                                                        : "N/A"}
                                                                </Table.Cell>
                                                            </Table.Row>
                                                        </Table.Body>
                                                    </Table.Root>
                                                </Box>

                                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access */}
                                                {(profile as any)?.preferences && (
                                                    <Box>
                                                        <Text fontWeight="semibold" mb={1}>Preferences</Text>
                                                        <Group gap={2}>
                                                            <Tag.Root>
                                                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access */}
                                                                <Tag.Label>Theme: {(profile as any).preferences?.theme}</Tag.Label>
                                                            </Tag.Root>
                                                            <Tag.Root>
                                                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access */}
                                                                <Tag.Label>Language: {(profile as any).preferences?.language}</Tag.Label>
                                                            </Tag.Root>
                                                            <Tag.Root>
                                                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access */}
                                                                <Tag.Label>Timezone: {(profile as any).preferences?.timezone}</Tag.Label>
                                                            </Tag.Root>
                                                        </Group>
                                                    </Box>
                                                )}

                                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access */}
                                                {(profile as any)?.checkInConfig && (
                                                    <Box>
                                                        <Text fontWeight="semibold" mb={1}>Check-in Configuration</Text>
                                                        <Table.Root variant="outline" size="sm">
                                                            <Table.Body>
                                                                <Table.Row>
                                                                    <Table.Cell>Check Interval</Table.Cell>
                                                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access */}
                                                                    <Table.Cell>{(profile as any).checkInConfig?.checkIntervalDays} days</Table.Cell>
                                                                </Table.Row>
                                                                <Table.Row>
                                                                    <Table.Cell>Grace Period</Table.Cell>
                                                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access */}
                                                                    <Table.Cell>{(profile as any).checkInConfig?.gracePeriodDays} days</Table.Cell>
                                                                </Table.Row>
                                                                <Table.Row>
                                                                    <Table.Cell>Status</Table.Cell>
                                                                    <Table.Cell>
                                                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access */}
                                                                        <Badge colorPalette={(profile as any).checkInConfig?.isActive ? "green" : "gray"}>
                                                                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access */}
                                                                            {(profile as any).checkInConfig?.isActive ? "Active" : "Inactive"}
                                                                        </Badge>
                                                                    </Table.Cell>
                                                                </Table.Row>
                                                            </Table.Body>
                                                        </Table.Root>
                                                    </Box>
                                                )}
                                            </Stack>

                                            <Separator />

                                            <Group gap={3}>
                                                <Button asChild colorPalette="blue">
                                                    <Link href="/dashboard">
                                                        <FiShield />
                                                        Go to Dashboard
                                                    </Link>
                                                </Button>
                                                <Button asChild variant="outline">
                                                    <Link href="/settings">
                                                        <FiSettings />
                                                        Account Settings
                                                    </Link>
                                                </Button>
                                            </Group>
                                        </Stack>
                                    ) : (
                                        <Text>Failed to load profile data</Text>
                                    )}
                                </Card.Body>
                            </Card.Root>
                        ) : (
                            <Card.Root>
                                <Card.Body>
                                    <Text>Please sign in to view your profile information.</Text>
                                </Card.Body>
                            </Card.Root>
                        )}
                    </Tabs.Content>

                    <Tabs.Content value="raw">
                        <Card.Root>
                            <Card.Header>
                                <Heading size="md">Raw Session Data</Heading>
                            </Card.Header>
                            <Card.Body>
                                <Code
                                    display="block"
                                    whiteSpace="pre"
                                    overflow="auto"
                                    p={4}
                                    borderRadius="md"
                                    bg="gray.100"
                                    _dark={{ bg: "gray.700" }}
                                >
                                    {JSON.stringify({ session, profile: profile ?? null }, null, 2)}
                                </Code>
                            </Card.Body>
                        </Card.Root>
                    </Tabs.Content>
                </Tabs.Root>
            </Stack>
        </Container>
    );
}
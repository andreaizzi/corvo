import { Box, Button, Card, Container, Heading, SimpleGrid, Stack, Stat, Text } from "@chakra-ui/react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FiClock, FiFolder, FiShield, FiUsers } from "react-icons/fi";
import { auth } from "~/server/auth";

export default async function DashboardPage() {
    const session = await auth();

    if (!session) {
        redirect("/auth/signin");
    }

    // In a real app, you'd fetch these stats from the database
    const stats = {
        vaultItems: 0,
        recipients: 0,
        lastCheckIn: "Never",
        nextCheckIn: "Not configured",
    };

    return (
        <Container maxW="7xl" py={8}>
            <Stack gap={8}>
                <Box>
                    <Heading size="lg" mb={2}>
                        Welcome back, {session.user.name ?? session.user.email}!
                    </Heading>
                    <Text color="fg.muted">
                        Manage your digital legacy from your personal dashboard.
                    </Text>
                </Box>

                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6}>
                    <Card.Root>
                        <Card.Body>
                            <Stat.Root>
                                <Stat.Label display="flex" alignItems="center" gap={2}>
                                    <FiFolder /> Vault Items
                                </Stat.Label>
                                <Stat.ValueText fontSize="3xl">{stats.vaultItems}</Stat.ValueText>
                                <Stat.HelpText>Files, notes, and credentials</Stat.HelpText>
                            </Stat.Root>
                        </Card.Body>
                    </Card.Root>

                    <Card.Root>
                        <Card.Body>
                            <Stat.Root>
                                <Stat.Label display="flex" alignItems="center" gap={2}>
                                    <FiUsers /> Recipients
                                </Stat.Label>
                                <Stat.ValueText fontSize="3xl">{stats.recipients}</Stat.ValueText>
                                <Stat.HelpText>Trusted contacts</Stat.HelpText>
                            </Stat.Root>
                        </Card.Body>
                    </Card.Root>

                    <Card.Root>
                        <Card.Body>
                            <Stat.Root>
                                <Stat.Label display="flex" alignItems="center" gap={2}>
                                    <FiClock /> Last Check-in
                                </Stat.Label>
                                <Stat.ValueText fontSize="2xl">{stats.lastCheckIn}</Stat.ValueText>
                                <Stat.HelpText>Stay active to keep your data safe</Stat.HelpText>
                            </Stat.Root>
                        </Card.Body>
                    </Card.Root>

                    <Card.Root>
                        <Card.Body>
                            <Stat.Root>
                                <Stat.Label display="flex" alignItems="center" gap={2}>
                                    <FiShield /> Next Check-in
                                </Stat.Label>
                                <Stat.ValueText fontSize="2xl">{stats.nextCheckIn}</Stat.ValueText>
                                <Stat.HelpText>Dead man&apos;s switch status</Stat.HelpText>
                            </Stat.Root>
                        </Card.Body>
                    </Card.Root>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
                    <Card.Root>
                        <Card.Header>
                            <Heading size="md">Digital Vault</Heading>
                        </Card.Header>
                        <Card.Body>
                            <Stack gap={3}>
                                <Text>
                                    Store and organize your important documents, passwords, and messages.
                                </Text>
                                <Button colorScheme="blue" asChild>
                                    <Link href="/vault">Open Vault</Link>
                                </Button>
                            </Stack>
                        </Card.Body>
                    </Card.Root>

                    <Card.Root>
                        <Card.Header>
                            <Heading size="md">Recipients</Heading>
                        </Card.Header>
                        <Card.Body>
                            <Stack gap={3}>
                                <Text>
                                    Manage who receives your digital assets and when they get access.
                                </Text>
                                <Button colorScheme="blue" variant="outline">
                                    <Link href="/recipients">Manage Recipients</Link>
                                </Button>
                            </Stack>
                        </Card.Body>
                    </Card.Root>

                    <Card.Root>
                        <Card.Header>
                            <Heading size="md">Check-in Settings</Heading>
                        </Card.Header>
                        <Card.Body>
                            <Stack gap={3}>
                                <Text>
                                    Configure your dead man&apos;s switch and notification preferences.
                                </Text>
                                <Button colorScheme="blue" variant="outline" asChild>
                                    <Link href="/settings/checkin">
                                        Configure Check-in
                                    </Link>
                                </Button>
                            </Stack>
                        </Card.Body>
                    </Card.Root>
                </SimpleGrid>

                <Card.Root>
                    <Card.Header>
                        <Heading size="md">Quick Actions</Heading>
                    </Card.Header>
                    <Card.Body>
                        <Stack direction={{ base: "column", sm: "row" }} gap={4}>
                            <Button size="sm" asChild>
                                <Link href="/vault/new">
                                    Add Vault Item
                                </Link>
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                                <Link href="/recipients/new">
                                    Add Recipient
                                </Link>
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                                <Link href="/checkin">
                                    Manual Check-in
                                </Link>
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                                <Link href="/settings">
                                    Account Settings
                                </Link>
                            </Button>
                        </Stack>
                    </Card.Body>
                </Card.Root>
            </Stack>
        </Container>
    );
}
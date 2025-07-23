import {
    Alert,
    Box,
    Card,
    Container,
    Flex,
    Heading,
    SimpleGrid,
    Stack
} from "@chakra-ui/react";
import { redirect } from "next/navigation";
import {
    LuBadgeCheck,
    LuDatabase,
    LuShield,
    LuShieldCheck,
    LuUsers
} from "react-icons/lu";
import { auth } from "~/server/auth";
import { ActivityTimeline, StatsCard } from "./components";
import QuickActions from "./components/quick-actions";

export default async function DashboardPage() {
    const session = await auth();

    if (!session) {
        redirect("/auth/signin");
    }

    // fetch from database
    const stats = {
        digitalAssets: 47,
        storage: "2.5 GB",
        recipients: 12,
        deadManSwitch: {
            status: "active" as const,
            lastCheckIn: "2 hours ago",
            nextCheckIn: "in 22 hours",
        },
    };

    return (
        <Box minH="100vh">
            <Container p={{ base: 4, md: 6, lg: 8 }}>
                <Stack gap={{ base: 6, md: 8 }}>
                    {/* <Heading size={{ base: "3xl", md: "4xl" }} color="white" fontWeight="bold">
                        Dashboard
                    </Heading> */}

                    <Alert.Root
                        status="success"
                        variant="subtle"
                        bg="green.subtle"
                        borderColor="green.muted"
                        borderWidth="2px"
                        size={"lg"}
                    >
                        <Alert.Indicator color="green.fg">
                            <LuBadgeCheck />
                        </Alert.Indicator>
                        <Box>
                            <Alert.Title color="green.fg">You are alive.</Alert.Title>
                            <Alert.Description color="green.fg">
                                Last check-in: {stats.deadManSwitch.lastCheckIn} • Next check-in: {stats.deadManSwitch.nextCheckIn}
                            </Alert.Description>
                        </Box>
                    </Alert.Root>

                    <SimpleGrid columns={{ base: 2, lg: 4 }} gap={6}>
                        <StatsCard
                            icon={<LuShield />}
                            label="Digital assets"
                            value={stats.digitalAssets}
                        />
                        <StatsCard
                            icon={<LuDatabase />}
                            label="Storage"
                            value={stats.storage}
                        />
                        <StatsCard
                            icon={<LuUsers />}
                            label="Recipients"
                            value={stats.recipients}
                        />
                        <StatsCard
                            label="Dead Man's Switch"
                            icon={<LuShieldCheck />}
                            value="Active"
                            iconColor="green.600"
                        />
                    </SimpleGrid>

                    <Flex gap={{ base: 4, md: 6 }} direction={{ base: "column", xl: "row" }}>
                        <Box flex="1">
                            <Heading size={{ base: "2xl", md: "2xl" }} color="white" fontWeight="semibold" mb={{ base: 4, md: 6 }}>
                                Last activities
                            </Heading>
                            <Card.Root bg="#111111" borderColor="zinc.800" borderWidth="1px" p={0}>
                                <Card.Body>
                                    <ActivityTimeline />
                                </Card.Body>
                            </Card.Root>
                        </Box>

                        <QuickActions />
                    </Flex>
                </Stack>
            </Container>
        </Box>
    );
}
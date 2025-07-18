"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Box,
    Container,
    Flex,
    HStack,
    Button,
    Menu,
    Avatar,
    Text,
    IconButton,
    useDisclosure,
    Drawer,
    VStack,
    Heading,
    CloseButton,
} from "@chakra-ui/react";
import { FiMenu, FiUser, FiLogOut, FiSettings, FiShield, FiFolder, FiUsers } from "react-icons/fi";

const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: FiShield },
    { label: "Vault", href: "/vault", icon: FiFolder },
    { label: "Recipients", href: "/recipients", icon: FiUsers },
];

export default function NavigationBar() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { open, onOpen, onClose } = useDisclosure();

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/auth/signin" });
    };

    return (
        <Box bg="bg.surface" borderBottomWidth="1px">
            <Container maxW="7xl">
                <Flex h={16} alignItems="center" justifyContent="space-between">
                    {/* Logo */}
                    <HStack gap={8}>
                        <Link href="/">
                            <Heading size="md" cursor="pointer">
                                Corvo
                            </Heading>
                        </Link>

                        {/* Desktop Navigation */}
                        {status === "authenticated" && (
                            <HStack gap={4} display={{ base: "none", md: "flex" }}>
                                {navItems.map((item) => (
                                    <Button
                                        key={item.href}
                                        asChild
                                        variant="ghost"
                                        size="sm"
                                    >
                                        <Link href={item.href}>
                                            <item.icon />
                                            {item.label}
                                        </Link>
                                    </Button>
                                ))}
                            </HStack>
                        )}
                    </HStack>

                    {/* User Menu */}
                    <HStack gap={4}>
                        {status === "authenticated" && session?.user ? (
                            <>
                                <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    display={{ base: "none", md: "flex" }}
                                >
                                    <Link href="/session">
                                        Session Info
                                    </Link>
                                </Button>
                                <Menu.Root>
                                    <Menu.Trigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            p={0}
                                        >
                                            <Avatar.Root size="sm">
                                                <Avatar.Fallback name={session.user.name ?? session.user.email} />
                                                <Avatar.Image src={session.user.image ?? undefined} />
                                            </Avatar.Root>
                                        </Button>
                                    </Menu.Trigger>
                                    <Menu.Content>
                                        <Box px={3} py={2}>
                                            <Text fontWeight="medium">{session.user.name ?? "User"}</Text>
                                            <Text fontSize="sm" color="fg.muted">
                                                {session.user.email}
                                            </Text>
                                        </Box>
                                        <Menu.Separator />
                                        <Menu.Item
                                            value="session"
                                            onClick={() => router.push("/session")}
                                        >
                                            <FiUser />
                                            Session Info
                                        </Menu.Item>
                                        <Menu.Item
                                            value="settings"
                                            onClick={() => router.push("/settings")}
                                        >
                                            <FiSettings />
                                            Settings
                                        </Menu.Item>
                                        <Menu.Separator />
                                        <Menu.Item
                                            value="signout"
                                            onClick={handleSignOut}
                                            color="red.500"
                                        >
                                            <FiLogOut />
                                            Sign Out
                                        </Menu.Item>
                                    </Menu.Content>
                                </Menu.Root>

                                {/* Mobile menu button */}
                                <IconButton
                                    aria-label="Open menu"
                                    display={{ base: "flex", md: "none" }}
                                    onClick={onOpen}
                                    variant="ghost"
                                >
                                    <FiMenu />
                                </IconButton>
                            </>
                        ) : status === "unauthenticated" ? (
                            <HStack gap={2}>
                                <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                >
                                    <Link href="/auth/signin">
                                        Sign In
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    colorScheme="blue"
                                    size="sm"
                                >
                                    <Link href="/auth/signup">
                                        Sign Up
                                    </Link>
                                </Button>
                            </HStack>
                        ) : null}
                    </HStack>
                </Flex>
            </Container>

            {/* Mobile Navigation Drawer */}
            <Drawer.Root open={open} onOpenChange={({ open }) => open ? onOpen() : onClose()}>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content>
                        <Drawer.Header>
                            <Drawer.Title>Menu</Drawer.Title>
                            <Drawer.CloseTrigger asChild>
                                <CloseButton />
                            </Drawer.CloseTrigger>
                        </Drawer.Header>
                        <Drawer.Body>
                            <VStack gap={4} align="stretch">
                                {navItems.map((item) => (
                                    <Button
                                        key={item.href}
                                        asChild
                                        variant="ghost"
                                        justifyContent="flex-start"
                                        onClick={onClose}
                                    >
                                        <Link href={item.href}>
                                            <item.icon />
                                            {item.label}
                                        </Link>
                                    </Button>
                                ))}
                                <Button
                                    asChild
                                    variant="ghost"
                                    justifyContent="flex-start"
                                    onClick={onClose}
                                >
                                    <Link href="/session">
                                        <FiUser />
                                        Session Info
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    variant="ghost"
                                    justifyContent="flex-start"
                                    onClick={onClose}
                                >
                                    <Link href="/settings">
                                        <FiSettings />
                                        Settings
                                    </Link>
                                </Button>
                            </VStack>
                        </Drawer.Body>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Drawer.Root>
        </Box>
    );
}
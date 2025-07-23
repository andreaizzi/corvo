"use client";

import {
    Avatar,
    Box,
    Button,
    Container,
    Drawer,
    Flex,
    IconButton,
    Image,
    Separator,
    Stack,
    Text,
} from "@chakra-ui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuClock, LuEllipsisVertical, LuKeyRound, LuLayoutDashboard, LuLock, LuMessageSquare, LuSettings, LuUsersRound } from "react-icons/lu";

interface SidebarItem {
    label: string;
    href: string;
    icon: React.ElementType;
}

const navigationItems: SidebarItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LuLayoutDashboard },
    { label: "Vault", href: "/vault", icon: LuLock },
    { label: "Credentials", href: "/credentials", icon: LuKeyRound },
    { label: "Messages", href: "/messages", icon: LuMessageSquare },
    { label: "Recipients", href: "/recipients", icon: LuUsersRound },
    { label: "Dead Man's Switch", href: "/dead-mans-switch", icon: LuClock },
];

interface SidebarProps {
    user?: {
        name: string;
        email: string;
        image?: string;
    };
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ user, isOpen = false, onClose }: SidebarProps) {
    const pathname = usePathname();

    const SidebarContent = () => (
        <Box
            bg="#111111"
            h="full"
            w="320px"
            borderRightWidth="1px"
            borderRightColor="zinc.800"
            display="flex"
            flexDirection="column"
        >
            <Container p={6} flex="1" display="flex" flexDirection="column">
                {/* Logo - Desktop only */}
                <Flex align="center" gap={3} mb={6} display={{ base: "none", lg: "flex" }}>
                    <Image src="/raven-red.svg" alt="Corvo Logo" width="32px" height="32px" />
                    <Text fontSize="24px" fontWeight="bold" color="white">
                        Corvo
                    </Text>
                </Flex>

                {/* Navigation */}
                <Stack gap={4} flex="1">
                    {navigationItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Button
                                key={item.href}
                                asChild
                                variant="ghost"
                                justifyContent="flex-start"
                                size="lg"
                                color={isActive ? "red.300" : "zinc.400"}
                                bg="transparent"
                                _hover={{ bg: "whiteAlpha.50" }}
                                px={4}
                                h="40px"
                                fontWeight="medium"
                                onClick={onClose} // Close mobile menu on navigation
                            >
                                <Link href={item.href}>
                                    <Icon size={20} />
                                    {item.label}
                                </Link>
                            </Button>
                        );
                    })}
                </Stack>

                {/* Bottom Section */}
                <Stack gap={0}>
                    <Separator my={4} borderColor="zinc.800" />

                    <Button
                        asChild
                        variant="ghost"
                        justifyContent="flex-start"
                        size="lg"
                        color="zinc.400"
                        bg="transparent"
                        _hover={{ bg: "whiteAlpha.50" }}
                        px={4}
                        h="40px"
                        fontWeight="medium"
                        onClick={onClose} // Close mobile menu on navigation
                    >
                        <Link href="/settings">
                            <LuSettings size={20} />
                            Settings
                        </Link>
                    </Button>

                    <Separator my={4} borderColor="zinc.800" />

                    {/* User Profile */}
                    {user && (
                        <Flex align="center" justify="space-between">
                            <Flex align="center" gap={3}>
                                <Avatar.Root size="md">
                                    <Avatar.Image src={user.image} />
                                    <Avatar.Fallback bg="red.900">{user.name[0]}</Avatar.Fallback>
                                </Avatar.Root>
                                <Box>
                                    <Text fontSize="sm" fontWeight="semibold" color="neutral.50">
                                        {user.name}
                                    </Text>
                                    <Text fontSize="sm" color="zinc.400">
                                        {user.email}
                                    </Text>
                                </Box>
                            </Flex>
                            <IconButton
                                aria-label="User menu"
                                size="sm"
                                variant="ghost"
                                color="white"
                            >
                                <LuEllipsisVertical />
                            </IconButton>
                        </Flex>
                    )}
                </Stack>
            </Container>
        </Box>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <Box
                position="fixed"
                left={0}
                top={0}
                bottom={0}
                zIndex={10}
                display={{ base: "none", lg: "block" }}
            >
                <SidebarContent />
            </Box>

            {/* Mobile Drawer */}
            <Drawer.Root open={isOpen} onOpenChange={onClose} placement="start">
                <Drawer.Backdrop />
                <Drawer.Content>
                    <SidebarContent />
                </Drawer.Content>
            </Drawer.Root>
        </>
    );
}
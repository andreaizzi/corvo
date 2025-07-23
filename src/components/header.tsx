"use client";

import {
    Avatar,
    Box,
    Flex,
    IconButton,
    Image,
    Text,
} from "@chakra-ui/react";
import { LuMenu } from "react-icons/lu";

interface HeaderProps {
    user?: {
        name: string;
        email: string;
        image?: string;
    };
    onMenuToggleAction: () => void;
}

export default function Header({ user, onMenuToggleAction }: HeaderProps) {
    return (
        <Box
            bg="#111111"
            borderBottomWidth="1px"
            borderBottomColor="zinc.800"
            p={4}
            display={{ base: "flex", lg: "none" }}
            alignItems="center"
            justifyContent="space-between"
            position="sticky"
            top={0}
            zIndex={20}
        >
            <IconButton
                aria-label="Open menu"
                onClick={onMenuToggleAction}
                variant="ghost"
                color="white"
                size="lg"
            >
                <LuMenu />
            </IconButton>
            <Flex align="center" gap={3}>
                <Image src="/raven-red.svg" alt="Corvo Logo" width="32px" height="32px" />
                <Text fontSize="20px" fontWeight="bold" color="white">
                    Corvo
                </Text>
            </Flex>

            {user && (
                <Avatar.Root size="sm">
                    <Avatar.Image src={user.image} />
                    <Avatar.Fallback bg="red.900">{user.name[0]}</Avatar.Fallback>
                </Avatar.Root>
            )}
        </Box>
    );
}

"use client";

import { Box, Card, Stack, Text, Flex } from "@chakra-ui/react";
import { type ReactNode } from "react";

interface ActionCardProps {
    icon: ReactNode;
    title: string;
    description: string;
    onClick?: () => void;
}

export default function ActionCard({ icon, title, description, onClick }: ActionCardProps) {
    return (
        <Card.Root
            bg="#111111"
            borderColor="zinc.800"
            borderWidth="1px"
            cursor="pointer"
            transition="all 0.2s"
            _hover={{ borderColor: "zinc.700", transform: "translateY(-2px)" }}
            onClick={onClick}
            h={{ base: "160px", md: "190px" }}
        >
            <Card.Body p={{ base: 4, md: 6 }}>
                <Stack gap={{ base: 2, md: 2.5 }} align="center" justify="center" h="full">
                    <Flex
                        align="center"
                        justify="center"
                        w={{ base: "36px", md: "44px" }}
                        h={{ base: "36px", md: "44px" }}
                        color="red.700"
                    >
                        <Box fontSize={{ base: "24px", md: "32px" }}>
                            {icon}
                        </Box>
                    </Flex>
                    <Text
                        fontSize={{ base: "16px", md: "18px" }}
                        fontWeight="semibold"
                        color="neutral.50"
                        textAlign="center"
                        lineHeight="1.2"
                    >
                        {title}
                    </Text>
                    <Text
                        fontSize={{ base: "12px", md: "14px" }}
                        color="zinc.400"
                        textAlign="center"
                        maxW="223px"
                        lineHeight="1.3"
                    >
                        {description}
                    </Text>
                </Stack>
            </Card.Body>
        </Card.Root>
    );
}
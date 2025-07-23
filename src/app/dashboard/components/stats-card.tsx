"use client";

import { Box, Card, Flex, Text } from "@chakra-ui/react";
import { type ReactNode } from "react";

interface StatsCardProps {
    icon: ReactNode;
    label: string;
    value: string | number;
    iconColor?: string;
}

export default function StatsCard({ icon, label, value, iconColor = "red.700"}: StatsCardProps) {
    return (
        <Card.Root bg="#111111" borderColor="zinc.800" borderWidth="1px">
            <Card.Body p={{ base: 3, md: 4 }}>
                <Flex align="center" gap={{ base: 3, md: 4 }} direction={{ base: "column", sm: "row" }} textAlign={{ base: "center", sm: "left" }}>
                    <Box color={iconColor} fontSize={{ base: "28px", md: "36px" }}>
                        {icon}
                    </Box>
                    <Box flex="1">
                        <Text fontSize={{ base: "12px", md: "14px" }} color="zinc.400">
                            {label}
                        </Text>
                        <Text fontSize={{ base: "20px", md: "24px" }} fontWeight="semibold" color="neutral.50" letterSpacing="-0.6px">
                            {value}
                        </Text>
                    </Box>
                </Flex>
            </Card.Body>
        </Card.Root>
    );
}
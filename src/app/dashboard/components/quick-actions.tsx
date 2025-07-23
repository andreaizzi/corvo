"use client";

import { Box, Heading, SimpleGrid } from "@chakra-ui/react";
import { LuClock, LuMessageSquare, LuUpload, LuUserRoundPlus } from "react-icons/lu";
import ActionCard from "./action-card";

export default function QuickActions() {
    return (
        <Box w={{ base: "full", xl: "540px" }}>
            <Heading size={{ base: "xl", md: "2xl" }} color="white" fontWeight="semibold" mb={{ base: 4, md: 6 }}>
                Quick actions
            </Heading>
            <SimpleGrid columns={{ base: 1, sm: 2 }} gap={{ base: 4, md: 6 }}>
                <ActionCard
                    icon={<LuUpload />}
                    title="Add digital asset"
                    description="Upload new file or document"
                    onClick={() => {
                        window.location.href = "/vault/new";
                    }}
                />
                <ActionCard
                    icon={<LuUserRoundPlus />}
                    title="Add recipient"
                    description="Designate a new legacy recipient"
                    onClick={() => {
                        window.location.href = "/recipients/new";
                    }}
                />
                <ActionCard
                    icon={<LuMessageSquare />}
                    title="Schedule message"
                    description="Create a future message"
                    onClick={() => {
                        window.location.href = "/messages/new";
                    }}
                />
                <ActionCard
                    icon={<LuClock />}
                    title="Configure check-in"
                    description="Adjust monitoring settings"
                    onClick={() => {
                        window.location.href = "/settings/checkin";
                    }}
                />
            </SimpleGrid>
        </Box>
    );
}

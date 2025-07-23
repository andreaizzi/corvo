"use client";

import { Badge, Flex, Text, Timeline } from "@chakra-ui/react";
import { LuCheck, LuFile, LuMessageSquare, LuUser } from "react-icons/lu";

interface TimelineItem {
    id: string;
    icon: React.ElementType;
    content: {
        subject: string;
        action: string;
        target: string;
        targetColor: string;
    };
    time: string;
}

const timelineItems: TimelineItem[] = [
    {
        id: "1",
        icon: LuFile,
        content: {
            subject: "Credentials.docx",
            action: "added to",
            target: "Vault",
            targetColor: "#042713", // green.900
        },
        time: "5 min ago",
    },
    {
        id: "2",
        icon: LuUser,
        content: {
            subject: "Mario Rossi",
            action: "added to",
            target: "Recipients",
            targetColor: "#2f0553", // purple.900
        },
        time: "Yesterday",
    },
    {
        id: "3",
        icon: LuCheck,
        content: {
            subject: "Check-in completed",
            action: "",
            target: "",
            targetColor: "",
        },
        time: "2 weeks ago",
    },
    {
        id: "4",
        icon: LuFile,
        content: {
            subject: "Bank_Transfers.docx",
            action: "added to",
            target: "Vault",
            targetColor: "#042713", // green.900
        },
        time: "2 weeks ago",
    },
    {
        id: "5",
        icon: LuMessageSquare,
        content: {
            subject: "Money Division Indication",
            action: "added to",
            target: "Message",
            targetColor: "#300c0c", // red.900
        },
        time: "2 weeks ago",
    },
    {
        id: "6",
        icon: LuUser,
        content: {
            subject: "Giulia Bianchi",
            action: "added to",
            target: "Recipients",
            targetColor: "#2f0553", // purple.900
        },
        time: "Yesterday",
    },
];

export default function ActivityTimeline() {
    return (
        <Timeline.Root size={{ base: "md", md: "lg" }}>
            {timelineItems.map((item, index) => {
                const Icon = item.icon;
                const isLast = index === timelineItems.length - 1;

                return (
                    <Timeline.Item key={item.id} paddingBottom={0}>
                        <Timeline.Connector>
                            {!isLast && <Timeline.Separator />}
                            <Timeline.Indicator>
                                <Icon color="gray.fg" />
                            </Timeline.Indicator>
                        </Timeline.Connector>
                        <Timeline.Content gap={1}>
                            <Timeline.Title>
                                <Flex align="center" gap={1.5} flexWrap="wrap">
                                    {item.content.subject && (
                                        <Badge
                                            size={{ base: "md", md: "lg" }}
                                            variant="subtle"
                                            bg="zinc.900"
                                            color="zinc.200"
                                        >
                                            {item.content.subject}
                                        </Badge>
                                    )}
                                    {item.content.action && (
                                        <Text fontSize={{ base: "sm", md: "md" }} color="neutral.50">
                                            {item.content.action}
                                        </Text>
                                    )}
                                    {item.content.target && (
                                        <Badge
                                            size={{ base: "md", md: "lg" }}
                                            variant="subtle"
                                            bg={item.content.targetColor}
                                            color={
                                                item.content.target === "Vault" ? "green.300" :
                                                    item.content.target === "Recipients" ? "purple.300" :
                                                        item.content.target === "Message" ? "red.300" :
                                                            "zinc.200"
                                            }
                                            borderRadius="4px"
                                        >
                                            {item.content.target}
                                        </Badge>
                                    )}
                                </Flex>
                            </Timeline.Title>
                            <Timeline.Description fontSize={{ base: "2xs", md: "xs"  }} color="zinc.400">
                                {item.time}
                            </Timeline.Description>
                        </Timeline.Content>
                    </Timeline.Item>
                );
            })}
        </Timeline.Root>
    );
}
// src/app/vault/components/RecipientSelector.tsx
import {
    Badge,
    Box,
    createListCollection,
    HStack,
    Portal,
    Select,
    Text,
} from "@chakra-ui/react";
import type { VaultFile, Recipient } from "../types";
import type { SelectionDetails } from "node_modules/@chakra-ui/react/dist/types/components/menu/namespace";

interface RecipientSelectorProps {
    file: VaultFile;
    recipients: Recipient[];
    isHovered: boolean;
    isOpen: boolean;
    isPending: boolean;
    onAssign: (file: VaultFile, event: SelectionDetails) => Promise<void>;
    onHover: (file: VaultFile | null) => void;
    onOpen: (file: VaultFile | null) => void;
}

export function RecipientSelector({
    file,
    recipients,
    isHovered,
    isOpen,
    isPending,
    onAssign,
    onHover,
    onOpen,
}: RecipientSelectorProps) {
    const collection = createListCollection({
        items: recipients.map((recipient) => ({
            id: recipient.id,
            name: recipient.fullName,
        })),
        itemToString: (item) => item.name,
        itemToValue: (item) => item.id,
    });

    return (
        <Box>
            <Select.Root
                collection={collection}
                size="sm"
                defaultValue={file.recipients.map((r) => r.id)}
                positioning={{ sameWidth: true, slide: true, offset: { mainAxis: 0 } }}
                onSelect={async (e) => {
                    await onAssign(file, e);
                }}
                closeOnSelect={false}
                onClick={(e) => {
                    onOpen(file);
                    e.stopPropagation();
                }}
                value={file.recipients.map((r) => r.id)}
                gap={0}
                onMouseOver={() => onHover(file)}
                onMouseOut={() => {
                    if (!isPending && !isOpen) {
                        onHover(null);
                    }
                }}
                onPointerDownOutside={() => {
                    onOpen(null);
                    onHover(null);
                }}
                open={isHovered || isOpen}
                disabled={isPending}
            >
                <Select.HiddenSelect />
                <Select.Label mb={0}>
                    <Text
                        fontSize="xs"
                        fontWeight="md"
                        color="fg.muted"
                        textTransform="uppercase"
                        mb={0}
                    >
                        Recipients
                    </Text>
                </Select.Label>
                <Select.Control>
                    <Select.Trigger
                        p={0}
                        borderColor="transparent"
                        _hover={{ borderColor: "fg.muted", cursor: "pointer" }}
                    >
                        <Select.ValueText placeholder="No recipients">
                            <RecipientBadges recipients={file.recipients} />
                        </Select.ValueText>
                    </Select.Trigger>
                    <Select.IndicatorGroup />
                </Select.Control>
                <Portal>
                    <Select.Positioner top="-50px">
                        <Select.Content>
                            {recipients.map((recipient) => (
                                <Select.Item
                                    item={recipient}
                                    key={recipient.id}
                                    justifyContent="flex-start"
                                >
                                    <Select.ItemIndicator />
                                    <Badge borderRadius="sm" fontSize="sm" px={2.5} py={1}>
                                        {recipient.fullName}
                                    </Badge>
                                </Select.Item>
                            ))}
                        </Select.Content>
                    </Select.Positioner>
                </Portal>
            </Select.Root>
        </Box>
    );
}

function RecipientBadges({ recipients }: { recipients: { fullName: string }[] }) {
    if (recipients.length === 0) {
        return (
            <Badge px={0} py={0} borderRadius="sm" fontSize="sm" bg="transparent">
                No recipients
            </Badge>
        );
    }

    return (
        <HStack gap="2">
            {recipients.slice(0, 2).map((recipient, index) => (
                <Badge key={index} borderRadius="sm" fontSize="sm" px={2.5} py={1}>
                    {recipient.fullName}
                </Badge>
            ))}
            {recipients.length > 2 && (
                <Badge borderRadius="sm" fontSize="sm" colorPalette="blue">
                    +{recipients.length - 2}
                </Badge>
            )}
        </HStack>
    );
}
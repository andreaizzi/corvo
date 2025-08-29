// src/app/vault/components/SearchAndFilters.tsx
import { Button, Flex, IconButton, Input, InputGroup } from "@chakra-ui/react";
import { LuArrowUpDown, LuFilter, LuSearch } from "react-icons/lu";

interface SearchAndFiltersProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
}

export function SearchAndFilters({ searchQuery, onSearchChange }: SearchAndFiltersProps) {
    return (
        <Flex gap={4} align="center">
            <InputGroup flex={1} maxW="100%" startElement={<LuSearch />}>
                <Input
                    placeholder="Search digital assets..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    size="lg"
                />
            </InputGroup>
            <Button variant="outline" size="lg">
                <LuFilter />
                Filter
            </Button>
            <IconButton aria-label="Sort" variant="outline" size="lg">
                <LuArrowUpDown />
            </IconButton>
        </Flex>
    );
}
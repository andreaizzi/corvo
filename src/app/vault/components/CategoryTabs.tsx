// src/app/vault/components/CategoryTabs.tsx
import { Badge, Button, Flex } from "@chakra-ui/react";

interface Category {
    id: string;
    name: string;
    count: number;
}

interface CategoryTabsProps {
    categories: Category[];
    selectedCategory: string;
    onCategoryChange: (categoryId: string) => void;
}

export function CategoryTabs({ categories, selectedCategory, onCategoryChange }: CategoryTabsProps) {
    return (
        <Flex gap={2} wrap="wrap">
            {categories.map((category) => (
                <Button
                    key={category.id}
                    onClick={() => onCategoryChange(category.id)}
                    bg={selectedCategory === category.id ? "red.600" : "bg.subtle"}
                    color="white"
                    borderWidth={selectedCategory !== category.id ? 1 : 0}
                    borderColor="zinc.800"
                    _hover={{
                        bg: selectedCategory === category.id ? "red.700" : "bg.muted",
                    }}
                    size="lg"
                >
                    {category.name}
                    <Badge
                        ml={1}
                        bg={selectedCategory === category.id ? "red.700" : "bg.muted"}
                        color="white"
                        borderRadius="sm"
                        fontSize="xs"
                    >
                        {category.count}
                    </Badge>
                </Button>
            ))}
        </Flex>
    );
}
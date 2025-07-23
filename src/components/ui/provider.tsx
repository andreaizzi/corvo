"use client";

import { ChakraProvider } from "@chakra-ui/react";

import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

const customConfig = defineConfig({
  theme: {
    // Override semantic tokens to set default border radius to none
    semanticTokens: {
      radii: {
        l1: { value: "0px" }, // Card radius
        l2: { value: "0px" }, // Button radius  
        l3: { value: "0px" }, // Input radius
      },
    },
  },
});

export const system = createSystem(defaultConfig, customConfig)


export function Provider({ children }: { children: React.ReactNode }) {
  return <ChakraProvider value={system}>{children}</ChakraProvider>;
}
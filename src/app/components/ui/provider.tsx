"use client";

import { ChakraProvider } from "@chakra-ui/react";

import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

const customConfig = defineConfig({});

export const system = createSystem(defaultConfig, customConfig)


export function Provider({ children }: { children: React.ReactNode }) {
  return <ChakraProvider value={system}>{children}</ChakraProvider>;
}
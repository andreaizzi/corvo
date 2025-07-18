import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { Provider } from "./components/ui/provider";
import { SessionProvider } from "~/components/session-provider";
import NavigationBar from "~/components/navigation-bar";
import { Box } from "@chakra-ui/react";

export const metadata: Metadata = {
  title: "Corvo - Digital Legacy Platform",
  description: "Secure your digital legacy with automated asset distribution",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <SessionProvider>
          <Provider>
            <TRPCReactProvider>
              <Box minH="100vh" bg="bg.canvas">
                <NavigationBar />
                <Box as="main">
                  {children}
                </Box>
              </Box>
            </TRPCReactProvider>
          </Provider>
        </SessionProvider>
      </body>
    </html>
  );
}
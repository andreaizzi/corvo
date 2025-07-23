import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { ColorModeProvider } from "~/components/ui/color-mode";
import { SessionProvider } from "~/components/session-provider";
import { auth } from "~/server/auth";
import { Provider } from "~/components/ui/provider";
import ResponsiveLayout from "~/components/responsive-layout";

export const metadata: Metadata = {
  title: "Corvo - Digital Legacy Platform",
  description: "Secure your digital legacy with automated asset distribution",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  // Check if we're on a protected route (not auth pages or home)
  const showSidebar = session?.user;

  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <SessionProvider>
          <Provider>
            <ColorModeProvider forcedTheme="dark">
              <TRPCReactProvider>
                <ResponsiveLayout
                  user={showSidebar ? {
                    name: session.user.name ?? "User",
                    email: session.user.email,
                    image: session.user.image ?? undefined,
                  } : undefined}
                >
                  {children}
                </ResponsiveLayout>
              </TRPCReactProvider>
            </ColorModeProvider>
          </Provider>
        </SessionProvider>
      </body>
    </html>
  );
}
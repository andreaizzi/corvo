"use client";

import { useState } from "react";
import { Box } from "@chakra-ui/react";
import Header from "./header";
import Sidebar from "./sidebar";

interface ResponsiveLayoutProps {
    children: React.ReactNode;
    user?: {
        name: string;
        email: string;
        image?: string;
    };
}

export default function ResponsiveLayout({ children, user }: ResponsiveLayoutProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <Box minH="100vh" className="dark">
            {user && (
                <>
                    {/* Mobile Header */}
                    <Header
                        user={user}
                        onMenuToggleAction={toggleMobileMenu}
                    />

                    {/* Sidebar */}
                    <Sidebar
                        user={user}
                        isOpen={isMobileMenuOpen}
                        onClose={closeMobileMenu}
                    />
                </>
            )}

            {/* Main Content */}
            <Box
                as="main"
                ml={{ base: 0, lg: user ? "320px" : 0 }}
                minH="100vh"
            >
                {children}
            </Box>
        </Box>
    );
}

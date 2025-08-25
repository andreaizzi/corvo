/* eslint-disable @next/next/no-sync-scripts */
export default async function DebugLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <div>
            <script src="https://cdn.tailwindcss.com"></script>
            {children}
        </div>
    );
}
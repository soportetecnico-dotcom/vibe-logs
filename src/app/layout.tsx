import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "VibeLogs - Productivity Space",
    description: "SaaS for modern organizations",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es">
            <body>{children}</body>
        </html>
    );
}

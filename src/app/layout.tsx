import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";

import { SiteChrome } from "@/components/SiteChrome";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "NexusArchive – Multi-TCG tools, archives, and cardboard chaos.",
  description:
    "NexusArchive is an unofficial, fan-made TCG archive with tools for Riftbound, One Piece Trading Card Game, and Magic: The Gathering. Not affiliated with the rights holders.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className + " min-h-screen antialiased"}>
        <ClerkProvider>
          <SiteChrome>{children}</SiteChrome>
        </ClerkProvider>
      </body>
    </html>
  );
}

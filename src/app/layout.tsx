import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";

import { SiteChrome } from "@/components/SiteChrome";
import { isClerkConfigured } from "@/lib/auth-config";

import "./globals.css";

const impactVerificationMeta = {
  name: "impact-site-verification",
  value: "d6d80d76-9c73-4d99-a345-b3d6bad1ad03",
} as Record<string, string>;

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#020617",
};

export const metadata: Metadata = {
  title: "NexusArchive – Multi-TCG tools, archives, and cardboard chaos.",
  description:
    "NexusArchive is an unofficial, fan-made TCG archive with tools for Riftbound, One Piece Trading Card Game, and Magic: The Gathering. Not affiliated with the rights holders.",
  applicationName: "NexusArchive",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authEnabled = isClerkConfigured();

  return (
    <html lang="en">
      <head>
        <meta {...impactVerificationMeta} />
      </head>
      <body className={inter.className + " min-h-screen overflow-x-hidden bg-slate-950 antialiased"}>
        {authEnabled ? (
          <ClerkProvider>
            <SiteChrome authEnabled>{children}</SiteChrome>
          </ClerkProvider>
        ) : (
          <SiteChrome authEnabled={false}>{children}</SiteChrome>
        )}
      </body>
    </html>
  );
}

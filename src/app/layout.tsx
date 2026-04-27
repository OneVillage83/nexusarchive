import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import Script from "next/script";

import { SiteChrome } from "@/components/SiteChrome";
import { isClerkConfigured } from "@/lib/auth-config";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#020617",
};

export const metadata: Metadata = {
  title: "NexusArchive - Multi-TCG tools, archives, and cardboard chaos.",
  description:
    "NexusArchive is an unofficial, fan-made TCG archive with tools for Riftbound, One Piece Trading Card Game, and Magic: The Gathering. Not affiliated with the rights holders.",
  applicationName: "NexusArchive",
  other: {
    "google-adsense-account": "ca-pub-4511788937363503",
    "impact-site-verification": "d6d80d76-9c73-4d99-a345-b3d6bad1ad03",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authEnabled = isClerkConfigured();

  return (
    <html lang="en">
      <body className={inter.className + " min-h-screen overflow-x-hidden bg-slate-950 antialiased"}>
        <Script
          id="adsbygoogle-init"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4511788937363503"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
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

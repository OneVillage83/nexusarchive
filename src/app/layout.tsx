import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import { DesktopNav } from "@/components/DesktopNav";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "NexusArchive – Everything Riftbound, all in one archive.",
  description:
    "NexusArchive is an unofficial, fan-made Riftbound card database with deck tools and combos — built to be the Nexus for every Riftbound player. Not affiliated with Riot Games.",
  // 👇 This becomes:
  // <meta name="google-adsense-account" content="ca-pub-4511788937363503" />
  other: {
    "google-adsense-account": "ca-pub-4511788937363503",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* ⛔ NO <head> TAG HERE AT ALL */}
      <body
        className={
          inter.className +
          " min-h-screen text-slate-50 antialiased bg-cover bg-no-repeat bg-fixed"
        }
        style={{
          backgroundImage: "url('/backgrounds/home-hero.png')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Top-left floating archive glyph + Tools pill */}
        <div className="fixed left-4 top-6 z-30 flex items-center gap-3">
          <Link
            href="/"
            className="
              group inline-flex h-10 w-10 items-center justify-center
              rounded-full bg-black/30 backdrop-blur
              border border-sky-300/50
              shadow-[0_0_18px_rgba(0,0,0,0.7)]
              transition-all duration-200
              hover:bg-sky-500/10
            "
          >
            <div className="relative h-8 w-8">
              <Image
                src="/Logos/transparentarchivelogo.png"
                alt="NexusArchive glyph"
                fill
                sizes="32px"
                className="
                  object-contain opacity-90
                  transition-all duration-200
                  group-hover:scale-110
                  group-hover:opacity-100
                  group-hover:drop-shadow-[0_0_18px_rgba(56,189,248,0.9)]
                "
                priority
              />
            </div>
          </Link>

          {/* Tools pill – phones & tablets only */}
          <details className="relative lg:hidden">
            <summary
              className="
                flex items-center gap-2 rounded-full
                bg-black/45 px-4 py-1.5
                text-xs font-medium text-amber-50
                border border-white/25
                shadow-[0_0_14px_rgba(0,0,0,0.7)]
                backdrop-blur
                cursor-pointer select-none
                list-none
              "
            >
              <span>Tools</span>
              <span className="text-[10px] opacity-80">▾</span>
            </summary>

            <div
              className="
                absolute left-0 mt-2 w-44 rounded-2xl
                bg-black/80 border border-white/20
                shadow-[0_18px_40px_rgba(0,0,0,0.85)]
                backdrop-blur-sm
              "
            >
              <nav className="flex flex-col py-2 text-xs text-amber-50">
                <Link href="/cards" className="px-3 py-1.5 hover:bg-white/10">
                  Card Gallery
                </Link>
                <Link
                  href="/deckbuilder"
                  className="px-3 py-1.5 hover:bg-white/10"
                >
                  Deck Builder
                </Link>
                <Link
                  href="/combos"
                  className="px-3 py-1.5 hover:bg-white/10"
                >
                  Synergy &amp; Combo Finder
                </Link>
                <Link
                  href="/decklists"
                  className="px-3 py-1.5 hover:bg-white/10"
                >
                  Deck Lists
                </Link>
                <Link
                  href="/collection"
                  className="px-3 py-1.5 hover:bg-white/10"
                >
                  Collection
                </Link>
                <Link href="/rules" className="px-3 py-1.5 hover:bg-white/10">
                  Game Rules
                </Link>
              </nav>
            </div>
          </details>
        </div>

        <div className="flex min-h-screen flex-col">
          <header className="pt-4">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4">
              <div className="hidden md:flex flex-1 items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-amber-50/90">
                  <DesktopNav />
                </div>

                <nav className="flex items-center gap-6 text-xs text-amber-50">
                  <Link href="/articles" className="hover:text-amber-200">
                    Articles
                  </Link>
                  <Link href="/about" className="hover:text-amber-200">
                    About / FAQ
                  </Link>
                  <Link href="/contact" className="hover:text-amber-200">
                    Contact
                  </Link>
                </nav>
              </div>

              <div className="md:hidden h-10 w-10" />
            </div>
          </header>

          <main className="flex-1">
            <div className="mx-auto max-w-6xl px-4 py-0">{children}</div>
          </main>

          {/* Footer unchanged */}
        </div>
      </body>
    </html>
  );
}

import type { Metadata,Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "NexusArchive – Everything Riftbound, all in one archive.",
  description:
    "NexusArchive is an unofficial, fan-made Riftbound card database with deck tools and combos — built to be the Nexus for every Riftbound player. Not affiliated with Riot Games.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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
          {/* Glyph button (home link) */}
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

          {/* Tools pill – "all in one spot" dropdown */}
          <details className="relative">
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

            {/* Dropdown panel */}
            <div
              className="
                absolute left-0 mt-2 w-44 rounded-2xl
                bg-black/80 border border-white/20
                shadow-[0_18px_40px_rgba(0,0,0,0.85)]
                backdrop-blur-sm
              "
            >
              <nav className="flex flex-col py-2 text-xs text-amber-50">
                <Link
                  href="/cards"
                  className="px-3 py-1.5 hover:bg-white/10"
                >
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
                  Combo Finder
                </Link>
                <Link
                  href="/decklists"
                  className="px-3 py-1.5 hover:bg-white/10"
                >
                  Deck Lists
                </Link>
                <Link
                  href="/rules"
                  className="px-3 py-1.5 hover:bg-white/10"
                >
                  Game Rules
                </Link>
              </nav>
            </div>
          </details>
        </div>

        {/* Main page chrome (header + content + footer) */}
        <div className="flex min-h-screen flex-col">
          {/* Top nav */}
          <header className="pt-4">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4">
              {/* Left spacer so nav lines up nicely with hero content */}
              <div className="h-10 w-10" />

              {/* Minimal nav: Articles / About / Contact */}
              <nav className="flex items-center gap-5 text-xs font-medium text-amber-50 sm:text-sm">
                <Link
                  href="/articles"
                  className="transition-colors hover:text-white hover:underline underline-offset-4"
                >
                  Articles
                </Link>
                <Link
                  href="/about"
                  className="transition-colors hover:text-white hover:underline underline-offset-4"
                >
                  About / FAQ
                </Link>
                <Link
                  href="/contact"
                  className="transition-colors hover:text-white hover:underline underline-offset-4"
                >
                  Contact
                </Link>
              </nav>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1">
            <div className="mx-auto max-w-6xl px-4 py-0">{children}</div>
          </main>

          {/* Footer */}
          <footer className="mt-10 border-t border-white/10 bg-black/40 backdrop-blur-sm">
            <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-white/80">
              <div className="grid gap-6 md:grid-cols-4">
                {/* Brand wordmark */}
                <div className="flex items-center">
                  <div className="relative h-16 w-72 md:h-20 md:w-80">
                    <Image
                      src="/Logos/wordmarktransparent.png"
                      alt="NexusArchive wordmark"
                      fill
                      sizes="320px"
                      className="object-contain drop-shadow-[0_0_18px_rgba(0,0,0,0.9)]"
                    />
                  </div>
                </div>

                {/* Tools */}
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
                    Tools
                  </div>
                  <ul className="space-y-1 text-white/90">
                    <li>
                      <Link
                        href="/cards"
                        className="transition-colors hover:text-amber-200"
                      >
                        Card Gallery
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/deckbuilder"
                        className="transition-colors hover:text-amber-200"
                      >
                        Deck Builder
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/combos"
                        className="transition-colors hover:text-amber-200"
                      >
                        Combo Finder
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/decklists"
                        className="transition-colors hover:text-amber-200"
                      >
                        Deck Lists
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Info */}
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
                    Info
                  </div>
                  <ul className="space-y-1 text-white/90">
                    <li>
                      <Link
                        href="/about"
                        className="transition-colors hover:text-amber-200"
                      >
                        About / FAQ
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/contact"
                        className="transition-colors hover:text-amber-200"
                      >
                        Contact
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Legal */}
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
                    Legal
                  </div>
                  <ul className="space-y-1 text-white/90">
                    <li>
                      <Link
                        href="/legal"
                        className="transition-colors hover:text-amber-200"
                      >
                        tiny little legal stuff →
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Riot disclaimer */}
              <div className="mt-6 space-y-1 text-[11px] text-white/80">
                <p>
                  NexusArchive is an unofficial fan project and is not endorsed
                  by, directly affiliated with, maintained, authorized, or
                  sponsored by Riot Games, Inc.
                </p>
                <p>
                  NexusArchive was created under Riot Games&apos;{" "}
                  <a
                    href="https://www.riotgames.com/en/legal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-amber-200"
                  >
                    Legal Jibber Jabber
                  </a>{" "}
                  policy using assets owned by Riot Games. Riot Games does not
                  endorse or sponsor this project.
                </p>
                <p>
                  Riftbound™ and all related assets are the property of Riot
                  Games, Inc. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

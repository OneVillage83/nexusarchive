import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });

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
          " min-h-screen bg-slate-950 text-slate-100 antialiased"
        }
      >
        <div className="flex min-h-screen flex-col">
          {/* Top nav */}
          <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              {/* Logo only, no text */}
              <Link href="/" className="flex items-center">
                <div className="relative h-10 w-10">
                  <Image
                    src="/Logos/transparentsymbollogo.png"
                    alt="NexusArchive logo"
                    fill
                    sizes="40px"
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>

              {/* Nav links */}
              <nav className="flex items-center gap-4 text-sm">
                <Link
                  href="/cards"
                  className="text-slate-300 hover:text-emerald-300"
                >
                  Card Gallery
                </Link>
                <Link
                  href="/combos"
                  className="text-slate-300 hover:text-emerald-300"
                >
                  Combo Finder
                </Link>
                <Link
                  href="/deckbuilder"
                  className="text-slate-300 hover:text-emerald-300"
                >
                  Deck Builder
                </Link>
                <Link
                  href="/decklists"
                  className="text-slate-300 hover:text-emerald-300"
                >
                  Deck Lists
                </Link>
                <Link
                  href="/articles"
                  className="text-slate-300 hover:text-emerald-300"
                >
                  Articles
                </Link>
                <Link
                  href="/about"
                  className="text-slate-300 hover:text-emerald-300"
                >
                  About / FAQ
                </Link>
              </nav>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1">
            <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
          </main>

          {/* Big footer (Scryfall-style) */}
          <footer className="border-t border-slate-800 bg-slate-950/90">
            <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-slate-400">
              {/* Columns */}
              <div className="grid gap-6 md:grid-cols-4">
                {/* Brand wordmark */}
                  <div className="flex items-center">
                    <div className="relative h-14 w-56 md:h-16 md:w-64">
                      <Image
                        src="/logos/wordmarktransparent.png"
                        alt="NexusArchive wordmark"
                        fill
                        sizes="(min-width: 768px) 256px, 224px"
                        className="object-contain"
                      />
                    </div>
                   </div>

                {/* Tools */}
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Tools
                  </div>
                  <ul className="space-y-1">
                    <li>
                      <Link
                        href="/cards"
                        className="transition-colors hover:text-emerald-300"
                      >
                        Card Gallery
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/deckbuilder"
                        className="transition-colors hover:text-emerald-300"
                      >
                        Deck Builder
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/combos"
                        className="transition-colors hover:text-emerald-300"
                      >
                        Combo Finder
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/decklists"
                        className="transition-colors hover:text-emerald-300"
                      >
                        Deck Lists
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Info */}
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Info
                  </div>
                  <ul className="space-y-1">
                    <li>
                      <Link
                        href="/about"
                        className="transition-colors hover:text-emerald-300"
                      >
                        About / FAQ
                      </Link>
                    </li>
                    <li className="text-slate-600">Contact (coming soon)</li>
                  </ul>
                </div>

                {/* Legal – tiny, but present */}
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Legal
                  </div>
                  <ul className="space-y-1">
                    <li>
                      <Link
                        href="/legal"
                        className="text-slate-500 transition-colors hover:text-emerald-300"
                      >
                        tiny little legal stuff →
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Riot / IP disclaimer */}
              <div className="mt-6 space-y-1 text-[11px] text-slate-500">
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
                    className="underline hover:text-emerald-300"
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

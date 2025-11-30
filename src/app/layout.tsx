import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

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
              {/* Logo / Home link */}
              <Link href="/" className="flex items-center gap-2">
                {/* Placeholder Nexus icon – can swap for custom logo later */}
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-emerald-400 shadow-lg shadow-emerald-500/40" />
                <div className="flex flex-col leading-tight">
                  <span className="text-lg font-semibold tracking-wide">
                    NexusArchive
                  </span>
                  <span className="text-xs text-slate-400">
                    Unofficial Riftbound card archive.
                  </span>
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
                {/* no Legal link here on purpose */}
              </nav>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1">
            <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
          </main>

          {/* Footer – Riot / Riftbound legal */}
          <footer className="border-t border-slate-800 bg-slate-950/80">
            <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-slate-500 space-y-1">
              <p>
                <span className="font-semibold text-slate-300">
                  NexusArchive.lol
                </span>{" "}
                · Riftbound tools &amp; database.
              </p>

              <p>Unofficial fan project – not affiliated with Riot Games.</p>

              <p>
                NexusArchive was created under Riot Games&apos; &quot;Legal
                Jibber Jabber&quot; policy using assets owned by Riot Games.
                Riot Games does not endorse or sponsor this project.
              </p>

              <p>
                Riftbound™ and all related assets are the property of Riot
                Games, Inc. All rights reserved.
              </p>

              <p className="pt-2">
                <a
                  href="/legal"
                  className="text-slate-600 hover:text-emerald-300 underline hover:no-underline"
                >
                  tiny little legal stuff →
                </a>
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

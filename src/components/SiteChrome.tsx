"use client";

import Image from "next/image";
import Link from "next/link";
import { UserButton, useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

import { DesktopNav } from "@/components/DesktopNav";
import {
  GAME_TOOL_LINKS,
  GATEWAY_BACKGROUND,
  buildGamePath,
  getActiveGameFromPath,
  getGameBySlug,
} from "@/lib/games";

type SiteChromeProps = {
  authEnabled: boolean;
  children: React.ReactNode;
};

export function SiteChrome({ authEnabled, children }: SiteChromeProps) {
  const pathname = usePathname();
  const activeGame = getActiveGameFromPath(pathname);
  const activeGameConfig = activeGame ? getGameBySlug(activeGame) : undefined;
  const isAuthPage =
    pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

  const backgroundImage =
    activeGameConfig?.backgroundImage ?? GATEWAY_BACKGROUND;

  return (
    <div
      className="min-h-screen text-slate-50"
      style={{
        backgroundImage,
        backgroundAttachment: "fixed",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      <div className="min-h-screen bg-slate-950/25 backdrop-blur-[1px]">
        <div className="fixed left-4 top-6 z-30 flex items-center gap-3">
          <Link
            href="/"
            className="
              group inline-flex h-10 w-10 items-center justify-center
              rounded-full border border-sky-300/50 bg-black/30
              shadow-[0_0_18px_rgba(0,0,0,0.7)] backdrop-blur
              transition-all duration-200 hover:bg-sky-500/10
            "
          >
            <div className="relative h-8 w-8">
              <Image
                src="/Logos/transparentarchivelogo.png"
                alt="NexusArchive glyph"
                fill
                sizes="32px"
                className="
                  object-contain opacity-90 transition-all duration-200
                  group-hover:scale-110 group-hover:opacity-100
                  group-hover:drop-shadow-[0_0_18px_rgba(56,189,248,0.9)]
                "
                priority
              />
            </div>
          </Link>

          {activeGameConfig ? (
            <Link
              href={buildGamePath(activeGameConfig.slug)}
              prefetch={false}
              className="
                hidden rounded-full border border-white/20 bg-black/45
                px-3 py-1.5 text-xs font-medium text-amber-50 shadow-[0_0_16px_rgba(0,0,0,0.65)]
                backdrop-blur md:inline-flex
              "
            >
              {activeGameConfig.shortName}
            </Link>
          ) : null}

          {activeGame ? (
            <details className="relative lg:hidden">
              <summary
                className="
                  flex items-center gap-2 rounded-full border border-white/25
                  bg-black/45 px-4 py-1.5 text-xs font-medium text-amber-50
                  shadow-[0_0_14px_rgba(0,0,0,0.7)] backdrop-blur
                  cursor-pointer select-none list-none
                "
              >
                <span>Tools</span>
                <span className="text-[10px] opacity-80">\u25be</span>
              </summary>

              <div
                className="
                  absolute left-0 mt-2 w-52 rounded-2xl border border-white/20
                  bg-black/80 shadow-[0_18px_40px_rgba(0,0,0,0.85)] backdrop-blur-sm
                "
              >
                <nav className="flex flex-col py-2 text-xs text-amber-50">
                  {GAME_TOOL_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={buildGamePath(activeGame, link.href)}
                      prefetch={false}
                      className="px-3 py-1.5 hover:bg-white/10"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Link
                    href={buildGamePath(activeGame, "articles")}
                    prefetch={false}
                    className="px-3 py-1.5 hover:bg-white/10"
                  >
                    Articles
                  </Link>
                </nav>
              </div>
            </details>
          ) : null}
        </div>

        <div className="flex min-h-screen flex-col">
          <header className="pt-4">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4">
              <div className="hidden min-w-0 flex-1 items-center gap-4 md:flex">
                {activeGame ? (
                  <div className="min-w-0 flex-1">
                    <DesktopNav game={activeGame} />
                  </div>
                ) : (
                  <div className="min-w-0 flex-1" />
                )}
              </div>

              <div className="md:hidden h-10 w-10" />

              <nav className="flex items-center gap-3 text-xs text-amber-50 sm:gap-6">
                {activeGame ? (
                  <Link
                    href={buildGamePath(activeGame, "articles")}
                    prefetch={false}
                    className="hidden hover:text-amber-200 md:inline-flex"
                  >
                    Articles
                  </Link>
                ) : null}
                <Link href="/about" className="hover:text-amber-200">
                  About
                </Link>
                <Link href="/contact" className="hover:text-amber-200">
                  Contact
                </Link>
                <Link href="/legal" className="hidden hover:text-amber-200 sm:inline-flex">
                  Legal
                </Link>
                <AuthNavControls authEnabled={authEnabled} isAuthPage={isAuthPage} />
              </nav>
            </div>
          </header>

          <main className="flex-1">
            <div className="mx-auto max-w-6xl px-4 py-0">{children}</div>
          </main>

          <footer className="mt-10 border-t border-white/10 bg-black/40 backdrop-blur-sm">
            <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-white/80">
              <div className="grid gap-6 md:grid-cols-4">
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

                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
                    {activeGame ? "Tools" : "Games"}
                  </div>
                  <ul className="space-y-1 text-white/90">
                    {activeGame
                      ? GAME_TOOL_LINKS.map((link) => (
                          <li key={link.href}>
                            <Link
                              href={buildGamePath(activeGame, link.href)}
                              prefetch={false}
                              className="transition-colors hover:text-amber-200"
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))
                      : [
                          { href: "/riftbound", label: "Riftbound" },
                          { href: "/one-piece", label: "One Piece TCG" },
                          {
                            href: "/magic-the-gathering",
                            label: "Magic: The Gathering",
                          },
                        ].map((link) => (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              prefetch={false}
                              className="transition-colors hover:text-amber-200"
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                  </ul>
                </div>

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
                    <li>
                      <Link
                        href="/legal"
                        className="transition-colors hover:text-amber-200"
                      >
                        Tiny little legal stuff
                      </Link>
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
                    Account
                  </div>
                  <div className="space-y-2 text-white/90">
                    <AccountCopy authEnabled={authEnabled} />
                  </div>
                </div>
              </div>

              {activeGameConfig ? (
                <div className="mt-6 space-y-1 text-[11px] text-white/80">
                  <p>{activeGameConfig.footer.unofficialLine}</p>
                  <p>
                    {activeGameConfig.footer.policyLine} See{" "}
                    <a
                      href={activeGameConfig.footer.policyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-amber-200"
                    >
                      {activeGameConfig.footer.policyLabel}
                    </a>
                    .
                  </p>
                  <p>{activeGameConfig.footer.ownershipLine}</p>
                </div>
              ) : (
                <div className="mt-6 space-y-1 text-[11px] text-white/80">
                  <p>
                    NexusArchive is a multi-game fan archive for people who like
                    searchable cardboard, deck ideas, and dramatically overthinking
                    single lines of rules text.
                  </p>
                  <p>
                    Each game section keeps the same mildly sleep-deprived house
                    style, but the factual ownership and policy details still belong
                    to the actual rights holders. We bring the jokes. They bring the
                    IP lawyers.
                  </p>
                  <p>
                    If something looks cursed, report it through the contact page and
                    we will feed it to the bug queue with the appropriate amount of
                    respectful fear.
                  </p>
                </div>
              )}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

function AuthNavControls({
  authEnabled,
  isAuthPage,
}: {
  authEnabled: boolean;
  isAuthPage: boolean;
}) {
  if (!authEnabled) {
    return (
      <span className="hidden rounded-full border border-amber-300/30 bg-black/45 px-3 py-1.5 text-[11px] text-amber-100/85 sm:inline-flex">
        Auth setup pending
      </span>
    );
  }

  return <ClerkNavControls isAuthPage={isAuthPage} />;
}

function AccountCopy({ authEnabled }: { authEnabled: boolean }) {
  if (!authEnabled) {
    return (
      <p>
        Clerk is not configured in this environment yet, so the archive is
        running in a temporary “please don&apos;t explode” fallback mode until the
        real keys are added.
      </p>
    );
  }

  return <ClerkAccountCopy />;
}

function ClerkNavControls({ isAuthPage }: { isAuthPage: boolean }) {
  const { userId } = useAuth();

  return (
    <>
      {!userId && !isAuthPage ? (
        <>
          <Link href="/sign-in" className="hover:text-amber-200">
            Log in
          </Link>
          <Link
            href="/sign-up"
            className="
              inline-flex items-center justify-center rounded-full
              bg-amber-400/95 px-3 py-1.5 font-semibold text-slate-950
              shadow-[0_0_16px_rgba(0,0,0,0.65)] transition hover:bg-amber-300
            "
          >
            Create account
          </Link>
        </>
      ) : null}
      {userId ? <UserButton /> : null}
    </>
  );
}

function ClerkAccountCopy() {
  const { userId } = useAuth();

  return !userId ? (
    <p>
      Browse freely. Sign in when you want saved decks, collection tracking,
      and future profile gremlins to remember which flavor of cardboard chaos
      belongs to you.
    </p>
  ) : (
    <p>
      You are cleared for archive duty. Future collection sync, saved decks,
      and game-specific profiles will live here once the database goblins finish
      wiring the pipes.
    </p>
  );
}

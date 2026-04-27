"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserButton, useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

import { isNativeAppShell, openUrlInSystemBrowser } from "@/lib/mobile/capacitor";
import {
  GAMES,
  GAME_ORDER,
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

function subscribeToNativeShell() {
  return () => {};
}

export function SiteChrome({ authEnabled, children }: SiteChromeProps) {
  const pathname = usePathname();
  const activeGame = getActiveGameFromPath(pathname);
  const activeGameConfig = activeGame ? getGameBySlug(activeGame) : undefined;
  const nativeShell = useSyncExternalStore(
    subscribeToNativeShell,
    isNativeAppShell,
    () => false,
  );
  const [gameMenuOpen, setGameMenuOpen] = useState(false);
  const [toolsMenuState, setToolsMenuState] = useState(() => ({
    open: false,
    pathname,
  }));
  const gameMenuCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toolsMenuRef = useRef<HTMLDivElement | null>(null);
  const isAuthPage =
    pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");
  const isGlobalInfoPage =
    pathname === "/about" || pathname === "/contact" || pathname === "/legal";
  const isDeckBuilderPage = pathname.includes("/deckbuilder");

  const backgroundImage =
    activeGameConfig?.backgroundImage ?? GATEWAY_BACKGROUND;
  const backgroundPosition =
    activeGameConfig?.backgroundPosition ?? "center top";
  const backgroundSize = activeGameConfig?.backgroundSize ?? "cover";
  const backgroundAttachment =
    activeGameConfig?.backgroundAttachment ?? "fixed";
  const contentOverlayColor =
    activeGameConfig?.contentOverlayColor ?? "rgba(2, 6, 23, 0.25)";
  const backgroundAnimationClassName =
    activeGameConfig?.backgroundAnimationClassName ?? "";
  const backgroundTextureSrc = activeGameConfig?.backgroundTextureSrc;
  const backgroundTextureOpacity =
    activeGameConfig?.backgroundTextureOpacity ?? 0;
  const backgroundTextureSize =
    activeGameConfig?.backgroundTextureSize ?? "320px 320px";
  const backgroundTextureBlendMode =
    activeGameConfig?.backgroundTextureBlendMode ?? "soft-light";
  const backgroundVignette = activeGameConfig?.backgroundVignette;
  const gamePageLinks = activeGame
    ? [
        {
          href: buildGamePath(activeGame),
          label: `${activeGameConfig?.shortName ?? "Game"} Home`,
        },
        ...GAME_TOOL_LINKS.map((link) => ({
          href: buildGamePath(activeGame, link.href),
          label: link.label,
        })),
        {
          href: buildGamePath(activeGame, "articles"),
          label: "Articles",
        },
      ]
    : [];
  const globalPageMenuLinks = isGlobalInfoPage
    ? [
        { href: "/", label: "Archive Gateway" },
        { href: "/riftbound", label: "Riftbound" },
        { href: "/one-piece", label: "One Piece TCG" },
        { href: "/magic-the-gathering", label: "Magic: The Gathering" },
        { href: "/about", label: "About / FAQ" },
        { href: "/contact", label: "Contact" },
        { href: "/legal", label: "Tiny little legal stuff" },
      ]
    : [];
  const headerMenuLinks = activeGame ? gamePageLinks : globalPageMenuLinks;
  const toolsMenuOpen =
    toolsMenuState.open && toolsMenuState.pathname === pathname;

  function openGameMenu() {
    if (gameMenuCloseTimeoutRef.current) {
      clearTimeout(gameMenuCloseTimeoutRef.current);
      gameMenuCloseTimeoutRef.current = null;
    }

    setGameMenuOpen(true);
  }

  function closeGameMenuWithDelay() {
    if (gameMenuCloseTimeoutRef.current) {
      clearTimeout(gameMenuCloseTimeoutRef.current);
    }

    gameMenuCloseTimeoutRef.current = setTimeout(() => {
      setGameMenuOpen(false);
      gameMenuCloseTimeoutRef.current = null;
    }, 180);
  }

  function closeToolsMenu() {
    setToolsMenuState((current) => {
      if (!current.open && current.pathname === pathname) {
        return current;
      }

      return {
        open: false,
        pathname,
      };
    });
  }

  function toggleToolsMenu() {
    setToolsMenuState((current) => {
      const isCurrentPath = current.pathname === pathname;

      return {
        open: isCurrentPath ? !current.open : true,
        pathname,
      };
    });
  }

  async function handleOpenCurrentPageInBrowser() {
    await openUrlInSystemBrowser(new URL(pathname, window.location.origin).toString());
  }

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (toolsMenuRef.current?.contains(target)) {
        return;
      }

      setToolsMenuState((current) =>
        !current.open && current.pathname === pathname
          ? current
          : {
              open: false,
              pathname,
            },
      );
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setToolsMenuState((current) =>
          !current.open && current.pathname === pathname
            ? current
            : {
                open: false,
                pathname,
              },
        );
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
      if (gameMenuCloseTimeoutRef.current) {
        clearTimeout(gameMenuCloseTimeoutRef.current);
      }
    };
  }, [pathname]);

  return (
    <div
      className={`relative min-h-screen overflow-x-clip text-slate-50 ${backgroundAnimationClassName}`.trim()}
      style={{
        backgroundImage,
        backgroundAttachment,
        backgroundPosition,
        backgroundRepeat: "no-repeat",
        backgroundSize,
      }}
    >
      {backgroundTextureSrc ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage: `url('${backgroundTextureSrc}')`,
            backgroundRepeat: "repeat",
            backgroundSize: backgroundTextureSize,
            mixBlendMode: backgroundTextureBlendMode,
            opacity: backgroundTextureOpacity,
          }}
        />
      ) : null}
      {backgroundVignette ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
          style={{ background: backgroundVignette }}
        />
      ) : null}
      <div
        className="relative z-10 min-h-screen backdrop-blur-[1px]"
        style={{ backgroundColor: contentOverlayColor }}
      >
        <div className="fixed left-4 top-6 z-30 hidden items-center gap-3 md:flex">
          <div
            className="relative"
            onMouseEnter={openGameMenu}
            onMouseLeave={closeGameMenuWithDelay}
            onFocus={openGameMenu}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                closeGameMenuWithDelay();
              }
            }}
          >
            <Link
              href="/"
              aria-expanded={gameMenuOpen}
              aria-haspopup="menu"
              className="
                inline-flex h-10 w-10 items-center justify-center
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

            <div
              aria-hidden="true"
              className="absolute left-0 top-full h-3 w-60"
            />

            <div
              className={`
                absolute left-0 top-full z-20 mt-2 w-60 rounded-2xl border border-white/15
                bg-black/80 p-2 shadow-[0_18px_40px_rgba(0,0,0,0.78)] backdrop-blur-md
                transition-all duration-150
                ${
                  gameMenuOpen
                    ? "pointer-events-auto translate-y-0 opacity-100"
                    : "pointer-events-none -translate-y-1 opacity-0"
                }
              `}
            >
              <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-sky-100/75">
                Game Wings
              </div>
              <nav className="flex flex-col gap-1">
                {GAME_ORDER.map((slug) => {
                  const game = GAMES[slug];
                  const isActive = slug === activeGame;

                  return (
                    <Link
                      key={slug}
                      href={buildGamePath(slug)}
                      onClick={() => {
                        if (gameMenuCloseTimeoutRef.current) {
                          clearTimeout(gameMenuCloseTimeoutRef.current);
                          gameMenuCloseTimeoutRef.current = null;
                        }
                        setGameMenuOpen(false);
                      }}
                      prefetch={false}
                      className={`
                        flex items-center justify-between rounded-xl border px-3 py-2 text-sm
                        transition-colors
                        ${
                          isActive
                            ? "border-white/25 bg-black/75 text-amber-50"
                            : "border-transparent bg-white/[0.03] text-white/80 hover:border-white/10 hover:bg-white/[0.08] hover:text-white"
                        }
                      `}
                    >
                      <span>{game.shortName}</span>
                      {isActive ? (
                        <span className="text-[10px] uppercase tracking-[0.2em] text-amber-200/85">
                          Here
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        <div className="flex min-h-screen flex-col">
          <header className={nativeShell ? "safe-mobile-top" : "pt-4"}>
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4">
              <div className="flex min-w-0 flex-1 items-center gap-3 md:hidden">
                <Link
                  href="/"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sky-300/40 bg-black/45 shadow-[0_0_16px_rgba(0,0,0,0.6)] backdrop-blur"
                >
                  <div className="relative h-7 w-7">
                    <Image
                      src="/Logos/transparentarchivelogo.png"
                      alt="NexusArchive glyph"
                      fill
                      sizes="28px"
                      className="object-contain opacity-95"
                      priority
                    />
                  </div>
                </Link>
                <div className="min-w-0">
                  <div className="truncate text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-100/75">
                    NexusArchive
                  </div>
                  <div className="truncate text-sm text-amber-50/82">
                    {activeGameConfig?.shortName ?? "Archive Gateway"}
                  </div>
                </div>
              </div>

              <div className="hidden min-w-0 flex-1 md:flex">
                <div className="min-w-0 flex-1" />
              </div>

              <nav className="flex min-w-0 flex-wrap items-center justify-end gap-2 text-xs text-amber-50 sm:gap-6">
                <Link href="/about" className="hidden hover:text-amber-200 sm:inline-flex">
                  About
                </Link>
                <Link href="/contact" className="hidden hover:text-amber-200 sm:inline-flex">
                  Contact
                </Link>
                <Link href="/legal" className="hidden hover:text-amber-200 sm:inline-flex">
                  Legal
                </Link>
                <AuthNavControls authEnabled={authEnabled} isAuthPage={isAuthPage} />
                {headerMenuLinks.length > 0 ? (
                  <div className="relative" ref={toolsMenuRef}>
                    <button
                      type="button"
                      aria-expanded={toolsMenuOpen}
                      aria-haspopup="menu"
                      onClick={toggleToolsMenu}
                      className="
                        inline-flex h-9 w-9 items-center justify-center rounded-full
                        border border-white/20 bg-black/45 shadow-[0_0_16px_rgba(0,0,0,0.65)]
                        transition hover:bg-white/10
                      "
                    >
                      <span className="sr-only">Open page menu</span>
                      <span className="flex flex-col gap-1">
                        <span className="block h-0.5 w-4 rounded-full bg-amber-50" />
                        <span className="block h-0.5 w-4 rounded-full bg-amber-50" />
                        <span className="block h-0.5 w-4 rounded-full bg-amber-50" />
                      </span>
                    </button>

                    {toolsMenuOpen ? (
                      <div
                        className="
                          absolute right-0 z-30 mt-2 w-64 rounded-2xl border border-white/20
                          bg-black/85 p-2 shadow-[0_18px_40px_rgba(0,0,0,0.85)] backdrop-blur-md
                        "
                      >
                        <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-100/70">
                          Page Menu
                        </div>
                        <nav className="flex flex-col gap-1" aria-label="Game pages">
                          {headerMenuLinks.map((link) => {
                            const isHomeLink = activeGame
                              ? link.href === buildGamePath(activeGame)
                              : link.href === "/";
                            const isActive = isHomeLink
                              ? pathname === link.href
                              : link.href === "/"
                                ? pathname === "/"
                                : pathname.startsWith(link.href);

                            return (
                              <Link
                                key={link.href}
                                href={link.href}
                                onClick={closeToolsMenu}
                                prefetch={false}
                                className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                                  isActive
                                    ? "border-white/25 bg-black/75 text-amber-50"
                                    : "border-transparent bg-white/[0.03] text-white/80 hover:border-white/10 hover:bg-white/[0.08] hover:text-white"
                                }`}
                              >
                                {link.label}
                              </Link>
                            );
                          })}
                        </nav>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </nav>
            </div>
          </header>

          {isAuthPage && nativeShell ? (
            <div className="mx-auto mt-4 w-full max-w-6xl px-4">
              <div className="rounded-2xl border border-sky-300/30 bg-sky-950/55 px-4 py-3 text-xs text-sky-50/85">
                If the embedded sign-in screen stalls, open this auth page in your
                phone browser.
                <button
                  type="button"
                  onClick={() => void handleOpenCurrentPageInBrowser()}
                  className="ml-3 rounded-full border border-sky-300/35 bg-sky-500/10 px-3 py-1 font-medium text-sky-100 transition hover:bg-sky-500/18"
                >
                  Open in browser
                </button>
              </div>
            </div>
          ) : null}

          <main className="flex-1">
            <div
              className={
                isDeckBuilderPage
                  ? "w-full px-0 py-0"
                  : "mx-auto max-w-6xl px-4 py-0"
              }
            >
              {children}
            </div>
          </main>

          {!isDeckBuilderPage ? (
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
          ) : null}
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
              bg-amber-400/95 px-3 py-1.5 text-[11px] font-semibold text-slate-950
              shadow-[0_0_16px_rgba(0,0,0,0.65)] transition hover:bg-amber-300
            "
          >
            <span className="sm:hidden">Join</span>
            <span className="hidden sm:inline">Create account</span>
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

import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import { GameHomeShowcase } from "@/components/game-pages/GameHomeShowcase";
import { isClerkConfigured } from "@/lib/auth-config";
import { GAMES, GAME_ORDER } from "@/lib/games";

export function RiftboundHomePage() {
  return <GameHomeShowcase game="riftbound" />;
}

export default async function HomePage() {
  const authEnabled = isClerkConfigured();
  const { userId } = authEnabled ? await auth() : { userId: null };

  return (
    <main className="py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-4">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
          <div className="rounded-3xl border border-white/20 bg-black/55 p-6 shadow-[0_0_28px_rgba(0,0,0,0.7)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-950/40 px-3 py-1 text-[11px] uppercase tracking-wide text-sky-100/90">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
              Archive Gateway
            </div>

            <h1 className="mt-4 text-3xl font-semibold leading-tight text-slate-50 sm:text-4xl">
              Pick your cardboard disaster and{" "}
              <span className="text-amber-300">enter the archive</span>.
            </h1>

            <p className="mt-3 text-sm text-slate-200/85 sm:text-base">
              NexusArchive now opens with a proper gateway: log in or create an
              account, then choose which game wing you want to explore. Same
              mildly sleep-deprived house style. Different flavors of cardboard
              chaos.
            </p>

            <div className="mt-5 rounded-2xl border border-white/15 bg-black/50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-amber-200">
                Account access
              </div>

              {!userId ? (
                <>
                  <p className="mt-2 text-sm text-slate-300">
                    {authEnabled
                      ? "Game sections are login-first now, so the archive knows whose decks and collection mess it is dealing with."
                      : "Clerk is not configured in this environment yet, so the archive is showing the new gateway without turning on the login locks just yet."}
                  </p>
                  {authEnabled ? (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href="/sign-in"
                        className="
                          inline-flex items-center justify-center rounded-full border border-white/25
                          bg-black/60 px-4 py-2 text-sm font-medium text-amber-50
                          shadow-[0_0_18px_rgba(0,0,0,0.65)] transition hover:bg-white/5
                        "
                      >
                        Log in
                      </Link>
                      <Link
                        href="/sign-up"
                        className="
                          inline-flex items-center justify-center rounded-full bg-amber-400 px-4 py-2
                          text-sm font-semibold text-slate-950 shadow-[0_0_22px_rgba(250,204,21,0.55)]
                          transition hover:bg-amber-300
                        "
                      >
                        Create account
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-amber-300/25 bg-amber-950/25 px-4 py-3 text-sm text-amber-100/85">
                      Add your real Clerk keys in Vercel and this card will wake up
                      immediately.
                    </div>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-300">
                  You are already holding the keys. Pick a game below and go make
                  the database nervous.
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {GAME_ORDER.map((slug) => {
              const game = GAMES[slug];
              return (
                <Link
                  key={slug}
                  href={`/${slug}`}
                  prefetch={false}
                  className="
                    group flex min-h-[260px] flex-col justify-between rounded-3xl border border-white/15
                    bg-black/55 p-5 shadow-[0_0_26px_rgba(0,0,0,0.65)]
                    transition-transform hover:-translate-y-1 hover:border-white/30
                  "
                  style={{
                    boxShadow: `0 0 28px ${game.glowColor}`,
                  }}
                >
                  <div>
                    <div
                      className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-950"
                      style={{ backgroundColor: game.accentColor }}
                    >
                      {game.shortName}
                    </div>
                    <h2 className="mt-4 text-2xl font-semibold text-slate-50">
                      {game.name}
                    </h2>
                    <p className="mt-3 text-sm text-slate-300">
                      {game.gatewayDescription}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between text-xs text-amber-100/80">
                    <span>{authEnabled ? "Login required" : "Auth setup pending"}</span>
                    <span className="font-semibold text-amber-200 group-hover:text-white">
                      Enter →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

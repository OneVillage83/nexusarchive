import Image from "next/image";
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
    <main className="pb-5 pt-6 sm:pb-6 sm:pt-7 lg:pb-4 lg:pt-10">
      <div className="mx-auto max-w-6xl px-4">
        <section className="grid gap-4 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-stretch">
          <div className="flex h-full flex-col justify-between rounded-3xl border border-white/20 bg-black/55 p-5 shadow-[0_0_28px_rgba(0,0,0,0.7)] sm:p-6 lg:p-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-950/40 px-3 py-1 text-[11px] uppercase tracking-wide text-sky-100/90">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
              Archive Gateway
            </div>

            <h1 className="mt-3 text-[2.75rem] font-semibold leading-[0.98] text-slate-50 sm:text-4xl lg:text-[3.05rem]">
              Pick your cardboard disaster and{" "}
              <span className="text-amber-300">enter the archive</span>.
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-200/85 sm:text-base">
              NexusArchive now opens with a proper gateway: browse any game wing
              right away, then log in or create an account if you want the
              archive to remember your collection, decks, and other carefully
              curated cardboard bad decisions.
            </p>

            <div className="mt-3 rounded-2xl border border-white/15 bg-black/50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-amber-200">
                Account access
              </div>

              {!userId ? (
                <>
                  <p className="mt-2 text-sm text-slate-300">
                    {authEnabled
                      ? "Browsing is public now. Sign in only when you want the archive to remember whose decks, collection, and future account-powered nonsense it is dealing with."
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

          <div className="grid gap-2.5 lg:h-full lg:grid-rows-3">
            {GAME_ORDER.map((slug) => {
              const game = GAMES[slug];
              return (
                <Link
                  key={slug}
                  href={`/${slug}`}
                  prefetch={false}
                  className="
                    group relative isolate overflow-hidden rounded-3xl border border-white/15
                    bg-black/55 p-4 shadow-[0_0_26px_rgba(0,0,0,0.65)]
                    transition-transform hover:-translate-y-1 hover:border-white/30
                    sm:p-4 lg:p-3.5
                  "
                  style={{
                    boxShadow: `0 0 28px ${game.glowColor}`,
                  }}
                >
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-slate-950/96 via-slate-950/90 to-slate-950/70"
                    aria-hidden="true"
                  />
                  <div
                    className="absolute inset-y-0 right-0 w-[39%] sm:w-[37%]"
                    aria-hidden="true"
                  >
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent via-slate-950/10 to-slate-950/75" />
                    <div className="absolute inset-y-3 right-3 left-2 sm:inset-y-3 sm:right-4 sm:left-3">
                      <Image
                        src={game.gatewayLogoSrc}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 300px, (min-width: 640px) 220px, 150px"
                        className="
                          object-contain object-right opacity-[0.24]
                          brightness-[1.08] saturate-[1.1] transition duration-300
                          group-hover:scale-[1.03] group-hover:opacity-[0.34]
                        "
                      />
                    </div>
                  </div>

                  <div className="relative flex min-h-[126px] flex-col justify-between sm:min-h-[132px] lg:min-h-[118px]">
                    <div className="max-w-[69%] sm:max-w-[67%]">
                      <div
                        className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-950"
                        style={{ backgroundColor: game.accentColor }}
                      >
                        {game.shortName}
                      </div>
                      <h2 className="mt-2.5 text-[1.6rem] font-semibold leading-[0.96] text-slate-50 sm:text-[1.72rem] lg:text-[1.56rem]">
                        {game.name}
                      </h2>
                      <p className="mt-1.5 max-w-xl text-[13px] leading-[1.35rem] text-slate-300 sm:text-[14px] lg:text-[13px]">
                        {game.gatewayDescription}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-4 text-xs text-amber-100/80">
                      <span>
                        {authEnabled
                          ? userId
                            ? "Save-ready account"
                            : "Public browsing"
                          : "Auth setup pending"}
                      </span>
                      <span className="font-semibold text-amber-200 group-hover:text-white">
                        Enter →
                      </span>
                    </div>
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

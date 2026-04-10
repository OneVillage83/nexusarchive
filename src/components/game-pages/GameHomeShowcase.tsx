import Image from "next/image";
import Link from "next/link";

import { buildGamePath, getGameBySlug, GameSlug } from "@/lib/games";

type HomeCopy = {
  tagline: string;
  highlightedTagline: string;
  searchPlaceholder: string;
  helperLine: string;
  latestLabel: string;
  featuredArticleTitle: string;
  featuredArticleDescription: string;
  featuredDecks: Array<{ name: string; description: string }>;
  toolDescriptions: Record<string, string>;
  rulesPromptExamples: string[];
};

const HOME_COPY: Record<GameSlug, HomeCopy> = {
  riftbound: {
    tagline: "All the Riftbound tools you need in",
    highlightedTagline: "one spot.",
    searchPlaceholder:
      'Search cards, keywords, or deck ideas... try "burn" or "tokens"...',
    helperLine:
      'Tip: Use card names, keywords, or vibes — "barrier", "burn", "token swarm", "greedy control".',
    latestLabel: "Latest from the Rift wing",
    featuredArticleTitle: "Riftbound Launch: Early Deck Archetypes",
    featuredArticleDescription:
      "A first look at champions and shells that might define early Riftbound meta.",
    featuredDecks: [
      {
        name: "Sample Aggro List",
        description: "Early meta shell",
      },
      {
        name: "Control Shell (WIP)",
        description: "Experimental control build",
      },
    ],
    toolDescriptions: {
      cards: "Browse every Riftbound card in the Nexus Archive.",
      deckbuilder: "Plan new decks and tweak your favorite lists.",
      combos: "Hunt for synergies, combos, and spicy interactions.",
      decklists: "Curated decks, meta shells, and experiments.",
      collection: "Track your real collection and see what it's worth.",
      finance: "Follow prices, route math, movers, sealed EV, and cardboard market drama.",
      rules:
        "Ask the archive. Any ruling, any nuance, answered on the spot.",
    },
    rulesPromptExamples: [
      "If a card creates temporary mana, do I lose it at the end of the round?",
      "If a unit is stunned during its attack, does it still strike?",
      "If I kill a unit that's targeting something, does the ability still resolve?",
    ],
  },
  "one-piece": {
    tagline: "Every pirate, leader, and cardboard mutiny you need in",
    highlightedTagline: "one treasure chest.",
    searchPlaceholder:
      'Search cards, leaders, or deck ideas... try "Straw Hat" or "DON!!"...',
    helperLine:
      'Tip: Search leaders, traits, colors, or deck vibes — "Film", "Navy", "red rush", "late-game grind".',
    latestLabel: "Latest from the pirate vault",
    featuredArticleTitle: "One Piece TCG: Early Meta Crews Worth Watching",
    featuredArticleDescription:
      "A quick look at leaders, engines, and splash packages worth side-eyeing before the next Treasure Cup.",
    featuredDecks: [
      {
        name: "Zoro Pressure Crew",
        description: "Fast board flood shell",
      },
      {
        name: "Yellow Control Notebook",
        description: "Trigger-heavy late game plan",
      },
    ],
    toolDescriptions: {
      cards: "Browse the growing archive of leaders, events, and crew staples.",
      deckbuilder: "Sketch out color lines, DON!! curves, and spicy tech slots.",
      combos: "Track synergies, trigger setups, and suspiciously rude sequences.",
      decklists: "Browse sample crews, event shells, and ladder experiments.",
      collection: "Track your cardboard fleet without losing half your rares at sea.",
      finance: "Watch prices, route math, and sealed pressure before the pirate market gets weird.",
      rules:
        "Keep your judge questions tidy before the table starts shouting about timing windows.",
    },
    rulesPromptExamples: [
      "If I rest a character as cost, can I still attack with a different effect later?",
      "What happens if both players trigger effects off the same KO window?",
      "If I add a card from life to hand, does that count as drawing for this effect?",
    ],
  },
  "magic-the-gathering": {
    tagline: "Every spell, stack fight, and cardboard argument you need in",
    highlightedTagline: "one archive.",
    searchPlaceholder:
      'Search cards, mechanics, or decks... try "blink" or "graveyard"...',
    helperLine:
      'Tip: Search mechanics, colors, tribes, or play patterns — "Selesnya tokens", "artifact storm", "graveyard loops".',
    latestLabel: "Latest from the mana vault",
    featuredArticleTitle: "MTG Brew Radar: Shells We Would Absolutely Keep an Eye On",
    featuredArticleDescription:
      "A quick swing through archetypes, engines, and cardboard crimes worth cataloging before they become the whole room's problem.",
    featuredDecks: [
      {
        name: "Esper Pile (Respectfully)",
        description: "Slow inevitability and stack fights",
      },
      {
        name: "Gruul Midrange Trouble",
        description: "Haste creatures and combat math",
      },
    ],
    toolDescriptions: {
      cards: "Browse creatures, spells, and shiny pieces of cardboard destiny.",
      deckbuilder: "Tune curves, mana bases, and exactly how greedy you plan to be.",
      combos: "Catalog loops, synergies, and the kind of lines judges learn to fear.",
      decklists: "Track meta lists, commander brews, and experiments with consequences.",
      collection: "Organize binders, boxes, and the pile you swore was temporary.",
      finance: "Track mana-value greed, price movement, sealed EV, and exit routes without opening five tabs.",
      rules: "Keep stack arguments from turning into a three-act play.",
    },
    rulesPromptExamples: [
      "If I blink a creature in response to its sacrifice trigger, what still resolves?",
      "Can I retain priority after casting a spell and before my opponent responds?",
      "What happens if both replacement effects want to modify the same draw?",
    ],
  },
};

type GameHomeShowcaseProps = {
  game: GameSlug;
};

export function GameHomeShowcase({ game }: GameHomeShowcaseProps) {
  const config = getGameBySlug(game);
  const copy = HOME_COPY[game];
  const isRiftbound = game === "riftbound";
  const isOnePiece = game === "one-piece";
  const lowerTileSpacingClassName = isRiftbound
    ? "mt-28 sm:mt-32 lg:mt-32"
    : game === "magic-the-gathering"
      ? "mt-10 sm:mt-14 lg:mt-12"
      : "mt-14 sm:mt-18 lg:mt-16";

  if (!config) {
    return null;
  }

  return (
    <main className="py-0">
      <div className="mx-auto max-w-6xl px-4 xl:max-w-[78rem]">
        <h1 className="sr-only">
          NexusArchive {config.name} home. Tools, decks, rules, and cardboard
          nonsense in one place.
        </h1>

        <section className="relative mt-6">
          <div className="mt-16 grid items-center gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)] lg:gap-10">
            <div className="flex flex-col items-center text-center">
              <div
                className={`mx-auto flex w-full max-w-3xl flex-col items-center ${
                  isRiftbound ? "" : "pt-3 sm:pt-4 lg:pt-3"
                }`}
              >
                {isRiftbound ? (
                  <Image
                    src="/Logos/whiteoutlinewordmark.png"
                    alt="NexusArchive wordmark"
                    width={760}
                    height={85}
                    className="block h-auto w-full object-contain drop-shadow-[0_0_20px_rgba(0,0,0,0.7)]"
                    priority
                  />
                ) : (
                  <>
                    <div className="relative h-[92px] w-full max-w-[39rem] overflow-hidden sm:h-[102px]">
                      <Image
                        src="/Logos/white-horizontal-wordmark.png"
                        alt="NexusArchive wordmark"
                        fill
                        sizes="(max-width: 640px) 100vw, 39rem"
                        className="object-cover object-center drop-shadow-[0_0_20px_rgba(0,0,0,0.75)]"
                        priority
                      />
                    </div>
                    <div
                      className="mt-2 rounded-full border border-white/20 bg-black/40 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/80 shadow-[0_0_18px_rgba(0,0,0,0.65)]"
                      style={{ boxShadow: `0 0 22px ${config.glowColor}` }}
                    >
                      {config.shortName}
                    </div>
                  </>
                )}

                <p className="mt-3 text-lg leading-tight text-amber-50/90 sm:text-xl md:text-2xl">
                  {copy.tagline}{" "}
                  <span style={{ color: config.accentColor }}>
                    {copy.highlightedTagline}
                  </span>
                </p>
              </div>

              <form
                action={buildGamePath(game, "cards")}
                className="mt-6 w-full max-w-3xl"
              >
                <div
                  className="
                    mx-auto flex w-full items-center rounded-full border border-white/40
                    bg-black/55 px-1 py-1 shadow-[0_0_32px_rgba(0,0,0,0.8)]
                  "
                >
                  <input
                    type="search"
                    name="q"
                    autoComplete="off"
                    placeholder={copy.searchPlaceholder}
                    className={`flex-1 rounded-full bg-transparent px-4 py-2.5 text-amber-50 outline-none placeholder:text-amber-200/75 sm:px-5 ${
                      isOnePiece
                        ? "text-[11px] sm:text-[13px] placeholder:text-[10px] sm:placeholder:text-[11px]"
                        : "text-xs sm:text-sm"
                    }`}
                  />
                  <button
                    type="submit"
                    className="
                      mr-1 rounded-full bg-amber-400/95 px-3 py-2 text-xs font-semibold
                      text-slate-950 shadow-[0_0_18px_rgba(0,0,0,0.7)]
                      transition hover:bg-amber-300 sm:px-4 sm:text-sm
                    "
                  >
                    Search
                  </button>
                </div>
              </form>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs">
                <Link
                  href={buildGamePath(game, "cards")}
                  prefetch={false}
                  className="
                    inline-flex items-center gap-2 rounded-full border border-white/25
                    bg-black/55 px-3 py-1.5 text-[11px] font-medium text-amber-50
                    shadow-[0_0_10px_rgba(0,0,0,0.6)] transition
                    hover:bg-amber-400/90 hover:text-slate-950
                    hover:shadow-[0_0_22px_rgba(246,191,38,0.85)]
                  "
                >
                  Card gallery
                </Link>

                <Link
                  href={buildGamePath(game, "cards/advanced")}
                  prefetch={false}
                  className="
                    inline-flex items-center gap-2 rounded-full border border-white/25
                    bg-black/55 px-3 py-1.5 text-[11px] font-medium text-amber-50
                    shadow-[0_0_10px_rgba(0,0,0,0.6)] transition
                    hover:bg-amber-400/90 hover:text-slate-950
                    hover:shadow-[0_0_22px_rgba(246,191,38,0.85)]
                  "
                >
                  Advanced search
                </Link>

                <Link
                  href={buildGamePath(game, "articles")}
                  prefetch={false}
                  className="
                    inline-flex items-center gap-2 rounded-full border border-white/25
                    bg-black/55 px-3 py-1.5 text-[11px] font-medium text-amber-50
                    shadow-[0_0_10px_rgba(0,0,0,0.6)] transition
                    hover:bg-amber-400/90 hover:text-slate-950
                    hover:shadow-[0_0_22px_rgba(246,191,38,0.85)]
                  "
                >
                  <span
                    className="h-2 w-2 rounded-full shadow-[0_0_8px_rgba(110,231,183,0.9)]"
                    style={{ backgroundColor: config.accentColor }}
                  />
                  <span className="uppercase tracking-wide">Latest notes</span>
                  <span className="text-[10px] font-semibold">VIEW →</span>
                </Link>
              </div>

              <p className="mt-2 text-center text-[11px] tracking-wide text-amber-100/80">
                {copy.helperLine}
              </p>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div
                  className="h-64 w-64 rounded-full blur-3xl"
                  style={{ backgroundColor: `${config.accentColor}55` }}
                />
              </div>

              <div className="relative h-56 w-56 drop-shadow-[0_0_40px_rgba(0,0,0,0.9)] sm:h-64 sm:w-64 lg:h-72 lg:w-72">
                <Image
                  src="/Logos/transparentsymbollogo.png"
                  alt="NexusArchive symbol logo"
                  fill
                  sizes="(max-width: 640px) 224px, (max-width: 1024px) 256px, 288px"
                  className="animate-dice-float object-contain mix-blend-screen"
                  priority
                />
              </div>
            </div>
          </div>

          <div className={`${lowerTileSpacingClassName} hidden lg:block`}>
            <div className="grid gap-3 lg:grid-cols-7">
              <HeroTile
                href={buildGamePath(game, "cards")}
                title="Card Gallery"
                description={copy.toolDescriptions.cards}
              />
              <HeroTile
                href={buildGamePath(game, "deckbuilder")}
                title="Deck Builder"
                description={copy.toolDescriptions.deckbuilder}
              />
              <HeroTile
                href={buildGamePath(game, "combos")}
                title="Synergy & Combo Finder"
                description={copy.toolDescriptions.combos}
              />
              <HeroTile
                href={buildGamePath(game, "decklists")}
                title="Deck Lists"
                description={copy.toolDescriptions.decklists}
              />
              <HeroTile
                href={buildGamePath(game, "collection")}
                title="Collection"
                description={copy.toolDescriptions.collection}
              />
              <HeroTile
                href={buildGamePath(game, "finance")}
                title="Finance"
                description={copy.toolDescriptions.finance}
              />
              <HeroTile
                href={buildGamePath(game, "rules")}
                title="Game Rules"
                description={copy.toolDescriptions.rules}
              />
            </div>
          </div>
        </section>

        <section className="mt-10 space-y-4 md:mt-16 lg:mt-28">
          <h2 className="text-lg font-semibold text-amber-200">
            {copy.latestLabel}
          </h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/30 bg-black/55 p-4 shadow-[0_0_25px_rgba(15,23,42,0.85)]">
              <h3 className="text-sm font-semibold text-amber-200">Newest Cards</h3>
              <p className="mt-1 text-xs text-amber-50/80">
                Freshly cataloged additions to the {config.shortName} side of the
                archive.
              </p>

              <div className="mt-4 flex gap-2">
                <div className="h-20 flex-1 rounded-xl bg-slate-900/80 ring-1 ring-white/30" />
                <div className="h-20 flex-1 rounded-xl bg-slate-900/80 ring-1 ring-white/30" />
                <div className="h-20 flex-1 rounded-xl bg-slate-900/80 ring-1 ring-white/30" />
              </div>

              <Link
                href={buildGamePath(game, "cards")}
                prefetch={false}
                className="mt-4 inline-flex text-xs font-medium text-amber-200 transition-colors hover:text-white"
              >
                View Card Gallery →
              </Link>
            </div>

            <div className="rounded-2xl border border-white/30 bg-black/55 p-4 shadow-[0_0_25px_rgba(15,23,42,0.85)]">
              <h3 className="text-sm font-semibold text-amber-200">New Deck Lists</h3>
              <p className="mt-1 text-xs text-amber-50/80">
                Recently added builds, experiments, and possibly bad ideas with
                good branding.
              </p>

              <div className="mt-4 space-y-2 text-xs text-amber-50/90">
                {copy.featuredDecks.map((deck) => (
                  <div key={deck.name} className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">{deck.name}</div>
                      <p className="text-[11px] text-amber-50/80">
                        {deck.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href={buildGamePath(game, "decklists")}
                prefetch={false}
                className="mt-4 inline-flex text-xs font-medium text-amber-200 transition-colors hover:text-white"
              >
                Browse Deck Lists →
              </Link>
            </div>

            <div className="rounded-2xl border border-white/30 bg-black/60 p-4 shadow-[0_0_25px_rgba(15,23,42,0.9)]">
              <h3 className="text-sm font-semibold text-amber-200">Latest Article</h3>
              <p className="mt-1 text-xs text-amber-50/80">
                Meta reports, patch breakdowns, and lovingly overcommitted notes.
              </p>

              <div className="mt-4 space-y-1 text-xs text-amber-50/90">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-200">
                  Featured
                </div>
                <div className="font-medium text-white">
                  {copy.featuredArticleTitle}
                </div>
                <p className="text-[11px] text-amber-50/80">
                  {copy.featuredArticleDescription}
                </p>
              </div>

              <Link
                href={buildGamePath(game, "articles")}
                prefetch={false}
                className="mt-4 inline-flex text-xs font-medium text-amber-200 transition-colors hover:text-white"
              >
                View Articles →
              </Link>
            </div>

            <div className="rounded-2xl border border-white/30 bg-black/60 p-4 shadow-[0_0_25px_rgba(15,23,42,0.9)]">
              <h3 className="text-sm font-semibold text-amber-200">Rules Desk</h3>

              <p className="mt-1 text-xs text-amber-50/85">
                Bring timing questions, weird edge cases, and the kind of
                arguments that start with “okay but technically...”
              </p>

              <ul className="mt-3 space-y-1 text-[11px] text-amber-50/80">
                {copy.rulesPromptExamples.map((example) => (
                  <li key={example}>“{example}”</li>
                ))}
              </ul>

              <Link
                href={buildGamePath(game, "rules")}
                prefetch={false}
                className="mt-4 inline-flex text-xs font-medium text-amber-200 transition-colors hover:text-white"
              >
                Open Rules Desk →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

type HeroTileProps = {
  href: string;
  title: string;
  description: string;
};

function HeroTile({ href, title, description }: HeroTileProps) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="
        flex h-full flex-col rounded-2xl border border-white/35 bg-black/55
        px-3 py-2.5 text-left text-amber-50 shadow-[0_0_22px_rgba(0,0,0,0.55)]
        transition-transform transition-shadow hover:-translate-y-1
        hover:shadow-[0_0_30px_rgba(246,191,38,0.75)]
      "
    >
      <div className="text-[13px] font-semibold leading-tight text-amber-200 xl:text-[14px]">
        {title}
      </div>
      <p className="mt-1 text-[10px] leading-[1.32] text-amber-100/82 xl:text-[11px]">
        {description}
      </p>
    </Link>
  );
}

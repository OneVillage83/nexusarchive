import Link from "next/link";

import { buildGamePath, getGameBySlug, GameSlug } from "@/lib/games";

type PlaceholderVariant =
  | "cards"
  | "cards-advanced"
  | "deckbuilder"
  | "combos"
  | "decklists"
  | "collection"
  | "articles"
  | "rules";

type PreviewCard = {
  name: string;
  type: string;
  tag: string;
  statline: string;
};

type PreviewCombo = {
  name: string;
  summary: string;
  pieces: string[];
};

type PreviewDeck = {
  name: string;
  archetype: string;
};

type PreviewArticle = {
  title: string;
  description: string;
};

const PREVIEW_CARDS: Record<Exclude<GameSlug, "riftbound">, PreviewCard[]> = {
  "one-piece": [
    {
      name: "Monkey.D.Luffy",
      type: "Leader",
      tag: "Red / Straw Hat Crew",
      statline: "Life 5 · Power 5000",
    },
    {
      name: "Nami",
      type: "Character",
      tag: "Blue / Straw Hat Crew",
      statline: "Cost 1 · Power 2000",
    },
    {
      name: "Gum-Gum Jet Pistol",
      type: "Event",
      tag: "Red / Straw Hat Crew",
      statline: "Cost 4 · Removal",
    },
  ],
  "magic-the-gathering": [
    {
      name: "Lightning Bolt",
      type: "Instant",
      tag: "Red spell",
      statline: "Cost R · 3 damage",
    },
    {
      name: "Llanowar Elves",
      type: "Creature",
      tag: "Green Elf Druid",
      statline: "Cost G · 1/1",
    },
    {
      name: "Wrath of God",
      type: "Sorcery",
      tag: "White board wipe",
      statline: "Cost 2WW · Destroy all creatures",
    },
  ],
};

const PREVIEW_COMBOS: Record<
  Exclude<GameSlug, "riftbound">,
  PreviewCombo[]
> = {
  "one-piece": [
    {
      name: "Aggro Pressure Curve",
      summary:
        "Flood the board early, chain efficient swings, and keep DON!! usage brutally tight.",
      pieces: ["Cheap rush attackers", "Leader pressure", "Low-cost events"],
    },
    {
      name: "Trigger Grind Loop",
      summary:
        "Trade resources until your life triggers and late-game value take over the table.",
      pieces: ["Yellow triggers", "Hand refill", "KO control"],
    },
  ],
  "magic-the-gathering": [
    {
      name: "Blink Value Engine",
      summary:
        "Reuse enters-the-battlefield effects until the table starts reading your board twice.",
      pieces: ["ETB creatures", "Blink spell", "Value payoff"],
    },
    {
      name: "Graveyard Rebuy Loop",
      summary:
        "Recycle creatures and spells until the opponent realizes the graveyard was never actually a graveyard.",
      pieces: ["Self-mill", "Reanimation", "Sacrifice outlet"],
    },
  ],
};

const PREVIEW_DECKS: Record<Exclude<GameSlug, "riftbound">, PreviewDeck[]> = {
  "one-piece": [
    { name: "Red Straw Hat Pressure", archetype: "Aggro / Tempo" },
    { name: "Yellow Trigger Fortress", archetype: "Control / Value" },
  ],
  "magic-the-gathering": [
    { name: "Esper Midrange Pile", archetype: "Control / Midrange" },
    { name: "Gruul Beatdown", archetype: "Aggro / Midrange" },
  ],
};

const PREVIEW_ARTICLES: Record<
  Exclude<GameSlug, "riftbound">,
  PreviewArticle[]
> = {
  "one-piece": [
    {
      title: "Which leaders actually look ready for the next event weekend?",
      description: "A quick radar sweep of the crews worth serious testing.",
    },
    {
      title: "Trigger math for people who enjoy surviving combat steps",
      description: "A tidy breakdown of what your life pile is trying to tell you.",
    },
  ],
  "magic-the-gathering": [
    {
      title: "The respectable reason we are testing this many removal spells",
      description: "Sometimes a format asks questions. Sometimes you answer all of them.",
    },
    {
      title: "Three engine packages that feel one turn away from being illegal",
      description: "Nothing banned here. Yet.",
    },
  ],
};

type GamePlaceholderPageProps = {
  game: Exclude<GameSlug, "riftbound">;
  variant: PlaceholderVariant;
};

export function GamePlaceholderPage({
  game,
  variant,
}: GamePlaceholderPageProps) {
  const config = getGameBySlug(game);

  if (!config) {
    return null;
  }

  const title = getTitle(config.name, variant);
  const description = getDescription(config.shortName, variant);
  const note = getDeveloperNote(config.shortName, variant);

  return (
    <main className="py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-6xl px-4 space-y-6 sm:space-y-8">
        <section
          className="
            rounded-3xl border border-white/25
            bg-[radial-gradient(circle_at_top,#020617,#020617_40%,#020617_70%,#020617_100%)]
            px-5 py-5 shadow-[0_0_50px_rgba(0,0,0,0.95)] sm:px-8 sm:py-7
          "
        >
          <div
            className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-950"
            style={{ backgroundColor: config.accentColor }}
          >
            {config.shortName}
          </div>
          <h1 className="mb-2 mt-4 text-2xl font-semibold text-amber-50 sm:text-3xl">
            {title}
          </h1>
          <p className="max-w-3xl text-sm text-amber-50/85">{description}</p>

          <div className="mt-4 rounded-2xl border border-sky-200/35 bg-sky-950/60 px-4 py-3 text-xs text-sky-50/85">
            <p>
              <span className="font-semibold text-sky-100">Phase one note:</span>{" "}
              this {config.shortName} section is intentionally shipping as a
              themed shell with preview content first, so the routes, layout, and
              future account model are ready before the full data firehose turns on.
            </p>
          </div>
        </section>

        <div
          className="
            rift-flicker rounded-xl border border-amber-300/30 bg-black/55 px-4 py-3
            text-[12px] text-amber-100/85 shadow-[0_0_15px_rgba(0,0,0,0.6)]
          "
        >
          <p>
            <span className="font-semibold text-amber-200">Developer Note:</span>{" "}
            {note}
          </p>
        </div>

        {renderVariantPanels(game, variant)}

        <div className="pt-2">
          <Link
            href={buildGamePath(game)}
            prefetch={false}
            className="text-xs font-medium text-amber-200 hover:text-white"
          >
            ← Back to {config.shortName} home
          </Link>
        </div>
      </div>
    </main>
  );
}

function renderVariantPanels(
  game: Exclude<GameSlug, "riftbound">,
  variant: PlaceholderVariant,
) {
  switch (variant) {
    case "cards":
      return <CardsPreview game={game} />;
    case "cards-advanced":
      return <AdvancedSearchPreview game={game} />;
    case "deckbuilder":
      return <DeckBuilderPreview game={game} />;
    case "combos":
      return <CombosPreview game={game} />;
    case "decklists":
      return <DecklistsPreview game={game} />;
    case "collection":
      return <CollectionPreview game={game} />;
    case "articles":
      return <ArticlesPreview game={game} />;
    case "rules":
      return <RulesPreview game={game} />;
    default:
      return null;
  }
}

function CardsPreview({ game }: { game: Exclude<GameSlug, "riftbound"> }) {
  const cards = PREVIEW_CARDS[game];

  return (
    <section className="rounded-3xl border border-white/25 bg-black/75 px-5 py-5 shadow-[0_0_45px_rgba(0,0,0,0.98)] sm:px-8 sm:py-7">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-amber-200">Preview card table</h2>
        <p className="text-[11px] text-amber-100/70">
          Search and filtering will hook into real datasets later. For now, this
          panel is proving out layout and per-game route handling.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/20 bg-black/60">
        <table className="min-w-full text-sm">
          <thead className="bg-black/70 text-xs uppercase text-amber-100/70">
            <tr className="border-b border-white/10">
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Tag</th>
              <th className="px-4 py-2 text-left">Stats</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card) => (
              <tr key={card.name} className="border-t border-white/10 hover:bg-white/5">
                <td className="px-4 py-2 font-medium text-amber-50">{card.name}</td>
                <td className="px-4 py-2 text-amber-50/85">{card.type}</td>
                <td className="px-4 py-2 text-amber-50/85">{card.tag}</td>
                <td className="px-4 py-2 text-amber-50/85">{card.statline}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AdvancedSearchPreview({
  game,
}: {
  game: Exclude<GameSlug, "riftbound">;
}) {
  const labels =
    game === "one-piece"
      ? ["Leader", "Color", "Trait", "Cost", "Counter", "Type"]
      : ["Color", "Card Type", "Mana Value", "Format", "Tribe", "Rules Text"];

  return (
    <section className="rounded-3xl border border-white/25 bg-black/75 px-5 py-5 shadow-[0_0_45px_rgba(0,0,0,0.98)] sm:px-8 sm:py-7">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {labels.map((label) => (
          <div key={label}>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-100/80">
              {label}
            </div>
            <div className="mt-1 rounded-md border border-white/25 bg-black/60 px-3 py-2 text-sm text-amber-50/75">
              Placeholder filter slot
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DeckBuilderPreview({
  game,
}: {
  game: Exclude<GameSlug, "riftbound">;
}) {
  const cards = PREVIEW_CARDS[game];

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <Panel
        title="Card search"
        description="This becomes the real search column once the card source is wired in."
      >
        <div className="space-y-2 text-xs text-amber-50/85">
          {cards.map((card) => (
            <div
              key={card.name}
              className="rounded-xl border border-white/20 bg-black/55 px-3 py-2"
            >
              <div className="font-semibold text-amber-50">{card.name}</div>
              <div className="text-[11px] text-amber-100/75">
                {card.type} · {card.tag}
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel
        title="Deck list"
        description="Builds stay browseable in public. Saving them will eventually tie into the signed-in user and game scope."
      >
        <div className="space-y-2 text-xs text-amber-50/85">
          {PREVIEW_DECKS[game].map((deck) => (
            <div
              key={deck.name}
              className="rounded-xl border border-white/20 bg-black/55 px-3 py-2"
            >
              <div className="font-semibold text-amber-50">{deck.name}</div>
              <div className="text-[11px] text-amber-100/75">{deck.archetype}</div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel
        title="Stats"
        description="Curve charts, exports, and price rollups will land after the data layer."
      >
        <ul className="space-y-2 text-[11px] text-amber-100/80">
          <li>Deck count and saved revisions</li>
          <li>Curve and color distribution</li>
          <li>Future export and sharing tools</li>
        </ul>
      </Panel>
    </section>
  );
}

function CombosPreview({ game }: { game: Exclude<GameSlug, "riftbound"> }) {
  return (
    <section className="space-y-3">
      {PREVIEW_COMBOS[game].map((combo) => (
        <article
          key={combo.name}
          className="rounded-2xl border border-white/20 bg-black/60 px-4 py-3 text-xs text-amber-50"
        >
          <h2 className="text-sm font-semibold text-amber-50">{combo.name}</h2>
          <p className="mt-1 text-[11px] text-amber-100/80">{combo.summary}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {combo.pieces.map((piece) => (
              <span
                key={piece}
                className="rounded-full border border-white/20 bg-black/45 px-2 py-1 text-[10px]"
              >
                {piece}
              </span>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}

function DecklistsPreview({
  game,
}: {
  game: Exclude<GameSlug, "riftbound">;
}) {
  return (
    <section className="rounded-2xl border border-white/25 bg-black/75 p-4 sm:p-5">
      <div className="space-y-3 text-xs text-amber-50/85">
        {PREVIEW_DECKS[game].map((deck) => (
          <div
            key={deck.name}
            className="rounded-xl border border-white/18 bg-black/55 px-3 py-2"
          >
            <div className="font-semibold text-amber-50">{deck.name}</div>
            <div className="text-[11px] text-amber-100/75">{deck.archetype}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CollectionPreview({
  game,
}: {
  game: Exclude<GameSlug, "riftbound">;
}) {
  const rows =
    game === "one-piece"
      ? [
          ["Red", 42, 80],
          ["Blue", 31, 76],
          ["Yellow", 28, 72],
        ]
      : [
          ["White", 55, 120],
          ["Blue", 44, 118],
          ["Black", 39, 112],
        ];

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <Panel
        title="Profile overview"
        description="This page stays public to browse. Sign-in only matters once this panel starts saving game-scoped collection data."
      >
        <div className="space-y-2 text-[11px] text-amber-100/80">
          <div>Total cards owned: 128</div>
          <div>Unique cards: 94</div>
          <div>Saved decks in this game: 6</div>
        </div>
      </Panel>
      <Panel
        title="Collection progress"
        description="A preview of the completion bars the signed-in profile will eventually own."
      >
        <div className="space-y-3 text-[11px] text-amber-50/85">
          {rows.map(([label, owned, total]) => {
            const percent = Math.round((Number(owned) / Number(total)) * 100);
            return (
              <div key={String(label)}>
                <div className="flex items-center justify-between">
                  <span>{label}</span>
                  <span>
                    {owned} / {total} · {percent}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/70">
                  <div
                    className="h-full rounded-full bg-amber-400/90"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </section>
  );
}

function ArticlesPreview({ game }: { game: Exclude<GameSlug, "riftbound"> }) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {PREVIEW_ARTICLES[game].map((article) => (
        <article
          key={article.title}
          className="rounded-2xl border border-white/10 bg-black/60 p-4 shadow-[0_0_24px_rgba(15,23,42,0.8)]"
        >
          <h2 className="text-sm font-semibold text-slate-50">{article.title}</h2>
          <p className="mt-2 text-xs text-slate-300">{article.description}</p>
        </article>
      ))}
    </section>
  );
}

function RulesPreview({ game }: { game: Exclude<GameSlug, "riftbound"> }) {
  const config = getGameBySlug(game);

  if (!config) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-white/25 bg-black/75 p-4 sm:p-5">
      <div className="space-y-3 text-sm text-amber-50/85">
        <p>
          The full judge-style rules desk for {config.shortName} is still on the
          build list. For now, this route exists so the structure, login flow,
          and future game-specific tools all have a real home.
        </p>
        <p>
          Until the full rules layer is wired in, use the official resources via{" "}
          <a
            href={config.footer.policyUrl}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-amber-200"
          >
            {config.footer.policyLabel}
          </a>
          .
        </p>
      </div>
    </section>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/25 bg-black/75 p-4 sm:p-5">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-amber-200">{title}</h2>
        <p className="text-[11px] text-amber-100/70">{description}</p>
      </div>
      {children}
    </section>
  );
}

function getTitle(gameName: string, variant: PlaceholderVariant): string {
  switch (variant) {
    case "cards":
      return `${gameName} Card Gallery`;
    case "cards-advanced":
      return `${gameName} Advanced Search`;
    case "deckbuilder":
      return `${gameName} Deck Builder`;
    case "combos":
      return `${gameName} Synergy & Combo Finder`;
    case "decklists":
      return `${gameName} Deck Lists`;
    case "collection":
      return `${gameName} Collection`;
    case "articles":
      return `${gameName} Articles & Reports`;
    case "rules":
      return `${gameName} Rules Desk`;
    default:
      return gameName;
  }
}

function getDescription(shortName: string, variant: PlaceholderVariant): string {
  switch (variant) {
    case "cards":
      return `Browse preview card entries, test the layout, and get this ${shortName} wing ready for real data ingestion.`;
    case "cards-advanced":
      return `This is where deeper filtering lives once the real ${shortName} card source is wired in.`;
    case "deckbuilder":
      return `Build and tune ${shortName} decks openly, then sign in when you want save-to-account features to kick in.`;
    case "combos":
      return `Track synergies, suspicious interactions, and the kind of lines that make the table ask for timestamps.`;
    case "decklists":
      return `Browse sample lists today, then graduate into real imported and user-published decklists later.`;
    case "collection":
      return `Future you gets game-scoped collection tracking. Present you gets a polished public preview of where that saved data will live.`;
    case "articles":
      return `This route is ready for guides, patch notes, and highly opinionated cardboard writing once the editorial queue wakes up.`;
    case "rules":
      return `The rules desk route is live now so the full game structure exists even before the deeper rules tooling arrives.`;
    default:
      return shortName;
  }
}

function getDeveloperNote(shortName: string, variant: PlaceholderVariant): string {
  switch (variant) {
    case "cards":
      return `The ${shortName} card gallery is still running on preview data. Once the real import path is in place, this shell swaps straight over without needing another route redesign.`;
    case "cards-advanced":
      return `These filters are scaffolding for the future real search engine. Think of them as the blueprint pinned to the wall before the actual machine starts humming.`;
    case "deckbuilder":
      return `This builder is the first round of furniture, not the finished workshop. Public browsing stays open; real saves, imports, and exports plug in after the account wiring catches up.`;
    case "combos":
      return `The combo desk is on preview duty for now. Real interaction libraries, community submissions, and search hooks come after the route and account foundation.`;
    case "decklists":
      return `Deck lists are still in mannequin mode here. The real data model shows up in later passes once publishing and user ownership are wired cleanly.`;
    case "collection":
      return `Collections are waiting on the signed-in data layer, but the public page shape, progress widgets, and per-game ownership model are already staked out.`;
    case "articles":
      return `Articles are shipping as a themed shell first, because a proper reading room beats a dead link while the content backlog catches up.`;
    case "rules":
      return `The rules desk route is live so nobody has to guess where it will go later. The actual rulings brain just is not fully caffeinated yet.`;
    default:
      return `${shortName} is warming up.`;
  }
}

export const GAME_ORDER = [
  "riftbound",
  "one-piece",
  "magic-the-gathering",
] as const;

export type GameSlug = (typeof GAME_ORDER)[number];

export type GameToolLink = {
  href: string;
  label: string;
};

export type GameConfig = {
  slug: GameSlug;
  name: string;
  shortName: string;
  gatewayDescription: string;
  backgroundImage: string;
  accentColor: string;
  glowColor: string;
  footer: {
    unofficialLine: string;
    policyLabel: string;
    policyUrl: string;
    policyLine: string;
    ownershipLine: string;
  };
};

export const GAME_TOOL_LINKS: GameToolLink[] = [
  { href: "cards", label: "Card Gallery" },
  { href: "deckbuilder", label: "Deck Builder" },
  { href: "combos", label: "Synergy & Combo Finder" },
  { href: "decklists", label: "Deck Lists" },
  { href: "collection", label: "Collection" },
  { href: "rules", label: "Game Rules" },
];

export const GATEWAY_BACKGROUND =
  "radial-gradient(circle at top, rgba(56,189,248,0.18), transparent 28%), radial-gradient(circle at 82% 12%, rgba(245,158,11,0.16), transparent 24%), linear-gradient(160deg, #020617 0%, #081221 44%, #111827 100%)";

export const GAMES: Record<GameSlug, GameConfig> = {
  riftbound: {
    slug: "riftbound",
    name: "Riftbound",
    shortName: "Riftbound",
    gatewayDescription:
      "Champions, combos, and judge calls from the Riot-flavored wing of the archive.",
    backgroundImage:
      "linear-gradient(rgba(2, 6, 23, 0.72), rgba(2, 6, 23, 0.84)), url('/backgrounds/home-hero.png')",
    accentColor: "#facc15",
    glowColor: "rgba(250, 204, 21, 0.45)",
    footer: {
      unofficialLine:
        "NexusArchive is an unofficial fan project and is not endorsed by, directly affiliated with, maintained, authorized, or sponsored by Riot Games, Inc.",
      policyLabel: "Riot Games Legal Jibber Jabber",
      policyUrl: "https://www.riotgames.com/en/legal",
      policyLine:
        "We built this corner of the archive under Riot Games' fan-use policy using assets owned by Riot Games. No secret dev basement access. No suspicious hextech keycards.",
      ownershipLine:
        "Riftbound and all related assets are the property of Riot Games, Inc. All rights reserved.",
    },
  },
  "one-piece": {
    slug: "one-piece",
    name: "One Piece Trading Card Game",
    shortName: "One Piece TCG",
    gatewayDescription:
      "Pirates, DON!! math, and enough cardboard adventure to make a marine nervous.",
    backgroundImage:
      "radial-gradient(circle at top, rgba(56, 189, 248, 0.22), transparent 30%), radial-gradient(circle at 78% 18%, rgba(239, 68, 68, 0.18), transparent 24%), linear-gradient(160deg, #06111f 0%, #0b1f38 48%, #111827 100%)",
    accentColor: "#38bdf8",
    glowColor: "rgba(56, 189, 248, 0.42)",
    footer: {
      unofficialLine:
        "NexusArchive is an unofficial fan project and is not endorsed by, directly affiliated with, maintained, authorized, or sponsored by Bandai or the One Piece rights holders.",
      policyLabel: "Official ONE PIECE CARD GAME site",
      policyUrl: "https://en.onepiece-cardgame.com/",
      policyLine:
        "We are borrowing the sea breeze, not the ship. If you need the official decks, rules, products, or event policy, the real Grand Line starts on Bandai's official site.",
      ownershipLine:
        "Official ONE PIECE CARD GAME notices state: \u00a9Eiichiro Oda/Shueisha and \u00a9Eiichiro Oda/Shueisha, Toei Animation.",
    },
  },
  "magic-the-gathering": {
    slug: "magic-the-gathering",
    name: "Magic: The Gathering",
    shortName: "Magic: The Gathering",
    gatewayDescription:
      "Mana, stack fights, and enough cardboard history to keep the table arguing until sunrise.",
    backgroundImage:
      "radial-gradient(circle at top, rgba(168, 85, 247, 0.24), transparent 28%), radial-gradient(circle at 78% 18%, rgba(16, 185, 129, 0.18), transparent 22%), linear-gradient(160deg, #120b1f 0%, #23123a 48%, #0f172a 100%)",
    accentColor: "#c084fc",
    glowColor: "rgba(192, 132, 252, 0.4)",
    footer: {
      unofficialLine:
        "NexusArchive is an unofficial fan project and is not endorsed by, directly affiliated with, maintained, authorized, or sponsored by Wizards of the Coast LLC.",
      policyLabel: "Wizards Fan Content Policy",
      policyUrl: "https://company.wizards.com/en/legal/fancontentpolicy",
      policyLine:
        "We are staying in the fan-content lane here. No pretending to be official. No summoning counterfeit Black Lotuses out of thin air. No lawyer aggro if we can help it.",
      ownershipLine:
        "Magic: The Gathering and related names, logos, and game assets are trademarks or registered trademarks of Wizards of the Coast LLC and its affiliates.",
    },
  },
};

export function isGameSlug(value: string): value is GameSlug {
  return GAME_ORDER.includes(value as GameSlug);
}

export function getGameBySlug(slug: string): GameConfig | undefined {
  if (!isGameSlug(slug)) {
    return undefined;
  }

  return GAMES[slug];
}

export function buildGamePath(game: GameSlug, href = ""): string {
  const cleaned = href.replace(/^\/+/, "");
  return cleaned ? `/${game}/${cleaned}` : `/${game}`;
}

export function getActiveGameFromPath(pathname: string): GameSlug | null {
  const [, firstSegment] = pathname.split("/");
  if (!firstSegment || !isGameSlug(firstSegment)) {
    return null;
  }

  return firstSegment;
}

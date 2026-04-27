import type { GameSlug } from "@/lib/games";

export type DeckInputSource = "paste" | "saved" | "scratch";

export type ComboSearchFilters = {
  q: string;
  includeCards: string[];
  excludeCards: string[];
  tags: string[];
  formatTags: string[];
  completeOnly: boolean;
  page: number;
  pageSize: number;
};

export type ComboPieceRole =
  | "piece"
  | "commander"
  | "required"
  | "template"
  | "generated"
  | string;

export type ComboPiece = {
  role: ComboPieceRole;
  familyKey: string;
  cardName: string;
  quantity: number;
  cardId: string | null;
  imageUrl: string | null;
  typeLine: string | null;
  text: string | null;
  domains: string[];
  energyCost: number | null;
  power: number | null;
  might: number | null;
  hp: number | null;
};

export type ComboMatchDetail = {
  bucket: ComboMatchBucket;
  ownedPieces: ComboPiece[];
  missingPieces: ComboPiece[];
  ownedCount: number;
  totalCount: number;
  confidence: number;
  reason: string;
};

export type ComboResultSummary = {
  id: number | null;
  slug: string;
  game: GameSlug;
  source: string;
  kind: string;
  name: string;
  summary: string | null;
  resultText: string | null;
  steps: string[];
  prerequisites: string[];
  tags: string[];
  formatTags: string[];
  isComplete: boolean;
  popularity: number | null;
  pieces: ComboPiece[];
  href: string;
  match: ComboMatchDetail | null;
};

export type ComboBrowseResponse = {
  results: ComboResultSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filterOptions: {
    tags: string[];
    formatTags: string[];
  };
};

export type ParsedDeckEntry = {
  quantity: number;
  cardName: string;
  normalizedName: string;
};

export type DecklistParseIssue = {
  line: string;
  reason: string;
};

export type DecklistParseResult = {
  entries: ParsedDeckEntry[];
  unresolvedLines: DecklistParseIssue[];
  warnings: string[];
};

export type ComboAnalyzeCardInput = {
  familyKey?: string | null;
  cardName: string;
  quantity: number;
  imageUrl?: string | null;
  typeLine?: string | null;
  text?: string | null;
  domains?: string[];
  energyCost?: number | null;
  power?: number | null;
  might?: number | null;
  hp?: number | null;
};

export type ComboAnalyzeRequest = {
  game: GameSlug;
  inputSource: DeckInputSource;
  deckText?: string;
  deckId?: number;
  scratchCards?: ComboAnalyzeCardInput[];
};

export type ComboAnalyzeDeckCard = {
  familyKey: string;
  cardName: string;
  quantity: number;
  cardId: string | null;
  imageUrl: string | null;
  typeLine: string | null;
  text: string | null;
  domains: string[];
  energyCost: number | null;
  power: number | null;
  might: number | null;
  hp: number | null;
};

export type ComboMatchBucket =
  | "exactMatches"
  | "nearMisses"
  | "synergySuggestions";

export type ComboAnalyzeResponse = {
  game: GameSlug;
  inputSource: DeckInputSource;
  deckCards: ComboAnalyzeDeckCard[];
  parseResult: DecklistParseResult | null;
  exactMatches: ComboResultSummary[];
  nearMisses: ComboResultSummary[];
  synergySuggestions: ComboResultSummary[];
};

export type ComboSyncCardRecord = {
  role: ComboPieceRole;
  quantity: number;
  cardName: string;
  familyKey?: string | null;
};

export type ComboSyncRecord = {
  game: GameSlug;
  source: string;
  externalId?: string | null;
  kind: string;
  name: string;
  slug?: string | null;
  summary?: string | null;
  resultText?: string | null;
  steps?: string[];
  prerequisites?: string[];
  tags?: string[];
  formatTags?: string[];
  isComplete?: boolean;
  popularity?: number | null;
  pieces: ComboSyncCardRecord[];
};

export type ComboSyncAdapter = {
  source: string;
  loadRecords: () => Promise<ComboSyncRecord[]>;
};

export type ComboSyncRunSummary = {
  startedAt: string;
  completedAt: string;
  adapters: Array<{
    source: string;
    recordsLoaded: number;
    recordsSynced: number;
    retired: number;
    errors: string[];
  }>;
};

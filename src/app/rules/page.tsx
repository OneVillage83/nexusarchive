// src/app/rules/page.tsx
import { rulesIndex } from "@/data/rules-index";

type RulesPageProps = {
  // In Next 16, searchParams is a Promise in server components
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Each entry is whatever shape was generated in src/data/rules-index.ts
// (id: string, section: string, text: string)
type RuleEntry = (typeof rulesIndex)[number];

// ---------- Search helpers ----------

// Normalize for regular matching
function normalizeSearchText(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

// Normalize for “ignore spaces inside words” matching
function normalizeTight(s: string): string {
  // remove all whitespace so "them selves" matches "themselves"
  return s.toLowerCase().replace(/\s+/g, "").trim();
}

// Very small stopword list so queries like
// "what is the golden rule" really key on "golden" + "rule"
const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "of",
  "to",
  "and",
  "or",
  "in",
  "on",
  "for",
  "with",
  "when",
  "what",
  "how",
  "why",
  "do",
  "does",
  "can",
  "i",
  "you",
  "we",
]);

// Turn raw query into the terms we actually score on
function getScoringTerms(query: string): string[] {
  const all = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const contentTerms = all.filter((t) => !STOPWORDS.has(t));
  return contentTerms.length > 0 ? contentTerms : all;
}

// Clean up the raw PDF text so it reads like normal paragraphs
function formatRuleText(raw: string): string {
  // Nuke all weird whitespace/newlines into single spaces.
  // We can always add fancier paragraph logic later if needed.
  return raw.replace(/\s+/g, " ").trim();
}

function searchRules(query: string): RuleEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const scoringTerms = getScoringTerms(q);
  if (scoringTerms.length === 0) return [];

  const tightTerms = scoringTerms.map((t) => t.replace(/\s+/g, ""));

  const scored: { rule: RuleEntry; score: number }[] = [];

  for (const rule of rulesIndex) {
    const haystackRaw = `${rule.section} ${rule.text}`;
    const hay = normalizeSearchText(haystackRaw);
    const hayTight = normalizeTight(hay);

    let matchedTerms = 0;

    for (let i = 0; i < scoringTerms.length; i++) {
      const t = scoringTerms[i];
      const tTight = tightTerms[i];

      if (hay.includes(t) || hayTight.includes(tTight)) {
        matchedTerms += 1;
      }
    }

    if (matchedTerms > 0) {
      scored.push({ rule, score: matchedTerms });
    }
  }

  // --- Special-case: Golden Rule -> also surface rule 002 ---
  if (q.includes("golden") && q.includes("rule")) {
    const goldenRule = rulesIndex.find((r) => r.id === "002");
    if (goldenRule) {
      const existing = scored.find((s) => s.rule.id === goldenRule.id);
      if (existing) {
        existing.score += 5; // bump it up
      } else {
        scored.push({
          rule: goldenRule,
          score: scoringTerms.length + 5,
        });
      }
    }
  }
  // --- end special-case ---

  // Highest score first, top 8 results
  return scored
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.rule)
    .slice(0, 8);
}

// ---------- Page component ----------

export default async function RulesPage({ searchParams }: RulesPageProps) {
  // Unwrap the Promise from Next
  const sp = (await searchParams) ?? {};

  const rawQ = sp.q;

  const query =
    typeof rawQ === "string"
      ? rawQ.trim()
      : Array.isArray(rawQ)
      ? (rawQ[0] ?? "").trim()
      : "";

  const hasQuery = query.length > 0;
  const ruleMatches = hasQuery ? searchRules(query) : [];

  // External search helpers (Phase 1)
  const googleSearchUrl = hasQuery
    ? `https://www.google.com/search?q=${encodeURIComponent(
        `${query} Riftbound core rules`
      )}`
    : null;

  const siteSearchUrl = hasQuery
    ? `https://www.google.com/search?q=${encodeURIComponent(
        `${query} site:riftbound.leagueoflegends.com`
      )}`
    : null;

  return (
    <main className="py-0">
      <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-3xl flex-col items-center justify-center px-4 text-center">
        <h1 className="sr-only">
          Riftbound Game Rules search – NexusArchive.
        </h1>

        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/80">
          Riftbound • Game Rules
        </p>
        <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-semibold text-amber-50 drop-shadow-[0_0_18px_rgba(0,0,0,0.8)]">
          Ask a rules question.
        </h2>
        <p className="mt-3 max-w-xl text-sm sm:text-base text-amber-100/90">
          Type anything you&apos;d ask a judge – timing, layers, weird
          interactions – and we&apos;ll point you to the right Riftbound rules.
        </p>

        {/* Search bar */}
        <form method="GET" className="mt-7 w-full max-w-2xl">
          <div
            className="
              mx-auto flex w-full items-center rounded-full
              border border-white/40 bg-black/55 px-2 py-1
              shadow-[0_0_32px_rgba(0,0,0,0.8)]
            "
          >
            <input
              type="search"
              name="q"
              defaultValue={query}
              autoComplete="off"
              placeholder='Example: "Can I respond before a Pending chain item finalizes?"'
              className="
                flex-1 rounded-full bg-transparent px-4 py-2.5
                text-xs sm:text-sm text-amber-50 placeholder:text-amber-200/70
                outline-none
              "
            />
            <button
              type="submit"
              className="
                mr-1 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold
                bg-amber-400/95 text-slate-950
                shadow-[0_0_18px_rgba(0,0,0,0.7)]
                transition hover:bg-amber-300
              "
            >
              Search
            </button>
          </div>
        </form>

        <p className="mt-2 text-[11px] text-amber-100/80 tracking-wide">
          Powered by the official Riftbound Core Rules, Tournament Rules, and
          patch notes. More judge-style answers coming soon.
        </p>

        <div className="mt-8 w-full max-w-2xl">
          {hasQuery ? (
            <SearchResults
              query={query}
              ruleMatches={ruleMatches}
              googleSearchUrl={googleSearchUrl}
              siteSearchUrl={siteSearchUrl}
            />
          ) : (
            <QuickLinks />
          )}
        </div>
      </div>
    </main>
  );
}

// ---------- Results + quick links ----------

type SearchResultsProps = {
  query: string;
  ruleMatches: RuleEntry[];
  googleSearchUrl: string | null;
  siteSearchUrl: string | null;
};

function SearchResults({
  query,
  ruleMatches,
  googleSearchUrl,
  siteSearchUrl,
}: SearchResultsProps) {
  const hasMatches = ruleMatches.length > 0;

  return (
    <div className="space-y-4 rounded-2xl border border-white/35 bg-black/60 p-4 text-left text-amber-50 shadow-[0_0_26px_rgba(0,0,0,0.75)]">
      {/* Internal matches */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-amber-200">
          Potential matches from Core Rules
        </div>
        {hasMatches ? (
          <ul className="mt-2 space-y-2 text-sm">
            {ruleMatches.map((rule) => (
              <li
                key={rule.section}
                className="rounded-xl bg-black/55 px-3 py-2 text-xs"
              >
                <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-200/90">
                  {rule.section}
                </div>
                <div className="mt-1 text-[11px] text-amber-100/90 whitespace-pre-line">
                  {formatRuleText(rule.text)}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-amber-100/90">
            No quick matches in the rules index for &ldquo;{query}&rdquo; yet.
            Try fewer words, or check the full documents below.
          </p>
        )}
      </div>

      {/* External guidance */}
      <div className="pt-3 border-t border-white/15 space-y-2 text-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-amber-200">
          How to confirm this ruling right now
        </div>
        <ul className="space-y-1 text-xs">
          <li>
            <span className="font-semibold text-amber-200">1.</span>{" "}
            Check the official{" "}
            <a
              href="https://cmsassets.rgpub.io/sanity/files/dsfx7636/news_live/dbc96e31db9d0257b0791aafb6dbb0cd219d3efb.pdf"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-amber-100"
            >
              Core Rules PDF
            </a>
            .
          </li>
          <li>
            <span className="font-semibold text-amber-200">2.</span>{" "}
            If it&apos;s tournament-related, open the{" "}
            <a
              href="https://riftbound.leagueoflegends.com/en-us/news/organizedplay/riftbound-tournament-rules/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-amber-100"
            >
              Tournament Rules
            </a>
            .
          </li>
          <li>
            <span className="font-semibold text-amber-200">3.</span>{" "}
            For recent clarifications and errata, use the{" "}
            <a
              href="https://riftbound.leagueoflegends.com/en-us/news/rules-and-releases/riftbound-core-rules-patch-notes/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-amber-100"
            >
              Core Rules Patch Notes
            </a>
            .
          </li>
        </ul>
      </div>

      {(googleSearchUrl || siteSearchUrl) && (
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          {siteSearchUrl && (
            <a
              href={siteSearchUrl}
              target="_blank"
              rel="noreferrer"
              className="
                inline-flex items-center justify-center rounded-full
                border border-white/30 bg-black/60 px-3 py-2 text-xs
                hover:bg-amber-400/90 hover:text-slate-950
                hover:shadow-[0_0_22px_rgba(246,191,38,0.8)]
                transition
              "
            >
              Search official Riftbound site for &ldquo;{query}&rdquo;
            </a>
          )}
          {googleSearchUrl && (
            <a
              href={googleSearchUrl}
              target="_blank"
              rel="noreferrer"
              className="
                inline-flex items-center justify-center rounded-full
                border border-white/30 bg-black/60 px-3 py-2 text-xs
                hover:bg-amber-400/90 hover:text-slate-950
                hover:shadow-[0_0_22px_rgba(246,191,38,0.8)]
                transition
              "
            >
              Google &ldquo;{query}&rdquo; + core rules
            </a>
          )}
        </div>
      )}

      <p className="mt-2 text-[11px] text-amber-100/80">
        Coming soon: NexusArchive will read the full rules docs and give
        judge-style answers with exact rule numbers.
      </p>
    </div>
  );
}

function QuickLinks() {
  return (
    <div className="space-y-4 rounded-2xl border border-white/35 bg-black/60 p-4 text-left text-amber-50 shadow-[0_0_26px_rgba(0,0,0,0.75)]">
      <h3 className="text-sm font-semibold text-amber-200">
        Official Rules Documents
      </h3>
      <p className="text-xs text-amber-100/90">
        Start typing a question above, or jump straight into the official docs:
      </p>

      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <RulesDocLink
          title="Core Rules (v1.1 PDF)"
          href="https://cmsassets.rgpub.io/sanity/files/dsfx7636/news_live/dbc96e31db9d0257b0791aafb6dbb0cd219d3efb.pdf"
          description="Full rules engine: deckbuilding, timing, layers, zones, etc."
        />
        <RulesDocLink
          title="Core Rules Patch Notes"
          href="https://riftbound.leagueoflegends.com/en-us/news/rules-and-releases/riftbound-core-rules-patch-notes/"
          description="Latest clarifications, updated definitions, and Silver Rules."
        />
        <RulesDocLink
          title="Tournament Rules"
          href="https://riftbound.leagueoflegends.com/en-us/news/organizedplay/riftbound-tournament-rules/"
          description="Event procedures, responsibilities, and policy framework."
        />
        <RulesDocLink
          title="Origins FAQ (archived)"
          href="https://riftbound.leagueoflegends.com/en-us/news/rules-and-releases/riftbound-origins-faq/"
          description="Older FAQs; some rulings folded into rules & errata."
        />
      </div>

      <p className="mt-2 text-[11px] text-amber-100/80">
        Note: All rules content comes from official Riot Games documents and may
        be updated with each new set or rules patch.
      </p>
    </div>
  );
}

type RulesDocLinkProps = {
  title: string;
  href: string;
  description: string;
};

function RulesDocLink({ title, href, description }: RulesDocLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="
        flex flex-col rounded-xl border border-white/25
        bg-black/70 px-3 py-3 text-xs
        hover:bg-amber-400/90 hover:text-slate-950
        hover:shadow-[0_0_22px_rgba(246,191,38,0.8)]
        transition
      "
    >
      <span className="text-[11px] font-semibold uppercase tracking-wide">
        {title}
      </span>
      <span className="mt-1 text-[11px] opacity-90">{description}</span>
    </a>
  );
}

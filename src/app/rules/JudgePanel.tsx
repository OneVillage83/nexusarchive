"use client";

import { useEffect, useState } from "react";

type JudgeRuleCitation = {
  id: string;
  section: string;
};

type JudgeAnswer = {
  answer: string;
  verdict?: string;
  ruleCitations: JudgeRuleCitation[];
  conceptCitations: { id: string; name: string }[];
  glossaryCitations: { id: string; term: string }[];
  context?: {
    rules?: {
      rule: {
        id: string;
        section: string;
        text: string;
      };
      score?: number;
      keywordIds?: string[];
      conceptIds?: string[];
    }[];
  };
};

type JudgePanelProps = {
  question: string;
};

export default function JudgePanel({ question }: JudgePanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<JudgeAnswer | null>(null);
  const [showRules, setShowRules] = useState(false);

  const trimmedQuestion = question.trim();

  // Auto-run the judge whenever the question changes and is non-empty
  useEffect(() => {
    if (!trimmedQuestion) {
      setData(null);
      setError(null);
      setLoading(false);
      setShowRules(false);
      return;
    }

    let cancelled = false;

    async function runJudge() {
      try {
        setLoading(true);
        setError(null);
        setData(null);
        setShowRules(false);

        const res = await fetch("/api/judge", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question: trimmedQuestion }),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as any;
          throw new Error(body?.error || `Judge request failed (${res.status})`);
        }

        const payload = (await res.json()) as JudgeAnswer;
        if (!cancelled) {
          setData(payload);
        }
      } catch (err: any) {
        console.error("Judge error:", err);
        if (!cancelled) {
          setError(
            "Our arcane Nexus Judge just tripped over a rune stone and lost connection to the League Librarium. Use the official rules links below to double-check this ruling."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    runJudge();

    return () => {
      cancelled = true;
    };
  }, [trimmedQuestion]);

  if (!trimmedQuestion) return null;

  const ruleContext = data?.context?.rules ?? [];

  return (
    <div className="mb-4 rounded-2xl border border-amber-300/40 bg-black/80 px-3 py-3 text-xs text-amber-50 shadow-[0_0_24px_rgba(0,0,0,0.7)]">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-200">
            Riftbound LM Judge (experimental)
          </div>
          <p className="mt-0.5 text-[11px] text-amber-100/85">
            The AI judge interprets the official rules below. It cites sections,
            but isn&apos;t an official tournament ruling.
          </p>
        </div>
        <div className="mt-1 text-right sm:mt-0">
          <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] text-amber-200">
            {loading ? "Consulting the Nexus…" : "Using cached Nexus rulings when possible"}
          </span>
        </div>
      </div>

      {/* Whimsical error */}
      {error && (
        <p className="mt-2 rounded-xl bg-amber-800/20 p-2 text-[11px] text-amber-200">
          {error}
        </p>
      )}

      {/* Loading hint */}
      {!data && !error && loading && (
        <p className="mt-2 text-[11px] text-amber-100/80">
          Consulting the Nexus Judge…
        </p>
      )}

      {/* Judge answer only */}
      {data && (
        <div className="mt-3 space-y-3">
          <div className="rounded-xl bg-black/80 p-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-200/95">
              Judge answer
            </div>
            <p className="mt-1 whitespace-pre-wrap text-[11px] leading-snug text-amber-100/95">
              {data.answer}
            </p>
          </div>

          {/* Toggle to reveal full cited rules */}
          {ruleContext.length > 0 && (
            <div className="mt-1">
              <button
                type="button"
                onClick={() => setShowRules((v) => !v)}
                className="
                  inline-flex items-center gap-1 rounded-full
                  border border-amber-300/60 bg-black/70 px-3 py-1.5
                  text-[11px] font-semibold text-amber-100
                  hover:bg-amber-400/90 hover:text-slate-950
                  hover:shadow-[0_0_18px_rgba(246,191,38,0.8)]
                  transition
                "
              >
                {showRules ? "Hide full rules text" : "Show the full rules the judge used"}
                <span className="text-[9px]">
                  {showRules ? "▲" : "▼"}
                </span>
              </button>

              {showRules && (
                <div className="mt-2 rounded-xl bg-black/80 p-2 space-y-2 max-h-[420px] overflow-y-auto">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/95">
                    Exact rules consulted by the judge
                  </div>
                  <p className="mt-1 text-[11px] text-amber-100/80">
                    These are the specific rule sections the Nexus Judge pulled into
                    its reasoning. Use them as the authoritative text.
                  </p>
                  <div className="mt-2 space-y-2">
                    {ruleContext.map((h) => (
                      <div
                        key={h.rule.id}
                        className="rounded-lg border border-amber-300/25 bg-black/80 p-2"
                      >
                        <div className="text-[11px] font-semibold text-amber-100">
                          {h.rule.id} – {h.rule.section}
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-[11px] leading-snug text-amber-50/95">
                          {h.rule.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="mt-1 text-[10px] text-amber-100/70">
            This AI judge is unofficial. For tournaments, always defer to the
            official rules documents and a human head judge.
          </p>
        </div>
      )}
    </div>
  );
}

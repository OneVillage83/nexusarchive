import Link from "next/link";

import { buildGamePath, getGameBySlug, type GameSlug } from "@/lib/games";
import type { ScannerIntent } from "@/lib/scanner/types";

const PANEL =
  "rounded-3xl border border-white/25 bg-black/75 p-5 shadow-[0_0_45px_rgba(0,0,0,0.95)] sm:p-7";

export function ScannerModePicker({
  game,
  intent,
}: {
  game: GameSlug;
  intent: ScannerIntent;
}) {
  const config = getGameBySlug(game);

  return (
    <main className="safe-mobile-bottom py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:space-y-8">
        <section className={PANEL}>
          <div
            className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-950"
            style={{ backgroundColor: config?.accentColor ?? "#facc15" }}
          >
            {config?.shortName ?? "Scanner"}
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-amber-50 sm:text-4xl">
            Card Scanner
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-amber-50/82">
            Camera-first scan flows for fast identification and stricter raw-card
            pregrading. The archive keeps the original photo, builds normalized
            crops, and pushes confirmed matches straight into finance.
          </p>

          {intent === "collection" ? (
            <div className="mt-5 rounded-2xl border border-sky-200/35 bg-sky-950/55 px-4 py-3 text-xs text-sky-50/85">
              Scan-to-collection mode is active. Quick Scan is the right lane when
              you want results to lead directly into collection add flows.
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <ModeCard
            href={buildGamePath(
              game,
              intent === "collection" ? "scan/quick?intent=collection" : "scan/quick",
            )}
            eyebrow="Quick Scan"
            title="Identify one photo or a whole spread"
            description="Use this for binder pages, table shots, or one-off uploads when you mainly want canonical card matches and finance links."
            bullets={[
              "One image per scan",
              "Multiple cards allowed",
              "Top candidate matches",
              "Best path into collection intake",
            ]}
          />
          <ModeCard
            href={buildGamePath(game, "scan/grade")}
            eyebrow="Grade Scan"
            title="Capture front and back for Nexus AI Pre-Grade"
            description="Use this when you are evaluating one raw card for grading-style condition signals, quality gating, and grade-or-sell context."
            bullets={[
              "Front and back required",
              "One raw card only",
              "Quality gate before pregrade",
              "Subscores plus recommendation",
            ]}
          />
        </section>
      </div>
    </main>
  );
}

function ModeCard({
  href,
  eyebrow,
  title,
  description,
  bullets,
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="rounded-3xl border border-white/25 bg-black/75 p-5 shadow-[0_0_45px_rgba(0,0,0,0.95)] transition hover:border-amber-200/35 hover:bg-black/80 sm:p-7"
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200/80">
        {eyebrow}
      </div>
      <h2 className="mt-3 text-2xl font-semibold text-amber-50">{title}</h2>
      <p className="mt-3 text-sm text-amber-50/78">{description}</p>

      <ul className="mt-5 space-y-2 text-xs text-amber-100/78">
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>

      <div className="mt-6 text-sm font-medium text-amber-200">
        Open mode →
      </div>
    </Link>
  );
}

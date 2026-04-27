"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import type { FinanceProductDetail } from "@/lib/finance/query";
import type { GameSlug } from "@/lib/games";

type FinanceProductHydratorProps = {
  game: GameSlug;
  financeProductId: string;
  snapshotState: FinanceProductDetail["snapshotState"];
  canAutoRefresh: boolean;
  refreshInFlight: boolean;
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readFinanceDetail(game: GameSlug, financeProductId: string) {
  const response = await fetch(
    `/api/finance/product/${encodeURIComponent(financeProductId)}?game=${game}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return (await response.json()) as FinanceProductDetail;
}

export function FinanceProductHydrator({
  game,
  financeProductId,
  snapshotState,
  canAutoRefresh,
  refreshInFlight,
}: FinanceProductHydratorProps) {
  const router = useRouter();
  const lastAttemptKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (snapshotState === "fresh" || snapshotState === "preview-readonly") {
      return;
    }

    if (!canAutoRefresh && !refreshInFlight) {
      return;
    }

    const attemptKey = `${game}:${financeProductId}:${snapshotState}:${refreshInFlight}`;
    if (lastAttemptKeyRef.current === attemptKey) {
      return;
    }

    lastAttemptKeyRef.current = attemptKey;
    let cancelled = false;

    async function hydrate() {
      try {
        let detail: FinanceProductDetail | null = null;

        if (!refreshInFlight && canAutoRefresh) {
          const response = await fetch(
            `/api/finance/product/${encodeURIComponent(financeProductId)}/refresh?game=${game}`,
            {
              method: "POST",
              cache: "no-store",
            },
          );

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          detail = (await response.json()) as FinanceProductDetail;
        }

        if (cancelled) {
          return;
        }

        if (detail?.snapshotState === "fresh" || detail?.snapshotState === "preview-readonly") {
          router.refresh();
          return;
        }

        for (let attempt = 0; attempt < 6; attempt += 1) {
          await wait(1500);
          if (cancelled) {
            return;
          }

          const next = await readFinanceDetail(game, financeProductId);
          if (
            next.snapshotState === "fresh" ||
            next.snapshotState === "preview-readonly"
          ) {
            router.refresh();
            return;
          }
        }
      } catch (error) {
        console.error("Finance product hydration failed:", error);
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [canAutoRefresh, financeProductId, game, refreshInFlight, router, snapshotState]);

  return null;
}

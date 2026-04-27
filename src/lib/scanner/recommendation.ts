import type { FinanceProductDetail, FinanceRouteEstimate } from "@/lib/finance/query";

import { getScannerQualityDecision } from "./quality";
import type {
  ScannerPregradeView,
  ScannerRecommendationView,
} from "./types";

function getBestRawRoute(
  routes: FinanceRouteEstimate[],
): FinanceRouteEstimate | null {
  return (
    [...routes]
      .filter((route) => route.key !== "grade-first" && route.netValue != null)
      .sort((left, right) => (right.netValue ?? 0) - (left.netValue ?? 0))[0] ??
    null
  );
}

function getGradeFirstRoute(
  routes: FinanceRouteEstimate[],
): FinanceRouteEstimate | null {
  return routes.find((route) => route.key === "grade-first") ?? null;
}

export function buildScannerRecommendation(args: {
  qualityScore: number | null | undefined;
  pregrade: ScannerPregradeView | null;
  financeDetail: FinanceProductDetail | null;
}): ScannerRecommendationView | null {
  const decision = getScannerQualityDecision(args.qualityScore);
  const rawBestRoute = args.financeDetail
    ? getBestRawRoute(args.financeDetail.routeEstimates)
    : null;
  const gradeFirstRoute = args.financeDetail
    ? getGradeFirstRoute(args.financeDetail.routeEstimates)
    : null;
  const pregradeScore = args.pregrade?.nexusPregradeScore ?? null;
  const pregradeConfidence = args.pregrade?.confidence ?? null;

  if (decision === "reject" || decision === "id-only") {
    return {
      key: "recapture-needed",
      title: "Recapture needed",
      body:
        decision === "reject"
          ? "The capture quality is too weak for a responsible grade estimate. Take a cleaner raw-card photo before trusting anything expensive."
          : "This scan is usable for card identification, but not for a grading-style call yet. A cleaner front/back capture gives the pregrader a fairer shot.",
      gradeFirstNetValue: gradeFirstRoute?.netValue ?? null,
      rawBestNetValue: rawBestRoute?.netValue ?? null,
      rawBestLabel: rawBestRoute?.label ?? null,
    };
  }

  if (
    pregradeScore != null &&
    pregradeConfidence != null &&
    pregradeScore >= 9.2 &&
    pregradeConfidence >= 0.75 &&
    (gradeFirstRoute?.netValue ?? Number.NEGATIVE_INFINITY) >
      (rawBestRoute?.netValue ?? Number.NEGATIVE_INFINITY)
  ) {
    return {
      key: "grade-candidate",
      title: "Grade candidate",
      body:
        "The capture cleared the quality gate, the Nexus AI Pre-Grade is strong, and the current finance math says the grade-first route beats the best raw exit.",
      gradeFirstNetValue: gradeFirstRoute?.netValue ?? null,
      rawBestNetValue: rawBestRoute?.netValue ?? null,
      rawBestLabel: rawBestRoute?.label ?? null,
    };
  }

  if (pregradeScore != null && pregradeScore >= 8.0) {
    return {
      key: "sell-raw-or-compare",
      title: "Sell raw or compare grade EV",
      body:
        "This copy looks respectable, but not automatic. Compare the raw routes against grading costs before sending it off just to feed a label habit.",
      gradeFirstNetValue: gradeFirstRoute?.netValue ?? null,
      rawBestNetValue: rawBestRoute?.netValue ?? null,
      rawBestLabel: rawBestRoute?.label ?? null,
    };
  }

  return {
    key: "not-worth-grading",
    title: "Likely not worth grading",
    body:
      "The current pre-grade signal does not support a premium submission path. Treat it like a raw finance decision unless better photos change the read.",
    gradeFirstNetValue: gradeFirstRoute?.netValue ?? null,
    rawBestNetValue: rawBestRoute?.netValue ?? null,
    rawBestLabel: rawBestRoute?.label ?? null,
  };
}

// src/lib/rules/judge-context.ts

import { rulesIndex, type RuleEntry } from "../../data/rules-index";
import { ruleKeywords } from "../../data/rule-keywords";
import { rulesGlossary } from "../../data/rules-glossary";
import {
  RULES_CONCEPTS,
  type RulesConcept,
} from "../../data/rules-concepts";

// ------------------
// Types
// ------------------

export type JudgeRuleHit = {
  rule: RuleEntry;
  score: number;
  keywordIds: string[];
  conceptIds: string[];
};

export type JudgeConceptHit = {
  concept: RulesConcept;
  score: number;
  // Rule IDs from this concept that are present in the final rule hits
  supportingRuleIds: string[];
};

export type JudgeGlossaryHit = {
  entry: (typeof rulesGlossary)[number];
  score: number;
  matchedAliases: string[];
};

export type JudgeContext = {
  query: string;
  rules: JudgeRuleHit[];
  concepts: JudgeConceptHit[];
  glossary: JudgeGlossaryHit[];
};

// Optional knobs so you can adjust later without changing call sites
export type JudgeContextOptions = {
  maxRules?: number;
  maxConcepts?: number;
  maxGlossary?: number;
};

// ------------------
// Normalization helpers
// ------------------

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(str: string): string[] {
  return normalize(str)
    .split(" ")
    .filter((t) => t.length > 2);
}

// ------------------
// Precomputed lookup tables
// ------------------

// ruleId -> concepts that contain it
const RULE_ID_TO_CONCEPT_IDS: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {};
  for (const concept of RULES_CONCEPTS) {
    for (const rid of concept.ruleIds) {
      if (!map[rid]) map[rid] = [];
      map[rid].push(concept.id);
    }
  }
  return map;
})();

// ruleId -> RuleEntry (from rulesIndex)
const RULE_ID_TO_ENTRY: Record<string, RuleEntry> = (() => {
  const map: Record<string, RuleEntry> = {};
  for (const r of rulesIndex) {
    map[r.id] = r;
  }
  return map;
})();

// Pre-normalize rule text + section for text scoring
const RULE_ID_TO_NORMALIZED_TEXT: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const r of rulesIndex) {
    const combined = `${r.section}\n${r.text}`;
    map[r.id] = normalize(combined);
  }
  return map;
})();

// ------------------
// Scoring helpers
// ------------------

type RuleScoreAccumulator = {
  score: number;
  keywordIds: Set<string>;
};

type GlossaryScoreAccumulator = {
  score: number;
  matchedAliases: Set<string>;
};

const KEYWORD_HIT_SCORE = 10;
const KEYWORD_PARTIAL_SCORE = 5;
const CONCEPT_FROM_KEYWORD_FACTOR = 0.7;
const GLOSSARY_ALIAS_SCORE = 8;
const GLOSSARY_TERM_BONUS = 4;
const GLOSSARY_FROM_RULE_FACTOR = 0.5;
const TEXT_TOKEN_SCORE = 2;
const TEXT_SECTION_BONUS = 1;

// keyword / glossary matching is simple “query contains phrase” for now
function queryContainsPhrase(queryNorm: string, phrase: string): boolean {
  const p = normalize(phrase);
  if (!p) return false;
  return queryNorm.includes(p);
}

// ------------------
// Main builder
// ------------------

export function buildJudgeContext(
  query: string,
  options: JudgeContextOptions = {}
): JudgeContext {
  const { maxRules = 40, maxConcepts = 15, maxGlossary = 20 } = options;

  const queryNorm = normalize(query);
  const queryTokens = tokenize(query);

  // 1) Keyword → rule scoring
  const ruleScores: Record<string, RuleScoreAccumulator> = {};

  for (const kw of ruleKeywords) {
    let matched = false;
    for (const term of kw.terms) {
      if (!term) continue;
      const termNorm = normalize(term);
      if (!termNorm) continue;

      if (queryNorm.includes(termNorm)) {
        matched = true;
        break;
      }
    }

    if (!matched) continue;

    // Stronger score if exact-ish phrase appears,
    // weaker if only partial.
    const baseScore = KEYWORD_HIT_SCORE;

    for (const rid of kw.ruleIds) {
      if (!ruleScores[rid]) {
        ruleScores[rid] = { score: 0, keywordIds: new Set<string>() };
      }
      ruleScores[rid].score += baseScore;
      ruleScores[rid].keywordIds.add(kw.id);
    }
  }

  // 2) Text match scoring for every rule
  for (const rule of rulesIndex) {
    const rid = rule.id;
    const normalizedRuleText = RULE_ID_TO_NORMALIZED_TEXT[rid];
    if (!normalizedRuleText) continue;

    let localScore = 0;
    for (const tok of queryTokens) {
      if (!tok) continue;
      if (normalizedRuleText.includes(tok)) {
        localScore += TEXT_TOKEN_SCORE;
      }
    }

    if (localScore > 0) {
      if (!ruleScores[rid]) {
        ruleScores[rid] = { score: 0, keywordIds: new Set<string>() };
      }
      // Slight bias towards matches in section titles
      const normalizedSection = normalize(rule.section);
      let sectionBonus = 0;
      for (const tok of queryTokens) {
        if (normalizedSection.includes(tok)) {
          sectionBonus += TEXT_SECTION_BONUS;
        }
      }
      ruleScores[rid].score += localScore + sectionBonus;
    }
  }

  // 3) Concept scoring derived from rule scores
  const conceptScores: Record<string, number> = {};
  for (const [rid, rs] of Object.entries(ruleScores)) {
    const concepts = RULE_ID_TO_CONCEPT_IDS[rid];
    if (!concepts) continue;
    for (const cid of concepts) {
      if (!conceptScores[cid]) conceptScores[cid] = 0;
      conceptScores[cid] += rs.score * CONCEPT_FROM_KEYWORD_FACTOR;
    }
  }

  // 4) Glossary scoring: direct query matches + linkage to rules
  const glossaryScores: Record<string, GlossaryScoreAccumulator> = {};

  for (const entry of rulesGlossary) {
    const entryId = entry.id;
    let accumulator: GlossaryScoreAccumulator | undefined;

    // direct term & aliases matching
    const aliases = [entry.term, ...(entry.aliases ?? [])];
    for (const alias of aliases) {
      const aliasNorm = normalize(alias);
      if (!aliasNorm) continue;

      if (queryNorm.includes(aliasNorm)) {
        if (!accumulator) {
          accumulator = {
            score: 0,
            matchedAliases: new Set<string>(),
          };
        }
        const base = aliasNorm === normalize(entry.term)
          ? GLOSSARY_ALIAS_SCORE + GLOSSARY_TERM_BONUS
          : GLOSSARY_ALIAS_SCORE;
        accumulator.score += base;
        accumulator.matchedAliases.add(alias);
      }
    }

    // linkage: if any of its related rules are already hot, boost glossary
    if (entry.relatedRules) {
      for (const rid of entry.relatedRules) {
        const rs = ruleScores[rid];
        if (!rs) continue;
        if (!accumulator) {
          accumulator = {
            score: 0,
            matchedAliases: new Set<string>(),
          };
        }
        accumulator.score += rs.score * GLOSSARY_FROM_RULE_FACTOR;
      }
    }

    if (accumulator && accumulator.score > 0) {
      glossaryScores[entryId] = accumulator;
    }
  }

  // ------------------
  // Build final sorted hits
  // ------------------

  // Rules
  const ruleHits: JudgeRuleHit[] = Object.entries(ruleScores)
    .map(([rid, acc]) => {
      const rule = RULE_ID_TO_ENTRY[rid];
      if (!rule) {
        return null;
      }
      const conceptIds = RULE_ID_TO_CONCEPT_IDS[rid] ?? [];
      return {
        rule,
        score: acc.score,
        keywordIds: Array.from(acc.keywordIds),
        conceptIds,
      } as JudgeRuleHit;
    })
    .filter((h): h is JudgeRuleHit => h !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxRules);

  const finalRuleIds = new Set(ruleHits.map((h) => h.rule.id));

  // Concepts
  const conceptHits: JudgeConceptHit[] = Object.entries(conceptScores)
    .map(([cid, score]) => {
      const concept = RULES_CONCEPTS.find((c) => c.id === cid);
      if (!concept) return null;
      const supportingRuleIds = concept.ruleIds.filter((rid) =>
        finalRuleIds.has(rid)
      );
      return {
        concept,
        score,
        supportingRuleIds,
      } as JudgeConceptHit;
    })
    .filter((h): h is JudgeConceptHit => h !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxConcepts);

  // Glossary
  const glossaryHits: JudgeGlossaryHit[] = Object.entries(glossaryScores)
    .map(([gid, acc]) => {
      const entry = rulesGlossary.find((g) => g.id === gid);
      if (!entry) return null;
      return {
        entry,
        score: acc.score,
        matchedAliases: Array.from(acc.matchedAliases),
      } as JudgeGlossaryHit;
    })
    .filter((h): h is JudgeGlossaryHit => h !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxGlossary);

  return {
    query,
    rules: ruleHits,
    concepts: conceptHits,
    glossary: glossaryHits,
  };
}

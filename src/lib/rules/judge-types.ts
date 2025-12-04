// src/lib/rules/judge-types.ts

import type {
  JudgeContext,
  JudgeRuleHit,
  JudgeConceptHit,
  JudgeGlossaryHit,
} from "./judge-context";

export type JudgeQuestion = {
  /** Raw user text question */
  question: string;
  /**
   * Optional: later you can add structured game state here,
   * like board layout, card text, etc.
   */
  gameStateJson?: unknown;
};

export type JudgeRuleCitation = {
  id: string;        // rule id, e.g. "103.1.b"
  section: string;   // human-readable section title
};

export type JudgeConceptCitation = {
  id: string;
  name: string;
};

export type JudgeGlossaryCitation = {
  id: string;
  term: string;
};

export type JudgeAnswer = {
  /** The final natural-language answer from the judge */
  answer: string;
  /** Short machine-readable verdict, if you want it later */
  verdict?: "legal" | "illegal" | "ambiguous" | "explanation" | "unknown";
  /** Rules explicitly cited in the answer */
  ruleCitations: JudgeRuleCitation[];
  /** High-level concepts that were relevant */
  conceptCitations: JudgeConceptCitation[];
  /** Glossary terms that were important */
  glossaryCitations: JudgeGlossaryCitation[];
  /**
   * For debugging / UI: the full context used to make the decision.
   * You probably won't send this to the LM, but it's very useful to
   * return from /api/judge for inspecting what happened.
   */
  context: JudgeContext;
};

/**
 * A lightweight, LM-ready view of the context.
 * This is what we actually serialize into the prompt,
 * not the full JudgeContext with scores and sets.
 */
export type JudgePromptContext = {
  rules: {
    id: string;
    section: string;
    text: string;
  }[];
  concepts: {
    id: string;
    name: string;
    description: string;
  }[];
  glossary: {
    id: string;
    term: string;
    definition: string;
  }[];
};

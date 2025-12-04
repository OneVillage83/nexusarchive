// src/lib/rules/judge-prompt.ts

import type { JudgeQuestion, JudgePromptContext } from "./judge-types";
import type { JudgeContext } from "./judge-context";

/**
 * Convert a full JudgeContext into a slimmed-down prompt context
 * that is cheap and safe to send to the LM.
 */
export function toPromptContext(ctx: JudgeContext): JudgePromptContext {
  return {
    rules: ctx.rules.map((hit) => ({
      id: hit.rule.id,
      section: hit.rule.section,
      text: hit.rule.text,
    })),
    concepts: ctx.concepts.map((hit) => ({
      id: hit.concept.id,
      name: hit.concept.name,
      description: hit.concept.description,
    })),
    glossary: ctx.glossary.map((hit) => ({
      id: hit.entry.id,
      term: hit.entry.term,
      definition: hit.entry.definition,
    })),
  };
}

/**
 * Build the messages array (for OpenAI-style chat APIs) that will be sent
 * to the LM judge. This is where we define the "system prompt" / instructions.
 *
 * You can tweak the instructions over time without changing the rest
 * of the pipeline.
 */
export function buildJudgeMessages(
  question: JudgeQuestion,
  ctx: JudgeContext
) {
  const promptCtx = toPromptContext(ctx);

  const systemContent = [
    "You are an official-style rules judge for the card game Riftbound.",
    "Your job is to interpret the rules strictly, using only the provided rules, concepts, and glossary.",
    "",
    "Guidelines:",
    "- Always prioritize the Golden Rule: card text overrides rules when they directly conflict.",
    "- Apply the Silver Rule when interpreting card wording and terminology.",
    "- When rules conflict, prefer more specific rules over more general ones.",
    "- If the rules are ambiguous or missing, say that clearly instead of inventing new rules.",
    "- Explain your reasoning step by step in plain language, but keep it concise.",
    "",
    "You will be given:",
    "- The player's question.",
    "- A set of relevant rules (with IDs and sections).",
    "- A set of high-level rules concepts.",
    "- A set of glossary entries that define important terms.",
    "",
    "You must:",
    "- Answer the player's question.",
    "- Refer to specific rule IDs when you rely on them.",
    "- Point out any edge cases, timing issues, or priority interactions that matter.",
    "- If necessary, mention that a human judge should make a final ruling in tournament play.",
  ].join("\n");

  // We serialize rules / concepts / glossary in a compact, readable way
  const contextContent = [
    "RIFTBOUND RULE CONTEXT BEGIN",
    "",
    "=== RULES ===",
  ]
    .concat(
      promptCtx.rules.map(
        (r) => `[#${r.id}] ${r.section}\n${r.text}\n`
      )
    )
    .concat([
      "",
      "=== CONCEPTS ===",
      ...promptCtx.concepts.map(
        (c) =>
          `[concept:${c.id}] ${c.name}\n${c.description}\n`
      ),
      "",
      "=== GLOSSARY ===",
      ...promptCtx.glossary.map(
        (g) =>
          `[term:${g.id}] ${g.term}\n${g.definition}\n`
      ),
      "",
      "RIFTBOUND RULE CONTEXT END",
    ])
    .join("\n");

  const userContent = [
    "Player question:",
    question.question.trim(),
    "",
    "Using ONLY the rules, concepts, and glossary above, answer this question as a Riftbound judge.",
    "Quote rule IDs like [#103.1.b] when you rely on them.",
  ].join("\n");

  return [
    {
      role: "system" as const,
      content: systemContent,
    },
    {
      role: "assistant" as const,
      content: contextContent,
    },
    {
      role: "user" as const,
      content: userContent,
    },
  ];
}

// src/app/api/judge/route.ts

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

import { buildJudgeContext } from "@/lib/rules/judge-context";
import { buildJudgeMessages } from "@/lib/rules/judge-prompt";
import type {
  JudgeAnswer,
  JudgeQuestion,
  JudgeRuleCitation,
  JudgeConceptCitation,
  JudgeGlossaryCitation,
} from "@/lib/rules/judge-types";

// --- Model selection: always use the cheapest reasonable model ---
// As of now, gpt-4o-mini is the low-cost text model on the OpenAI API.
const JUDGE_MODEL = "gpt-4o-mini";

// --- Simple in-memory cache for repeated questions ---
// Note: this is per-server-instance and non-persistent. For production,
// you can replace this with Redis / Upstash / Vercel KV, etc.
const judgeCache = new Map<string, JudgeAnswer>();

// Small helper to normalize questions for cache keys.
function normalizeQuestion(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const json = (await req.json()) as Partial<JudgeQuestion> | null;
    const question = json?.question?.toString().trim();

    if (!question) {
      return NextResponse.json(
        { error: "Missing 'question' in request body." },
        { status: 400 }
      );
    }

    const cacheKey = normalizeQuestion(question);

    // 1) Cache check
    const cached = judgeCache.get(cacheKey);
    if (cached) {
      return NextResponse.json<JudgeAnswer>({
        ...cached,
        // you could add a flag here like fromCache: true if you want
      });
    }

    // 2) Build retrieval context from your rules engine
    const ctx = buildJudgeContext(question, {
      maxRules: 40,
      maxConcepts: 15,
      maxGlossary: 20,
    });

    // 3) Build LM messages (system + context + user question)
    const messages = buildJudgeMessages({ question }, ctx);

    // 4) Call the cheapest chat model (gpt-4o-mini)
    const completion = await openai.chat.completions.create({
      model: JUDGE_MODEL,
      messages,
      temperature: 0.1, // low temp = more deterministic rulings
    });

    const answerText =
      completion.choices[0]?.message?.content?.toString().trim() ?? "";

    // 5) For now, we don't try to parse structured citations from the LM.
    // We just expose all rules / concepts / glossary used in the context.
    // (Later we can ask the LM to output JSON with explicit citations.)
    const ruleCitations: JudgeRuleCitation[] = ctx.rules.map((hit) => ({
      id: hit.rule.id,
      section: hit.rule.section,
    }));

    const conceptCitations: JudgeConceptCitation[] = ctx.concepts.map(
      (hit) => ({
        id: hit.concept.id,
        name: hit.concept.name,
      })
    );

    const glossaryCitations: JudgeGlossaryCitation[] = ctx.glossary.map(
      (hit) => ({
        id: hit.entry.id,
        term: hit.entry.term,
      })
    );

    const result: JudgeAnswer = {
      answer: answerText,
      verdict: "explanation", // we can get fancier later
      ruleCitations,
      conceptCitations,
      glossaryCitations,
      context: ctx,
    };

    // 6) Store in cache for identical future questions
    judgeCache.set(cacheKey, result);

    return NextResponse.json<JudgeAnswer>(result);
  } catch (err: any) {
    console.error("Error in /api/judge:", err);

    return NextResponse.json(
      {
        error: "Internal error while processing judge request.",
        details:
          process.env.NODE_ENV === "development" ? String(err?.message ?? err) : undefined,
      },
      { status: 500 }
    );
  }
}

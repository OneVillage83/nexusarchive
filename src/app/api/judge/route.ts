// src/app/api/judge/route.ts

import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

import { buildJudgeContext } from "@/lib/rules/judge-context";
import { buildJudgeMessages } from "@/lib/rules/judge-prompt";
import type {
  JudgeAnswer,
  JudgeQuestion,
  JudgeRuleCitation,
  JudgeConceptCitation,
  JudgeGlossaryCitation,
} from "@/lib/rules/judge-types";

export const runtime = "nodejs";

// Always use cheapest model
const JUDGE_MODEL = "gpt-4o-mini";

// ---------------------------
// In-memory cache (per instance)
// ---------------------------
const judgeCache = new Map<string, JudgeAnswer>();

function normalizeQuestion(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

function getOpenAI(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

// ---------------------------
// POST /api/judge
// ---------------------------
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as JudgeQuestion;
    const question = body?.question?.trim();

    if (!question) {
      return NextResponse.json(
        { error: "Missing question" },
        { status: 400 }
      );
    }

    const openai = getOpenAI();
    if (!openai) {
      return NextResponse.json(
        {
          error:
            "Nexus Judge is unavailable (missing API key). Please use the rulebook links below.",
        },
        { status: 503 }
      );
    }

    // Normalized cache key (shared by memory + KV)
    const cacheKey = `judge:${normalizeQuestion(question)}`;

    // 1) In-memory cache check (fastest)
    const memCached = judgeCache.get(cacheKey);
    if (memCached) {
      return NextResponse.json(memCached);
    }

    // 2) KV cache check (shared across Vercel instances)
    try {
      const kvCached = (await kv.get<JudgeAnswer>(cacheKey)) || null;
      if (kvCached) {
        // hydrate in-memory cache for this instance
        judgeCache.set(cacheKey, kvCached);
        return NextResponse.json(kvCached);
      }
    } catch (err) {
      // KV failure shouldn't break the judge
      console.error("KV get error in /api/judge:", err);
    }

    // 3) Build retrieval context (rules + glossary + concepts)
    const ctx = buildJudgeContext(question, {
      maxRules: 40,
      maxConcepts: 15,
      maxGlossary: 20,
    });

    // 4) Build LM prompt
    const messages = buildJudgeMessages({ question }, ctx);

    // 5) Call LM judge (gpt-4o-mini only)
    const completion = await openai.chat.completions.create({
      model: JUDGE_MODEL,
      messages,
      temperature: 0.1,
    });

    const answerText =
      completion.choices[0]?.message?.content?.toString().trim() ?? "";

    // 6) Prepare structured citations
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
      verdict: "explanation",
      ruleCitations,
      conceptCitations,
      glossaryCitations,
      context: ctx,
    };

    // 7) Cache result

    // 7a) In-memory (per instance)
    judgeCache.set(cacheKey, result);

    // 7b) KV (shared, 30-day TTL) – non-fatal if it fails
    try {
      await kv.set(cacheKey, result, {
        ex: 60 * 60 * 24 * 30, // 30 days
      });
    } catch (err) {
      console.error("KV set error in /api/judge:", err);
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Error in /api/judge:", err);

    return NextResponse.json(
      {
        error: "Internal error while processing judge request.",
        details:
          process.env.NODE_ENV === "development"
            ? String(err?.message ?? err)
            : undefined,
      },
      { status: 500 }
    );
  }
}

// src/app/api/judge/route.ts

import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { buildJudgeContext } from "@/lib/rules/judge-context";
import { buildJudgeMessages } from "@/lib/rules/judge-prompt";
import type {
  JudgeAnswer,
  JudgeQuestion,
} from "@/lib/rules/judge-types";

const JUDGE_MODEL = "gpt-4o-mini";

// Helper: only create the client when we actually get a request
function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // For build-time / missing env: don't throw a hard error at import.
    // We'll return a friendly 503 from the handler instead.
    return null;
  }
  return new OpenAI({ apiKey });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as JudgeQuestion;
  const question = body.question?.trim();

  if (!question) {
    return NextResponse.json(
      { error: "Missing question" },
      { status: 400 },
    );
  }

  const openai = getOpenAI();
  if (!openai) {
    return NextResponse.json(
      {
        error:
          "Nexus Judge is currently unavailable (missing API credentials). Please use the official rules documents instead.",
      },
      { status: 503 },
    );
  }

  // Build judge context from your rules index / keywords / concepts
  const context = buildJudgeContext(question);
  const messages = buildJudgeMessages(question, context);

  const completion = await openai.chat.completions.create({
    model: JUDGE_MODEL,
    messages,
    temperature: 0.2,
  });

  const answerText = completion.choices[0]?.message?.content ?? "";

  const response: JudgeAnswer = {
    answer: answerText,
    ruleCitations: context.rules.map((r) => ({
      id: r.rule.id,
      section: r.rule.section,
    })),
    conceptCitations: context.concepts.map((c) => ({
      id: c.id,
      name: c.name,
    })),
    glossaryCitations: context.glossary.map((g) => ({
      id: g.id,
      term: g.term,
    })),
    context,
  };

  return NextResponse.json(response);
}

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

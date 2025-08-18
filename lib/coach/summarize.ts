"use server";

import { CoachBriefLLMSchema, type CoachBriefLLM } from "@/types/coach.llm";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function summarizeCoachBrief(brief: {
  week: number;
  teamName: string;
  opponentName: string;
  risk: number;
  live: boolean;
  startSit: Array<{
    slot: string;
    current: { name: string; proj: number; riskAdjProj: number };
    alternative?: { name: string; proj: number; riskAdjProj: number } | null;
    delta: number;
  }>;
  mismatches: unknown[];
  streamers: unknown[];
}): Promise<CoachBriefLLM> {
  // Strict system guidance (grounding + style)
  const system = [
    "You are a fantasy football coach assistant.",
    "Only use facts from the provided JSON. Do NOT invent numbers, names, statuses, or injuries.",
    "Keep it concise and actionable. Prefer imperative voice.",
    "Prioritize start/sit deltas, positional mismatches, and streamer needs.",
    "Return only the structured result.",
  ].join("\n");

  // Minimal facts for the model
  const payload = {
    week: brief.week,
    teamName: brief.teamName,
    opponentName: brief.opponentName,
    risk: brief.risk,
    live: brief.live,
    startSit: brief.startSit.map((s) => ({
      slot: s.slot,
      current: {
        name: s.current.name,
        proj: s.current.proj,
        rAdj: s.current.riskAdjProj,
      },
      alternative: s.alternative
        ? {
            name: s.alternative.name,
            proj: s.alternative.proj,
            rAdj: s.alternative.riskAdjProj,
          }
        : null,
      delta: s.delta,
    })),
    mismatches: brief.mismatches,
    streamers: brief.streamers,
  };

  // Optional: runtime timeout
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 5000);

  try {
    const resp = await openai.responses.parse(
      {
        model: "gpt-4o-mini",
        temperature: 0,
        input: [
          { role: "system", content: system },
          {
            role: "system",
            content:
              "Return ONLY valid JSON matching the schema. No explanations.",
          },
          { role: "user", content: JSON.stringify(payload) },
        ],
        text: { format: zodTextFormat(CoachBriefLLMSchema, "coach_brief") },
      },
      { signal: ac.signal }
    );

    const parsed = resp.output_parsed;
    if (!parsed) throw new Error("Structured parse returned null");
    return parsed;
  } catch (err: unknown) {
    if ((err as Error)?.name === "AbortError") {
      throw new Error("LLM request timed out");
    }
    throw err;
  } finally {
    clearTimeout(t);
  }
}

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { mockRateTranscript, buildLeakDiagnostic } from "@/lib/rate-mock";
import { openaiRateTranscript } from "@/lib/openai-rate";

type RateResult = {
  scores: Record<string, number>;
  summary: string;
  actions: string[];
  practiceNext: string;
  weaknesses: string[];
  strengths: string[];
  suggestedRewrite: string;
  drill: string;
  primaryLeak: string | null;
  secondaryLeak: string | null;
  leakExplanation: string | null;
  leakEvidence: string[];
};

export async function POST(request: Request) {
  const { userId, res } = await requireAuth();
  if (res) return res;

  try {
    const body = await request.json();
    const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";
    const scenarioTitle =
      body.scenarioTitle != null ? String(body.scenarioTitle).trim() : null;
    const mode = body.mode === "openai" ? "openai" : "mock";

    if (!transcript) {
      return NextResponse.json(
        { error: "transcript is required" },
        { status: 400 }
      );
    }

    const session = await prisma.session.create({
      data: {
        userId: userId!,
        type: "rate",
        scenarioTitle: scenarioTitle || null,
      },
    });

    await prisma.message.create({
      data: {
        sessionId: session.id,
        role: "user",
        content: transcript,
      },
    });

    let result: RateResult;
    let usedFallback = false;

    if (mode === "openai") {
      const openaiResult = await openaiRateTranscript(transcript);
      if (openaiResult) {
        const leakDiagnostic = buildLeakDiagnostic(transcript);
        result = {
          scores: openaiResult.scores,
          summary: openaiResult.summary,
          actions: openaiResult.actions,
          practiceNext: openaiResult.drill,
          weaknesses: openaiResult.weaknesses,
          strengths: openaiResult.strengths,
          suggestedRewrite: openaiResult.suggestedRewrite,
          drill: openaiResult.drill,
          primaryLeak: leakDiagnostic.primaryLeak,
          secondaryLeak: leakDiagnostic.secondaryLeak,
          leakExplanation: leakDiagnostic.leakExplanation,
          leakEvidence: leakDiagnostic.leakEvidence,
        };
      } else {
        usedFallback = true;
        result = mockRateTranscript(transcript);
      }
    } else {
      result = mockRateTranscript(transcript);
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId: userId!,
        sessionId: session.id,
        scores: JSON.stringify(result.scores),
        summary: result.summary,
        actions: JSON.stringify(result.actions),
        practiceNext: result.practiceNext,
        weaknesses:
          result.weaknesses.length > 0 ? JSON.stringify(result.weaknesses) : null,
        strengths:
          result.strengths.length > 0 ? JSON.stringify(result.strengths) : null,
        suggestedRewrite: result.suggestedRewrite ?? null,
        drill: result.drill ?? null,
        primaryLeak: result.primaryLeak ?? null,
        secondaryLeak: result.secondaryLeak ?? null,
        leakExplanation: result.leakExplanation ?? null,
        leakEvidence:
          result.leakEvidence.length > 0 ? JSON.stringify(result.leakEvidence) : null,
      },
    });

    return NextResponse.json({
      session: {
        id: session.id,
        type: session.type,
        scenarioTitle: session.scenarioTitle,
        createdAt: session.createdAt,
      },
      feedback: {
        id: feedback.id,
        scores: result.scores,
        summary: result.summary,
        actions: result.actions,
        practiceNext: result.practiceNext,
        weaknesses: result.weaknesses,
        strengths: result.strengths,
        suggestedRewrite: result.suggestedRewrite,
        drill: result.drill,
        primaryLeak: result.primaryLeak,
        secondaryLeak: result.secondaryLeak,
        leakExplanation: result.leakExplanation,
        leakEvidence: result.leakEvidence,
      },
      ...(usedFallback && { usedFallback: true }),
    });
  } catch (e) {
    console.error("Rate error:", e);
    return NextResponse.json(
      { error: "Failed to rate conversation" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const PHASES = ["opening", "discovery", "pitch", "objection", "close"];

function overallScoreFromScores(scores: unknown): number {
  if (!scores || typeof scores !== "object") return 0;
  const o = scores as Record<string, unknown>;
  let sum = 0;
  let n = 0;
  for (const k of PHASES) {
    const v = o[k];
    if (typeof v === "number" && !Number.isNaN(v)) {
      sum += v;
      n++;
    }
  }
  return n === 0 ? 0 : Math.round(sum / n);
}

export async function GET() {
  const { userId, res } = await requireAuth();
  if (res) return res;

  // Order by most recent first; lastFiveSessions = first 5 = 5 most recent rated sessions
  const feedbacks = await prisma.feedback.findMany({
    where: { userId: userId! },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      session: {
        select: {
          id: true,
          type: true,
          scenarioTitle: true,
          createdAt: true,
        },
      },
    },
  });

  const overallScores: number[] = [];
  const weaknessCounts: Record<string, number> = {};
  const primaryLeakCounts: Record<string, number> = {};
  const secondaryLeakCounts: Record<string, number> = {};
  const lastFive: { sessionId: string; type: string; scenarioTitle: string | null; createdAt: string; overallScore: number }[] = [];

  for (let i = 0; i < feedbacks.length; i++) {
    const f = feedbacks[i];
    let scores: unknown = null;
    try {
      scores = typeof f.scores === "string" ? JSON.parse(f.scores) : f.scores;
    } catch {
      // ignore
    }
    const overall = overallScoreFromScores(scores);
    overallScores.push(overall);

    if (i < 5) {
      lastFive.push({
        sessionId: f.sessionId,
        type: f.session.type,
        scenarioTitle: f.session.scenarioTitle,
        createdAt: f.session.createdAt instanceof Date ? f.session.createdAt.toISOString() : String(f.session.createdAt),
        overallScore: overall,
      });
    }

    let weaknesses: string[] = [];
    try {
      weaknesses = f.weaknesses
        ? (typeof f.weaknesses === "string" ? JSON.parse(f.weaknesses) : f.weaknesses)
        : [];
    } catch {
      // ignore
    }
    for (const w of weaknesses) {
      const key = String(w).trim();
      if (key) weaknessCounts[key] = (weaknessCounts[key] ?? 0) + 1;
    }

    if (f.primaryLeak?.trim()) {
      const key = f.primaryLeak.trim();
      primaryLeakCounts[key] = (primaryLeakCounts[key] ?? 0) + 1;
    }
    if (f.secondaryLeak?.trim()) {
      const key = f.secondaryLeak.trim();
      secondaryLeakCounts[key] = (secondaryLeakCounts[key] ?? 0) + 1;
    }
  }

  const topPrimaryLeaks = Object.entries(primaryLeakCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([leak, count]) => ({ leak, count }));

  const topSecondaryLeaks = Object.entries(secondaryLeakCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([leak, count]) => ({ leak, count }));

  const topWeaknessesWithCount = Object.entries(weaknessCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([weakness, count]) => ({ weakness, count }));

  const topWeaknesses: string[] = topWeaknessesWithCount.map((item) => item.weakness);

  const averageOverallScore =
    overallScores.length === 0
      ? 0
      : Math.round(
          overallScores.reduce((a, b) => a + b, 0) / overallScores.length
        );

  const feedbackPayloads = feedbacks.map((f) => {
    let scores: unknown = null;
    let actions: string[] = [];
    let weaknesses: string[] = [];
    try {
      scores = typeof f.scores === "string" ? JSON.parse(f.scores) : f.scores;
    } catch {
      // ignore
    }
    try {
      actions = f.actions ? (typeof f.actions === "string" ? JSON.parse(f.actions) : f.actions) : [];
    } catch {
      // ignore
    }
    try {
      weaknesses = f.weaknesses ? (typeof f.weaknesses === "string" ? JSON.parse(f.weaknesses) : f.weaknesses) : [];
    } catch {
      // ignore
    }
    return {
      id: f.id,
      sessionId: f.sessionId,
      scores,
      summary: f.summary,
      actions,
      practiceNext: f.practiceNext,
      weaknesses,
      createdAt: f.createdAt instanceof Date ? f.createdAt.toISOString() : String(f.createdAt),
    };
  });

  return NextResponse.json({
    feedbacks: feedbackPayloads,
    topWeaknesses,
    topWeaknessesWithCount,
    topPrimaryLeaks,
    topSecondaryLeaks,
    averageOverallScore,
    lastFiveSessions: lastFive,
  });
}

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, res } = await requireAuth();
  if (res) return res;

  const { id } = await params;
  const session = await prisma.session.findFirst({
    where: { id, userId: userId! },
  });
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const phase = body.phase !== undefined ? String(body.phase).trim() || null : undefined;

    if (phase === undefined) {
      return NextResponse.json({
        session: {
          id: session.id,
          type: session.type,
          scenarioId: session.scenarioId,
          scenarioTitle: session.scenarioTitle,
          phase: session.phase,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        },
      });
    }

    const updated = await prisma.session.update({
      where: { id },
      data: { phase },
    });

    return NextResponse.json({
      session: {
        id: updated.id,
        type: updated.type,
        scenarioId: updated.scenarioId,
        scenarioTitle: updated.scenarioTitle,
        phase: updated.phase,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (e) {
    console.error("Session update error:", e);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, res } = await requireAuth();
  if (res) return res;

  const { id } = await params;
  const session = await prisma.session.findFirst({
    where: { id, userId: userId! },
  });
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.session.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, res } = await requireAuth();
  if (res) return res;

  const { id } = await params;
  const session = await prisma.session.findFirst({
    where: { id, userId: userId! },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          content: true,
          createdAt: true,
        },
      },
      feedback: true,
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let feedbackPayload: {
    id: string;
    scores: Record<string, number>;
    summary: string;
    actions: string[];
    practiceNext: string;
    weaknesses: string[];
    strengths?: string[];
    suggestedRewrite?: string | null;
    drill?: string | null;
    primaryLeak?: string | null;
    secondaryLeak?: string | null;
    leakExplanation?: string | null;
    leakEvidence?: string[];
  } | null = null;

  if (session.feedback) {
    const f = session.feedback;
    let scores: Record<string, number> = {};
    let actions: string[] = [];
    let weaknesses: string[] = [];
    let strengths: string[] = [];
    try {
      scores = typeof f.scores === "string" ? JSON.parse(f.scores) : f.scores;
    } catch {
      // ignore
    }
    try {
      actions = typeof f.actions === "string" ? JSON.parse(f.actions) : f.actions ?? [];
    } catch {
      // ignore
    }
    try {
      weaknesses = f.weaknesses ? (typeof f.weaknesses === "string" ? JSON.parse(f.weaknesses) : f.weaknesses) : [];
    } catch {
      // ignore
    }
    try {
      strengths = f.strengths ? (typeof f.strengths === "string" ? JSON.parse(f.strengths) : f.strengths) : [];
    } catch {
      // ignore
    }
    let leakEvidence: string[] = [];
    try {
      leakEvidence = f.leakEvidence ? (typeof f.leakEvidence === "string" ? JSON.parse(f.leakEvidence) : f.leakEvidence) : [];
    } catch {
      // ignore
    }
    feedbackPayload = {
      id: f.id,
      scores,
      summary: f.summary,
      actions,
      practiceNext: f.practiceNext,
      weaknesses,
      strengths,
      suggestedRewrite: f.suggestedRewrite ?? null,
      drill: f.drill ?? null,
      primaryLeak: f.primaryLeak ?? null,
      secondaryLeak: f.secondaryLeak ?? null,
      leakExplanation: f.leakExplanation ?? null,
      leakEvidence,
    };
  }

  return NextResponse.json({
    session: {
      id: session.id,
      type: session.type,
      scenarioId: session.scenarioId,
      scenarioTitle: session.scenarioTitle,
      phase: session.phase,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    },
    messages: session.messages,
    feedback: feedbackPayload,
  });
}

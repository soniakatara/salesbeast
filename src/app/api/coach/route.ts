import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getCoachReply } from "@/lib/coach";
import { groupBulletsByType } from "@/lib/playbooks";
import { getTopChunks } from "@/lib/notes";

export async function POST(request: Request) {
  const { userId, res } = await requireAuth();
  if (res) return res;

  try {
    const body = await request.json();
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const mode = body.mode === "openai" ? "openai" : "mock";

    if (!sessionId || !content) {
      return NextResponse.json(
        { error: "sessionId and content are required" },
        { status: 400 }
      );
    }
    if (content.length < 2) {
      return NextResponse.json(
        { error: "Message must be at least 2 characters" },
        { status: 400 }
      );
    }

    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId: userId! },
      include: {
        messages: { orderBy: { createdAt: "asc" }, take: 20 },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.type !== "roleplay") {
      return NextResponse.json(
        { error: "Session is not a roleplay session" },
        { status: 400 }
      );
    }

    const userMessage = await prisma.message.create({
      data: { sessionId, role: "user", content },
    });

    let phasesJson: string | null = null;
    if (session.scenarioId) {
      const preset = await prisma.scenarioPreset.findUnique({
        where: { id: session.scenarioId },
        select: { phases: true },
      });
      phasesJson = preset?.phases ?? null;
    }

    const playbooks = await prisma.playbook.findMany({
      where: { userId: userId! },
      select: { type: true, content: true },
    });
    const playbooksByType = groupBulletsByType(playbooks);

    const query = [session.scenarioTitle ?? "", session.phase ?? "", content].filter(Boolean).join(" | ");
    const notesChunks = await getTopChunks(query, userId!, 3);
    const noteSources = notesChunks.map((c) => ({
      sourceTitle: c.sourceTitle,
      snippet: c.content.slice(0, 200) + (c.content.length > 200 ? "…" : ""),
      score: c.score,
    }));

    const recentMessages = session.messages.map((m) => ({ role: m.role, content: m.content }));

    const { output: out, usedFallback } = await getCoachReply({
      mode,
      currentPhase: session.phase,
      phasesJson,
      playbooksByType,
      userMessage: content,
      recentMessages,
      notesChunks,
    });

    const assistantMessage = await prisma.message.create({
      data: {
        sessionId,
        role: "assistant",
        content: out.assistantReply,
      },
    });

    if (out.nextPhase) {
      await prisma.session.update({
        where: { id: sessionId },
        data: { phase: out.nextPhase },
      });
    }

    return NextResponse.json({
      assistantMessage: {
        id: assistantMessage.id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        createdAt: assistantMessage.createdAt,
      },
      nextPhase: out.nextPhase ?? undefined,
      suggestedNextUserMessage: out.suggestedNextUserMessage,
      oneThingToFix: out.oneThingToFix,
      drill: out.drill,
      phaseRationale: out.phaseRationale ?? undefined,
      noteSources,
      ...(usedFallback && { usedFallback: true }),
    });
  } catch (e) {
    console.error("Coach error:", e);
    return NextResponse.json(
      { error: "Failed to get coach reply" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { userId, res } = await requireAuth();
  if (res) return res;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "50", 10), 1), 100);
  const type = searchParams.get("type") ?? undefined; // "roleplay" | "rate" or omit for all

  const sessions = await prisma.session.findMany({
    where: {
      userId: userId!,
      ...(type && { type }),
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      scenarioId: true,
      scenarioTitle: true,
      phase: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      type: s.type,
      scenarioId: s.scenarioId,
      scenarioTitle: s.scenarioTitle,
      phase: s.phase,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      messageCount: s._count.messages,
    })),
  });
}

export async function POST(request: Request) {
  const { userId, res } = await requireAuth();
  if (res) return res;

  try {
    const body = await request.json();
    const type = String(body.type ?? "roleplay").trim();
    const scenarioId = body.scenarioId != null ? String(body.scenarioId) : null;
    const scenarioTitle = body.scenarioTitle != null ? String(body.scenarioTitle).trim() : null;

    if (type !== "roleplay" && type !== "rate") {
      return NextResponse.json(
        { error: "type must be 'roleplay' or 'rate'" },
        { status: 400 }
      );
    }

    const session = await prisma.session.create({
      data: {
        userId: userId!,
        type,
        scenarioId: scenarioId || null,
        scenarioTitle: scenarioTitle || null,
      },
    });

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
  } catch (e) {
    console.error("Session create error:", e);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}

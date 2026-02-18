import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, res } = await requireAuth();
  if (res) return res;

  const { id: sessionId } = await params;
  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId: userId! },
  });
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const messages = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ messages });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, res } = await requireAuth();
  if (res) return res;

  const { id: sessionId } = await params;
  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId: userId! },
  });
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const role = String(body.role ?? "user").trim();
    const content = String(body.content ?? "").trim();

    if (role !== "user" && role !== "assistant") {
      return NextResponse.json(
        { error: "role must be 'user' or 'assistant'" },
        { status: 400 }
      );
    }
    if (!content) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    const message = await prisma.message.create({
      data: {
        sessionId,
        role,
        content,
      },
    });

    return NextResponse.json({
      message: {
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
      },
    });
  } catch (e) {
    console.error("Message create error:", e);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}

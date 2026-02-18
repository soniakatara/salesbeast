import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { normalizePlaybookType } from "@/lib/playbooks";

export async function GET() {
  const { userId, res } = await requireAuth();
  if (res) return res;

  const playbooks = await prisma.playbook.findMany({
    where: { userId: userId! },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      content: true,
      type: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ playbooks });
}

export async function POST(request: Request) {
  const { userId, res } = await requireAuth();
  if (res) return res;

  try {
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "");
    const type = normalizePlaybookType(String(body.type ?? "opening_hooks").trim() || "opening_hooks");

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const playbook = await prisma.playbook.create({
      data: {
        userId: userId!,
        title,
        content,
        type,
      },
    });

    return NextResponse.json({
      playbook: {
        id: playbook.id,
        title: playbook.title,
        content: playbook.content,
        type: playbook.type,
        createdAt: playbook.createdAt,
        updatedAt: playbook.updatedAt,
      },
    });
  } catch (e) {
    console.error("Playbook create error:", e);
    return NextResponse.json(
      { error: "Failed to create playbook" },
      { status: 500 }
    );
  }
}

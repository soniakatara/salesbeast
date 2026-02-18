import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { normalizePlaybookType } from "@/lib/playbooks";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, res } = await requireAuth();
  if (res) return res;

  const { id } = await params;
  const playbook = await prisma.playbook.findFirst({
    where: { id, userId: userId! },
    select: {
      id: true,
      title: true,
      content: true,
      type: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!playbook) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ playbook });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, res } = await requireAuth();
  if (res) return res;

  const { id } = await params;
  const existing = await prisma.playbook.findFirst({
    where: { id, userId: userId! },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const title = body.title !== undefined ? String(body.title).trim() : undefined;
    const content = body.content !== undefined ? String(body.content) : undefined;
    const type = body.type !== undefined ? normalizePlaybookType(String(body.type).trim() || "opening_hooks") : undefined;

    if (title !== undefined && !title) {
      return NextResponse.json(
        { error: "Title cannot be empty" },
        { status: 400 }
      );
    }

    const playbook = await prisma.playbook.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(type !== undefined && { type }),
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
    console.error("Playbook update error:", e);
    return NextResponse.json(
      { error: "Failed to update playbook" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, res } = await requireAuth();
  if (res) return res;

  const { id } = await params;
  const existing = await prisma.playbook.findFirst({
    where: { id, userId: userId! },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const title = body.title !== undefined ? String(body.title).trim() : undefined;
    const content = body.content !== undefined ? String(body.content) : undefined;
    const type = body.type !== undefined ? normalizePlaybookType(String(body.type).trim() || "opening_hooks") : undefined;

    if (title !== undefined && !title) {
      return NextResponse.json(
        { error: "Title cannot be empty" },
        { status: 400 }
      );
    }

    const playbook = await prisma.playbook.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(type !== undefined && { type }),
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
    console.error("Playbook update error:", e);
    return NextResponse.json(
      { error: "Failed to update playbook" },
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
  const existing = await prisma.playbook.findFirst({
    where: { id, userId: userId! },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.playbook.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { chunkText } from "@/lib/notes";

export async function POST(request: Request) {
  const { userId, res } = await requireAuth();
  if (res) return res;

  try {
    const body = await request.json();
    const sourceTitle = typeof body.sourceTitle === "string" ? body.sourceTitle.trim() : "";
    const text = typeof body.text === "string" ? body.text : "";

    if (!sourceTitle) {
      return NextResponse.json(
        { error: "sourceTitle is required" },
        { status: 400 }
      );
    }

    const chunks = chunkText(text);
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "No content to ingest", count: 0 },
        { status: 400 }
      );
    }

    for (const content of chunks) {
      await prisma.noteChunk.create({
        data: {
          userId: userId!,
          sourceTitle,
          content,
        },
      });
    }

    return NextResponse.json({ count: chunks.length });
  } catch (e) {
    console.error("Notes ingest error:", e);
    const message = e instanceof Error ? e.message : "Failed to ingest notes";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

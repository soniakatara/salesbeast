import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getTopChunks } from "@/lib/notes";

const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

function buildSources(
  chunks: { sourceTitle: string; content: string; score?: number }[]
): { sourceTitle: string; snippet: string }[] {
  return chunks.map((c) => ({
    sourceTitle: c.sourceTitle,
    snippet: c.content.slice(0, 200) + (c.content.length > 200 ? "…" : ""),
  }));
}

export async function POST(request: Request) {
  const { userId, res } = await requireAuth();
  if (res) return res;

  try {
    const body = await request.json();
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const mode = body.mode === "openai" ? "openai" : "mock";

    if (!question) {
      return NextResponse.json(
        { error: "question is required" },
        { status: 400 }
      );
    }

    const topChunks = await getTopChunks(question, userId!, 5);
    const sources = buildSources(topChunks);
    const contextBlock =
      topChunks.length > 0
        ? topChunks
            .map((c) => `[${c.sourceTitle}]\n${c.content}`)
            .join("\n\n---\n\n")
        : "(No relevant notes found.)";

    const useOpenAI =
      mode === "openai" && !!process.env.OPENAI_API_KEY?.trim();

    if (useOpenAI) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            {
              role: "system",
              content: `You are a sales coach. Answer the user's question using ONLY the following notes. If the notes don't contain enough information, say so briefly. Do not make up details.\n\nNotes:\n${contextBlock}`,
            },
            { role: "user", content: question },
          ],
          max_tokens: 500,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("OpenAI ask error:", response.status, err);
        return NextResponse.json({
          answer:
            "AI is unavailable. Here are your matched notes instead.",
          sources,
          matchedChunksPreview: topChunks.map((c) => ({
            sourceTitle: c.sourceTitle,
            content: c.content.slice(0, 300) + (c.content.length > 300 ? "…" : ""),
          })),
        });
      }

      const data = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const answer =
        data.choices?.[0]?.message?.content?.trim() ??
        "No answer generated.";

      return NextResponse.json({ answer, sources });
    }

    return NextResponse.json({
      answer:
        topChunks.length > 0
          ? "AI not configured (showing matched notes). Ask again with Mode: AI if you have OPENAI_API_KEY set."
          : "No notes matched your question. Ingest some notes from the Notes page first.",
      sources,
      matchedChunksPreview: topChunks.map((c) => ({
        sourceTitle: c.sourceTitle,
        content: c.content.slice(0, 300) + (c.content.length > 300 ? "…" : ""),
      })),
    });
  } catch (e) {
    console.error("Ask error:", e);
    return NextResponse.json(
      { error: "Failed to answer question" },
      { status: 500 }
    );
  }
}

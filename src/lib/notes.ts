/**
 * Notes RAG-lite: chunk text, rank by keyword overlap, get top chunks for a question.
 */

import { prisma } from "@/lib/prisma";

const TARGET_CHUNK_CHARS = 3000;
const MIN_CHUNK_CHARS = 1500;
const MAX_CHUNK_CHARS = 4000;

/**
 * Split text into ~500–800 word chunks (~3k chars), preserving paragraphs.
 */
export function chunkText(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const paragraphs = trimmed.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) return [trimmed];

  const chunks: string[] = [];
  let current: string[] = [];
  let currentLength = 0;

  for (const p of paragraphs) {
    const pLen = p.length + 2;
    if (currentLength + pLen > MAX_CHUNK_CHARS && current.length > 0) {
      chunks.push(current.join("\n\n"));
      current = [p];
      currentLength = pLen;
    } else if (currentLength + pLen >= TARGET_CHUNK_CHARS && current.length > 0) {
      current.push(p);
      currentLength += pLen;
      chunks.push(current.join("\n\n"));
      current = [];
      currentLength = 0;
    } else {
      current.push(p);
      currentLength += pLen;
    }
  }
  if (current.length > 0) {
    chunks.push(current.join("\n\n"));
  }

  return chunks.filter((c) => c.length >= 0);
}

/**
 * Simple keyword scoring: term frequency of question terms in chunk.
 */
export function rankChunks(question: string, chunks: { content: string; id: string; sourceTitle: string }[]): { id: string; sourceTitle: string; content: string; score: number }[] {
  const terms = question
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
  if (terms.length === 0) return chunks.map((c) => ({ ...c, score: 0 }));

  return chunks.map((chunk) => {
    const lower = chunk.content.toLowerCase();
    let score = 0;
    for (const t of terms) {
      const matches = lower.split(t).length - 1;
      score += matches;
    }
    return { ...chunk, score };
  }).sort((a, b) => b.score - a.score);
}

export type NoteChunkRow = {
  id: string;
  sourceTitle: string;
  content: string;
};

/**
 * Load user's chunks from DB and return top matches by keyword score.
 */
export async function getTopChunks(
  question: string,
  userId: string,
  limit = 5
): Promise<{ id: string; sourceTitle: string; content: string; score: number }[]> {
  const chunks = await prisma.noteChunk.findMany({
    where: { userId },
    select: { id: true, sourceTitle: true, content: true },
  });
  const ranked = rankChunks(question, chunks);
  return ranked.slice(0, limit);
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";

type Source = { sourceTitle: string; snippet: string };
type ChunkPreview = { sourceTitle: string; content: string };

type AnswerEntry = {
  question: string;
  answer: string;
  sources: Source[];
  matchedChunksPreview?: ChunkPreview[];
};

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<"mock" | "openai">("mock");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<AnswerEntry[]>([]);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || asking) return;
    setAsking(true);
    setError("");
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, mode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to get answer.");
        setAsking(false);
        return;
      }
      setAnswers((prev) => [
        {
          question: q,
          answer: data.answer ?? "",
          sources: data.sources ?? [],
          matchedChunksPreview: data.matchedChunksPreview,
        },
        ...prev,
      ]);
      setQuestion("");
    } catch {
      setError("Failed to get answer.");
    } finally {
      setAsking(false);
    }
  }

  const selectClass =
    "border border-neutral-800 rounded-sm px-3 py-2 bg-neutral-900 text-neutral-100 text-sm focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
          Ask
        </h1>
        <Link href="/dashboard" className="text-sm text-violet-400 hover:text-violet-300">
          Dashboard
        </Link>
      </div>
      <p className="text-neutral-400">
        Ask questions about your sales notes. Answers use your ingested notes
        (Mock = keyword match only; AI = OpenAI with your notes as context).
      </p>

      {error && (
        <Card padding="sm" className="border-rose-800 bg-rose-950/30">
          <p className="text-sm text-rose-300">{error}</p>
        </Card>
      )}

      <Section title="Ask a question">
        <Card padding="md" className="max-w-2xl">
          <form onSubmit={handleAsk} className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <label htmlFor="ask-mode" className="text-sm font-medium text-neutral-200">
                Mode:
              </label>
              <select
                id="ask-mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as "mock" | "openai")}
                className={selectClass}
              >
                <option value="mock">Mock (matched notes only)</option>
                <option value="openai">AI (OpenAI + your notes)</option>
              </select>
            </div>
            <Input
              id="question"
              label="Question"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. How do I handle pricing objections?"
              required
            />
            <Button
              type="submit"
              disabled={asking || !question.trim()}
              isLoading={asking}
            >
              {asking ? "Asking…" : "Ask"}
            </Button>
          </form>
        </Card>
      </Section>

      {answers.length > 0 && (
        <Section title="Answers">
          <ul className="space-y-6">
            {answers.map((entry, i) => (
              <li key={i}>
                <Card padding="md" className="space-y-3">
                  <p className="text-sm font-medium text-neutral-400">
                    Q: {entry.question}
                  </p>
                  <p className="text-neutral-200 whitespace-pre-wrap">
                    {entry.answer}
                  </p>
                  {(entry.sources.length > 0 || (entry.matchedChunksPreview?.length ?? 0) > 0) && (
                    <div className="pt-2 border-t border-neutral-800">
                      <p className="text-xs font-medium text-neutral-500 mb-2">
                        Sources used
                      </p>
                      <ul className="space-y-2">
                        {(entry.matchedChunksPreview ?? entry.sources).map((s, j) => (
                          <li key={j} className="text-sm">
                            <Badge variant="accent" className="mr-2">
                              {(s as Source).sourceTitle ?? (s as ChunkPreview).sourceTitle}
                            </Badge>
                            <span className="text-neutral-400">
                              {(s as Source).snippet ?? (s as ChunkPreview).content}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <p className="text-sm text-neutral-500">
        <Link href="/notes" className="text-violet-400 hover:text-violet-300">
          Ingest more notes
        </Link>{" "}
        to improve answers.
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Section } from "@/components/ui/Section";

export default function NotesPage() {
  const [sourceTitle, setSourceTitle] = useState("");
  const [text, setText] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [error, setError] = useState("");
  const [lastCount, setLastCount] = useState<number | null>(null);

  async function handleIngest(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setIngesting(true);
    setError("");
    setLastCount(null);
    try {
      const res = await fetch("/api/notes/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceTitle: sourceTitle.trim() || "Untitled notes",
          text: text.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to ingest notes.");
        setIngesting(false);
        return;
      }
      setLastCount(data.count ?? 0);
      setText("");
      setSourceTitle("");
    } catch {
      setError("Failed to ingest notes.");
    } finally {
      setIngesting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
          My notes
        </h1>
        <Link href="/dashboard" className="text-sm text-violet-400 hover:text-violet-300">
          Dashboard
        </Link>
      </div>
      <p className="text-neutral-400">
        Paste your sales notes below. They’ll be stored as chunks so you can ask
        questions on the Ask page.
      </p>

      {error && (
        <Card padding="sm" className="border-rose-800 bg-rose-950/30">
          <p className="text-sm text-rose-300">{error}</p>
        </Card>
      )}

      {lastCount !== null && (
        <Card padding="sm" className="border-violet-800 bg-violet-950/20">
          <p className="text-sm text-violet-300">Saved {lastCount} chunk{lastCount !== 1 ? "s" : ""}.</p>
        </Card>
      )}

      <Section
        title="Ingest notes"
        description="Give a title (e.g. “Q4 pitch”) and paste your notes. They’ll be split into chunks automatically."
      >
        <Card padding="md" className="max-w-2xl">
          <form onSubmit={handleIngest} className="space-y-4">
            <Input
              id="source-title"
              label="Source title"
              type="text"
              value={sourceTitle}
              onChange={(e) => setSourceTitle(e.target.value)}
              placeholder="e.g. Q4 pitch notes"
            />
            <Textarea
              id="notes-text"
              label="Paste your notes"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your sales notes here…"
              rows={12}
              className="font-mono text-sm"
            />
            <Button
              type="submit"
              disabled={ingesting || !text.trim()}
              isLoading={ingesting}
            >
              {ingesting ? "Ingesting…" : "Ingest"}
            </Button>
          </form>
        </Card>
      </Section>

      <p className="text-sm text-neutral-500">
        <Link href="/ask" className="text-violet-400 hover:text-violet-300">
          Go to Ask
        </Link>{" "}
        to ask questions using your notes.
      </p>
    </div>
  );
}

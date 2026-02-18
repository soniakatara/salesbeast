"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Section } from "@/components/ui/Section";

type RateResult = {
  session: { id: string; type: string; scenarioTitle: string | null; createdAt: string };
  usedFallback?: boolean;
  feedback: {
    id: string;
    scores: Record<string, number>;
    summary: string;
    actions: string[];
    practiceNext: string;
    weaknesses: string[];
    strengths: string[];
    suggestedRewrite?: string;
    drill?: string;
    primaryLeak?: string | null;
    secondaryLeak?: string | null;
    leakExplanation?: string | null;
    leakEvidence?: string[];
  };
};

function buildFeedbackSummaryText(feedback: RateResult["feedback"], avg: number): string {
  const phases = ["opening", "discovery", "pitch", "objection", "close"];
  const scoreLines = phases.map((p) => `  ${p}: ${feedback.scores[p] ?? 0}/100`).join("\n");
  let text = `Scores\n${scoreLines}\nOverall: ${avg}/100\n\n`;
  text += `Summary\n${feedback.summary}\n\n`;
  if (feedback.weaknesses?.length) {
    text += `Top weaknesses\n${feedback.weaknesses.map((w) => `  - ${w}`).join("\n")}\n\n`;
  }
  text += `Next drill\n${feedback.drill ?? feedback.practiceNext}\n\n`;
  if (feedback.suggestedRewrite) {
    text += `Suggested rewrite\n${feedback.suggestedRewrite}\n`;
  }
  return text;
}

export default function RatePage() {
  const [transcript, setTranscript] = useState("");
  const [scenarioTitle, setScenarioTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [rateMode, setRateMode] = useState<"mock" | "openai">("mock");
  const [usedFallback, setUsedFallback] = useState(false);
  const [result, setResult] = useState<RateResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!transcript.trim()) return;
    setError("");
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcript.trim(),
          scenarioTitle: scenarioTitle.trim() || undefined,
          mode: rateMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to rate conversation.");
        setSubmitting(false);
        return;
      }
      setUsedFallback(!!data.usedFallback);
      setResult(data);
    } catch {
      setError("Failed to rate conversation.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setResult(null);
    setTranscript("");
    setScenarioTitle("");
    setError("");
    setUsedFallback(false);
  }

  const transcriptShort = transcript.trim().length > 0 && transcript.trim().length < 200;

  if (result) {
    const { session, feedback } = result;
    const phases = ["opening", "discovery", "pitch", "objection", "close"];
    const avg = Math.round(
      phases.reduce((a, k) => a + (feedback.scores[k] ?? 0), 0) / phases.length
    );

    return (
      <div className="space-y-8">
        {usedFallback && (
          <Card padding="md" className="border-amber-800 bg-amber-950/20">
            <p className="text-sm text-amber-300">
              AI unavailable; used mock evaluation.
            </p>
          </Card>
        )}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
            Rate my conversation
          </h1>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigator.clipboard.writeText(buildFeedbackSummaryText(feedback, avg))}
            >
              Copy summary
            </Button>
            <Link
              href={`/history/${session.id}`}
              className="text-sm text-violet-400 hover:text-violet-300"
            >
              View in history
            </Link>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Rate another
            </Button>
          </div>
        </div>

        <p className="text-neutral-400">
          Saved as session in your history. Review scores and drills below.
        </p>

        {(feedback.primaryLeak || feedback.leakExplanation || (feedback.leakEvidence && feedback.leakEvidence.length > 0)) && (
          <Section title="Diagnostic Layer">
            <Card padding="md" className="border-amber-800 bg-amber-950/20 space-y-2">
              {feedback.primaryLeak && (
                <p className="text-sm">
                  <span className="font-medium text-neutral-200">Primary leak: </span>
                  <span className="text-amber-300">{feedback.primaryLeak}</span>
                </p>
              )}
              {feedback.secondaryLeak && (
                <p className="text-sm">
                  <span className="font-medium text-neutral-200">Secondary leak: </span>
                  <span className="text-amber-400">{feedback.secondaryLeak}</span>
                </p>
              )}
              {feedback.leakExplanation && (
                <p className="text-sm text-neutral-300">{feedback.leakExplanation}</p>
              )}
              {feedback.leakEvidence && feedback.leakEvidence.length > 0 && (
                <ul className="list-disc list-inside text-sm text-neutral-400 space-y-1">
                  {feedback.leakEvidence.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </Card>
          </Section>
        )}

        <Section title="Score breakdown">
          <div className="flex flex-wrap gap-4">
            {phases.map((phase) => (
              <div key={phase} className="min-w-[100px]">
                <span className="text-sm capitalize text-neutral-500">{phase}</span>
                <p className="text-xl font-semibold text-neutral-100">
                  {feedback.scores[phase] ?? 0}/100
                </p>
              </div>
            ))}
          </div>
          <p className="text-sm text-neutral-500 mt-2">Overall: {avg}/100</p>
        </Section>

        <Section title="Summary">
          <p className="text-neutral-300">{feedback.summary}</p>
        </Section>

        {feedback.strengths && feedback.strengths.length > 0 && (
          <Section title="Strengths">
            <ul className="list-disc list-inside space-y-1 text-neutral-300">
              {feedback.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Improvements">
          <ul className="list-disc list-inside space-y-1 text-neutral-300">
            {feedback.actions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </Section>

        <Section title="Drill">
          <p className="text-neutral-300">{feedback.drill ?? feedback.practiceNext}</p>
        </Section>

        {feedback.suggestedRewrite && (
          <Section title="Suggested rewrite">
            <p className="text-neutral-300">{feedback.suggestedRewrite}</p>
          </Section>
        )}

        {feedback.weaknesses.length > 0 && (
          <Section title="Top weaknesses">
            <ul className="list-disc list-inside space-y-1 text-neutral-300">
              {feedback.weaknesses.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </Section>
        )}

        <p className="text-sm text-neutral-500">
          <Link href={`/history/${session.id}`} className="text-violet-400 hover:text-violet-300">
            Open this session in history
          </Link>{" "}
          to see the transcript and feedback together.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
          Rate my conversation
        </h1>
        <Link href="/dashboard" className="text-sm text-violet-400 hover:text-violet-300">
          Dashboard
        </Link>
      </div>

      <Section
        title="Paste transcript"
        description="Paste a sales conversation transcript. We'll score it and suggest improvements and drills."
      >
        {error && (
          <Card padding="sm" className="border-rose-800 bg-rose-950/30">
            <p className="text-sm text-rose-300">{error}</p>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-2">
            <label htmlFor="rate-mode" className="text-sm font-medium text-neutral-200">
              Mode:
            </label>
            <select
              id="rate-mode"
              value={rateMode}
              onChange={(e) => setRateMode(e.target.value as "mock" | "openai")}
              className="border border-neutral-800 rounded-sm px-3 py-2 bg-neutral-900 text-sm text-neutral-100 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none"
            >
              <option value="mock">Mock (deterministic)</option>
              <option value="openai">AI (requires OPENAI_API_KEY)</option>
            </select>
          </div>
          <Input
            id="scenario-title"
            label="Scenario or context (optional)"
            type="text"
            value={scenarioTitle}
            onChange={(e) => setScenarioTitle(e.target.value)}
            placeholder="e.g. Cold call with enterprise lead"
          />
          <Textarea
            id="transcript"
            label="Transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={"Paste the conversation here. E.g.\nSeller: Hi, this is...\nProspect: Hey, what's this about?"}
            rows={12}
            className="font-mono"
            required
          />
          {transcriptShort && (
            <p className="text-sm text-amber-300">
              Short transcript; feedback may be less accurate. You can still submit.
            </p>
          )}
          <Button type="submit" disabled={submitting} isLoading={submitting}>
            {submitting ? "Evaluating…" : "Rate conversation"}
          </Button>
        </form>
      </Section>
    </div>
  );
}

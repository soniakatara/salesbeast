"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";

type Session = {
  id: string;
  type: string;
  scenarioId: string | null;
  scenarioTitle: string | null;
  phase: string | null;
  createdAt: string;
  updatedAt: string;
};

type Message = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
};

type Feedback = {
  id: string;
  scores: Record<string, number>;
  summary: string;
  actions: string[];
  practiceNext: string;
  weaknesses: string[];
  strengths?: string[];
  suggestedRewrite?: string | null;
  drill?: string | null;
  primaryLeak?: string | null;
  secondaryLeak?: string | null;
  leakExplanation?: string | null;
  leakEvidence?: string[];
};

function buildFeedbackSummaryText(feedback: Feedback): string {
  const phases = ["opening", "discovery", "pitch", "objection", "close"];
  const avg = Math.round(
    phases.reduce((a, k) => a + (feedback.scores[k] ?? 0), 0) / 5
  );
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

export default function HistoryDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/sessions/${id}`);
        if (!res.ok) {
          if (res.status === 404) setError("Session not found.");
          else if (res.status === 401) setError("Please sign in.");
          else setError("Failed to load session.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setSession(data.session);
          setMessages(data.messages ?? []);
          setFeedback(data.feedback ?? null);
        }
      } catch {
        if (!cancelled) setError("Failed to load session.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Link href="/history" className="text-sm text-violet-400 hover:text-violet-300">
          ← Back to history
        </Link>
        <p className="text-neutral-500">Loading…</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="space-y-4">
        <Link href="/history" className="text-sm text-violet-400 hover:text-violet-300">
          ← Back to history
        </Link>
        <p className="text-rose-400">{error || "Session not found."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Link href="/history" className="text-sm text-violet-400 hover:text-violet-300">
          ← Back to history
        </Link>
        {feedback && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigator.clipboard.writeText(buildFeedbackSummaryText(feedback))}
          >
            Copy summary
          </Button>
        )}
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-100 capitalize">
          {session.type} session
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {session.scenarioTitle || "Custom scenario"} · {new Date(session.createdAt).toLocaleString()}
        </p>
        {session.phase && (
          <p className="text-sm text-neutral-500">Phase: {session.phase}</p>
        )}
      </div>

      <Section title="Conversation">
        {messages.length === 0 ? (
          <p className="text-neutral-500">No messages in this session.</p>
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => (
              <li
                key={m.id}
                className={`rounded-md p-3 border ${
                  m.role === "user"
                    ? "bg-neutral-800 border-neutral-700 ml-0"
                    : "bg-violet-500/10 border-violet-500/20 mr-0"
                }`}
              >
                <span className="text-xs font-medium text-neutral-500 capitalize">
                  {m.role}
                </span>
                <p className="mt-1 whitespace-pre-wrap text-neutral-200">{m.content}</p>
                <p className="text-xs text-neutral-500 mt-1">
                  {new Date(m.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {feedback && (
        <>
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
            <div className="flex flex-wrap gap-4 mb-2">
              {["opening", "discovery", "pitch", "objection", "close"].map((phase) => (
                <div key={phase} className="min-w-[100px]">
                  <span className="text-sm capitalize text-neutral-500">{phase}</span>
                  <p className="text-xl font-semibold text-neutral-100">
                    {feedback.scores[phase] ?? 0}/100
                  </p>
                </div>
              ))}
            </div>
            <p className="text-sm text-neutral-500">
              Overall:{" "}
              {Math.round(
                (["opening", "discovery", "pitch", "objection", "close"] as const).reduce(
                  (a, k) => a + (feedback.scores[k] ?? 0),
                  0
                ) / 5
              )}
              /100
            </p>
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
        </>
      )}
    </div>
  );
}

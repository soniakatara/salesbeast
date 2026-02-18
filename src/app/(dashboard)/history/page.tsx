"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type SessionItem = {
  id: string;
  type: string;
  scenarioId: string | null;
  scenarioTitle: string | null;
  phase: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

type FeedbackSummary = {
  topWeaknesses: string[];
  averageOverallScore?: number;
};

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [sessionsRes, summaryRes] = await Promise.all([
          fetch("/api/sessions?limit=50"),
          fetch("/api/feedback/summary"),
        ]);
        if (!sessionsRes.ok) {
          if (sessionsRes.status === 401) setError("Please sign in.");
          else setError("Failed to load sessions.");
        } else {
          const data = await sessionsRes.json();
          if (!cancelled) setSessions(data.sessions ?? []);
        }
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          if (!cancelled) {
            setSummary({
              topWeaknesses: summaryData.topWeaknesses ?? [],
              averageOverallScore: summaryData.averageOverallScore,
            });
          }
        }
      } catch {
        if (!cancelled) setError("Failed to load sessions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function formatDate(s: string) {
    const d = new Date(s);
    const now = new Date();
    const sameDay =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    if (sameDay) {
      return d.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
          History
        </h1>
        <div className="flex gap-2">
          <Link href="/insights" className="text-sm text-violet-400 hover:text-violet-300">
            Insights
          </Link>
          <Link href="/dashboard" className="text-sm text-violet-400 hover:text-violet-300">
            Dashboard
          </Link>
        </div>
      </div>
      <p className="text-neutral-400">
        Recent roleplay and rate sessions. Open one to see the conversation and
        feedback.
      </p>

      {summary && (summary.topWeaknesses.length > 0 || summary.averageOverallScore != null) && (
        <Card padding="md" className="border-neutral-800 bg-neutral-900/50">
          <h2 className="text-sm font-medium text-neutral-300 mb-2">Insights</h2>
          {summary.averageOverallScore != null && (
            <p className="text-sm text-neutral-400 mb-2">
              Average score: <span className="text-neutral-200">{summary.averageOverallScore}/100</span>
            </p>
          )}
          {summary.topWeaknesses.length > 0 && (
            <div>
              <p className="text-sm font-medium text-neutral-400 mb-1">Top weaknesses</p>
              <ul className="list-disc list-inside text-sm text-neutral-500 space-y-0.5">
                {summary.topWeaknesses.slice(0, 5).map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {error && (
        <Card padding="sm" className="border-rose-800 bg-rose-950/30">
          <p className="text-sm text-rose-300">{error}</p>
        </Card>
      )}

      {loading ? (
        <p className="text-neutral-500">Loading…</p>
      ) : sessions.length === 0 ? (
        <p className="text-neutral-500">
          No sessions yet. Start a roleplay or rate a conversation from the
          dashboard.
        </p>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link href={`/history/${s.id}`}>
                <Card
                  padding="md"
                  className="hover:border-neutral-700 transition-colors block"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="accent">{s.type}</Badge>
                      {(s.scenarioTitle || s.scenarioId) && (
                        <span className="text-neutral-500 text-sm">
                          – {s.scenarioTitle || "Scenario"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-neutral-500">
                      <span>{s.messageCount} messages</span>
                      <span>{formatDate(s.updatedAt)}</span>
                    </div>
                  </div>
                  {s.phase && (
                    <p className="text-sm text-neutral-500 mt-1">Phase: {s.phase}</p>
                  )}
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

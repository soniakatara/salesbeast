"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Section } from "@/components/ui/Section";

type Summary = {
  feedbacks: unknown[];
  topWeaknesses: string[];
  topWeaknessesWithCount: { weakness: string; count: number }[];
  topPrimaryLeaks?: { leak: string; count: number }[];
  topSecondaryLeaks?: { leak: string; count: number }[];
  averageOverallScore: number;
  lastFiveSessions: {
    sessionId: string;
    type: string;
    scenarioTitle: string | null;
    createdAt: string;
    overallScore: number;
  }[];
};

export default function InsightsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/feedback/summary");
        if (!res.ok) {
          if (res.status === 401) setError("Please sign in.");
          else setError("Failed to load insights.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (!cancelled) setSummary(data);
      } catch {
        if (!cancelled) setError("Failed to load insights.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
          Insights
        </h1>
        <div className="flex gap-2">
          <Link href="/history" className="text-sm text-violet-400 hover:text-violet-300">
            History
          </Link>
          <Link href="/dashboard" className="text-sm text-violet-400 hover:text-violet-300">
            Dashboard
          </Link>
        </div>
      </div>
      <p className="text-neutral-400">
        Aggregated from your last 20 rated conversations. Use this to focus
        practice.
      </p>

      {error && (
        <Card padding="sm" className="border-rose-800 bg-rose-950/30">
          <p className="text-sm text-rose-300">{error}</p>
        </Card>
      )}

      {loading ? (
        <p className="text-neutral-500">Loading…</p>
      ) : summary ? (
        <>
          <Section title="Average overall score">
            <Card padding="md">
              <p className="text-3xl font-semibold text-neutral-100">
                {summary.averageOverallScore}/100
              </p>
            </Card>
          </Section>

          {(summary.topWeaknessesWithCount ?? []).length > 0 && (
            <Section
              title="Top weaknesses"
              description="Weaknesses that showed up most often across your feedback."
            >
              <ul className="space-y-2">
                {(summary.topWeaknessesWithCount ?? []).map((item, i) => (
                  <Card key={i} padding="md" className="flex justify-between items-start gap-4">
                    <span className="text-neutral-300 flex-1">{item.weakness}</span>
                    <Badge variant="default">{item.count}×</Badge>
                  </Card>
                ))}
              </ul>
            </Section>
          )}

          {(summary.topPrimaryLeaks ?? []).length > 0 && (
            <Section
              title="Top primary leaks"
              description="Frame, Leverage, or Precision leaks most often flagged as primary."
            >
              <ul className="space-y-2">
                {(summary.topPrimaryLeaks ?? []).map((item, i) => (
                  <Card
                    key={i}
                    padding="md"
                    className="flex justify-between items-start gap-4 border-amber-800 bg-amber-950/20"
                  >
                    <span className="text-amber-300 flex-1">{item.leak}</span>
                    <Badge variant="warning">{item.count}×</Badge>
                  </Card>
                ))}
              </ul>
            </Section>
          )}

          {(summary.topSecondaryLeaks ?? []).length > 0 && (
            <Section
              title="Top secondary leaks"
              description="Leaks most often flagged as secondary."
            >
              <ul className="space-y-2">
                {(summary.topSecondaryLeaks ?? []).map((item, i) => (
                  <Card
                    key={i}
                    padding="md"
                    className="flex justify-between items-start gap-4 border-amber-800 bg-amber-950/20"
                  >
                    <span className="text-amber-300 flex-1">{item.leak}</span>
                    <Badge variant="warning">{item.count}×</Badge>
                  </Card>
                ))}
              </ul>
            </Section>
          )}

          {summary.lastFiveSessions.length > 0 && (
            <Section title="Last 5 rated sessions">
              <ul className="space-y-2">
                {summary.lastFiveSessions.map((s) => (
                  <li key={s.sessionId}>
                    <Link href={`/history/${s.sessionId}`}>
                      <Card
                        padding="md"
                        className="hover:border-neutral-700 transition-colors block"
                      >
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-medium text-neutral-200 capitalize">
                            {s.type}
                          </span>
                          <Badge variant="default">{s.overallScore}/100</Badge>
                        </div>
                        <p className="text-sm text-neutral-500 mt-0.5">
                          {s.scenarioTitle || "Session"} ·{" "}
                          {new Date(s.createdAt).toLocaleString()}
                        </p>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {(summary.topWeaknessesWithCount ?? []).length === 0 &&
            (summary.topPrimaryLeaks ?? []).length === 0 &&
            (summary.topSecondaryLeaks ?? []).length === 0 &&
            summary.lastFiveSessions.length === 0 && (
              <p className="text-neutral-500">
                No feedback yet. Rate a conversation from the dashboard to see
                insights here.
              </p>
            )}
        </>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

type Scenario = {
  id: string;
  title: string;
  description: string;
  phases: string;
  isActive: boolean;
};

type Message = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
};

type Session = {
  id: string;
  type: string;
  scenarioId: string | null;
  scenarioTitle: string | null;
  phase: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function RoleplayPage() {
  const searchParams = useSearchParams();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [scenariosLoading, setScenariosLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [lastInsight, setLastInsight] = useState<{
    suggestedNextUserMessage: string;
    oneThingToFix: string;
    drill: string;
  } | null>(null);
  const [coachMode, setCoachMode] = useState<"mock" | "openai">("mock");
  const [usedFallback, setUsedFallback] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const [hydrating, setHydrating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/scenarios");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.scenarios?.length) {
          setScenarios(data.scenarios);
          setSelectedId(data.scenarios[0].id);
        }
      } finally {
        if (!cancelled) setScenariosLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const sessionIdFromUrl = searchParams.get("sessionId");
    if (!sessionIdFromUrl || session) return;
    let cancelled = false;
    setHydrating(true);
    setError("");
    (async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionIdFromUrl}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled && data.session) {
          setSession(data.session);
          setMessages(data.messages ?? []);
          setCurrentPhase(data.session.phase ?? null);
        }
      } catch {
        if (!cancelled) setError("Failed to load session.");
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, session]);

  async function handleStart() {
    setError("");
    setStarting(true);
    try {
      const useCustom = customTitle.trim().length > 0;
      const body: { type: string; scenarioId?: string; scenarioTitle?: string } = {
        type: "roleplay",
      };
      if (useCustom) {
        body.scenarioTitle = customTitle.trim();
      } else if (selectedId) {
        body.scenarioId = selectedId;
        const scenario = scenarios.find((s) => s.id === selectedId);
        body.scenarioTitle = scenario?.title ?? undefined;
      }

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to start session.");
        setStarting(false);
        return;
      }
      const data = await res.json();
      setSession(data.session);
      setMessages([]);
      setCurrentPhase(null);
      if (typeof window !== "undefined" && data.session?.id) {
        const url = new URL(window.location.href);
        url.searchParams.set("sessionId", data.session.id);
        window.history.replaceState(null, "", url.toString());
      }
    } catch {
      setError("Failed to start session.");
    } finally {
      setStarting(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const userContent = input.trim();
    if (!session || !userContent || sending) return;
    if (userContent.length < 2) {
      setError("Message must be at least 2 characters.");
      return;
    }
    setInput("");
    setError("");
    setSending(true);

    setMessages((prev) => [
      ...prev,
      {
        id: `temp-user-${Date.now()}`,
        role: "user",
        content: userContent,
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          content: userContent,
          mode: coachMode,
        }),
      });
      const data = await res.json();

      if (data.usedFallback) setUsedFallback(true);

      if (!res.ok) {
        setError(data.error ?? "Failed to get reply.");
        setMessages((prev) => prev.filter((m) => !m.id.startsWith("temp-user")));
        setInput(userContent);
        setSending(false);
        return;
      }

      if (data.nextPhase != null) setCurrentPhase(data.nextPhase);
      if (data.suggestedNextUserMessage != null || data.oneThingToFix != null || data.drill != null) {
        setLastInsight({
          suggestedNextUserMessage: data.suggestedNextUserMessage ?? "",
          oneThingToFix: data.oneThingToFix ?? "",
          drill: data.drill ?? "",
        });
      }

      setMessages((prev) =>
        prev.concat({
          id: data.assistantMessage?.id ?? `temp-${Date.now()}`,
          role: data.assistantMessage?.role ?? "assistant",
          content: data.assistantMessage?.content ?? "",
          createdAt: data.assistantMessage?.createdAt ?? new Date().toISOString(),
        })
      );
    } catch {
      setError("Failed to get reply.");
      setMessages((prev) => prev.filter((m) => !m.id.startsWith("temp-user")));
      setInput(userContent);
    } finally {
      setSending(false);
    }
  }

  function handleNewRoleplay() {
    setSession(null);
    setMessages([]);
    setCurrentPhase(null);
    setLastInsight(null);
    setUsedFallback(false);
    setError("");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("sessionId");
      window.history.replaceState(null, "", url.toString());
    }
  }

  if (hydrating && !session) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">Roleplay</h1>
        <p className="text-neutral-500">Loading session…</p>
      </div>
    );
  }

  if (session) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
              Roleplay
            </h1>
            <span className="text-sm text-neutral-500">
              {session.scenarioTitle || "Custom scenario"}
            </span>
            <label className="flex items-center gap-2 text-sm text-neutral-400">
              Coach:
              <select
                value={coachMode}
                onChange={(e) => setCoachMode(e.target.value as "mock" | "openai")}
                className="border border-neutral-800 rounded-sm px-2 py-1 bg-neutral-900 text-neutral-100 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none"
              >
                <option value="mock">Mock</option>
                <option value="openai">AI</option>
              </select>
            </label>
            {currentPhase && (
              <Badge variant="accent">Phase: {currentPhase}</Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Link href="/history" className="text-sm text-violet-400 hover:text-violet-300">
              History
            </Link>
            <Button variant="ghost" size="sm" onClick={handleNewRoleplay}>
              New roleplay
            </Button>
          </div>
        </div>

        {usedFallback && (
          <Card padding="sm" className="border-amber-800 bg-amber-950/20">
            <p className="text-sm text-amber-300">AI unavailable; used mock coaching.</p>
          </Card>
        )}

        {lastInsight && (lastInsight.suggestedNextUserMessage || lastInsight.oneThingToFix || lastInsight.drill) && (
          <Card padding="md" className="space-y-2 text-sm">
            {lastInsight.suggestedNextUserMessage && (
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge variant="accent" className="mb-1">Suggested next message</Badge>
                  <p className="text-neutral-300">{lastInsight.suggestedNextUserMessage}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(lastInsight!.suggestedNextUserMessage)}
                >
                  Copy
                </Button>
              </div>
            )}
            {lastInsight.oneThingToFix && (
              <div>
                <Badge variant="default" className="mb-1">One thing to fix</Badge>
                <p className="text-neutral-300">{lastInsight.oneThingToFix}</p>
              </div>
            )}
            {lastInsight.drill && (
              <div>
                <Badge variant="default" className="mb-1">Drill</Badge>
                <p className="text-neutral-300">{lastInsight.drill}</p>
              </div>
            )}
          </Card>
        )}

        {error && (
          <Card padding="sm" className="border-rose-800 bg-rose-950/30">
            <p className="text-sm text-rose-300">{error}</p>
          </Card>
        )}

        <Card padding="none" className="flex flex-col min-h-[320px] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-neutral-500 text-sm">
                Start the conversation. You're the seller; the coach plays the
                prospect.
              </p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={
                    m.role === "user"
                      ? "ml-0 mr-8 bg-neutral-800 border border-neutral-700 rounded-md p-3"
                      : "mr-0 ml-8 bg-violet-500/10 border border-violet-500/20 rounded-md p-3"
                  }
                >
                  <span className="text-xs font-medium text-neutral-500 capitalize">
                    {m.role}
                  </span>
                  <p className="mt-1 whitespace-pre-wrap text-neutral-200">{m.content}</p>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleSend} className="p-4 border-t border-neutral-800">
            <div className="flex gap-2">
              <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={sending}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={sending || input.trim().length < 2}
                isLoading={sending}
              >
                {sending ? "Sending…" : "Send"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
          Roleplay
        </h1>
        <Link href="/dashboard" className="text-sm text-violet-400 hover:text-violet-300">
          Dashboard
        </Link>
      </div>
      <p className="text-neutral-400">
        Pick a scenario or describe your own. You'll play the seller; the coach
        plays the prospect.
      </p>

      {error && (
        <Card padding="sm" className="border-rose-800 bg-rose-950/30">
          <p className="text-sm text-rose-300">{error}</p>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-base font-medium text-neutral-200">Scenario</h2>
        {scenariosLoading ? (
          <p className="text-neutral-500">Loading scenarios…</p>
        ) : scenarios.length === 0 ? (
          <p className="text-neutral-500">
            No scenarios available. Use a custom scenario below or run db:seed.
          </p>
        ) : (
          <div className="space-y-2">
            {scenarios.map((s) => (
              <label
                key={s.id}
                className="block cursor-pointer"
              >
                <Card
                  padding="md"
                  className={`transition-colors ${
                    selectedId === s.id
                      ? "border-violet-500/50 bg-violet-500/5"
                      : "hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="scenario"
                      checked={selectedId === s.id}
                      onChange={() => setSelectedId(s.id)}
                      className="mt-1"
                    />
                    <div>
                      <span className="font-medium text-neutral-100">{s.title}</span>
                      <p className="text-sm text-neutral-500 mt-0.5">{s.description}</p>
                    </div>
                  </div>
                </Card>
              </label>
            ))}
          </div>
        )}

        <Textarea
          id="custom-scenario"
          label="Or describe a custom scenario (optional)"
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
          placeholder="e.g. Enterprise lead who asked for a pilot"
          rows={2}
        />
      </div>

      <Button
        onClick={handleStart}
        disabled={starting}
        isLoading={starting}
      >
        {starting ? "Starting…" : "Start roleplay"}
      </Button>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Section } from "@/components/ui/Section";

const PLAYBOOK_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "opening_hooks", label: "Opening hooks" },
  { value: "discovery_questions", label: "Discovery questions" },
  { value: "objection_responses", label: "Objection responses" },
  { value: "closing_next_steps", label: "Closing next steps" },
];

function normalizeTypeForUI(type: string): string {
  const t = type.trim().toLowerCase();
  if (PLAYBOOK_TYPE_OPTIONS.some((o) => o.value === t)) return t;
  if (t === "script" || t === "opening") return "opening_hooks";
  if (t === "framework" || t === "discovery") return "discovery_questions";
  if (t === "objection_library" || t === "objection") return "objection_responses";
  if (t === "close" || t === "closing") return "closing_next_steps";
  return "opening_hooks";
}

function typeLabel(type: string): string {
  return PLAYBOOK_TYPE_OPTIONS.find((o) => o.value === normalizeTypeForUI(type))?.label ?? type.replace(/_/g, " ");
}

type Playbook = {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  updatedAt: string;
};

export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState("opening_hooks");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editType, setEditType] = useState("opening_hooks");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredPlaybooks =
    typeFilter === "all"
      ? playbooks
      : playbooks.filter((p) => normalizeTypeForUI(p.type) === typeFilter);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/playbooks");
      if (!res.ok) {
        if (res.status === 401) setError("Please sign in.");
        else setError("Failed to load playbooks.");
        return;
      }
      const data = await res.json();
      setPlaybooks(data.playbooks ?? []);
    } catch {
      setError("Failed to load playbooks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/playbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent,
          type: newType || "opening_hooks",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to create.");
        setCreating(false);
        return;
      }
      setNewTitle("");
      setNewContent("");
      setNewType("opening_hooks");
      await load();
    } catch {
      setError("Failed to create.");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(p: Playbook) {
    setEditingId(p.id);
    setEditTitle(p.title);
    setEditContent(p.content);
    setEditType(normalizeTypeForUI(p.type));
  }

  async function handleUpdate(e: React.FormEvent, id: string) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`/api/playbooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent,
          type: editType || "opening_hooks",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to update.");
        return;
      }
      setEditingId(null);
      await load();
    } catch {
      setError("Failed to update.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this playbook?")) return;
    setDeletingId(id);
    setError("");
    try {
      const res = await fetch(`/api/playbooks/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Failed to delete.");
        setDeletingId(null);
        return;
      }
      if (editingId === id) setEditingId(null);
      await load();
    } catch {
      setError("Failed to delete.");
    } finally {
      setDeletingId(null);
    }
  }

  const selectClass =
    "w-full border border-neutral-800 rounded-sm px-3 py-2 bg-neutral-900 text-neutral-100 text-sm focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
          Playbooks
        </h1>
        <Link href="/dashboard" className="text-sm text-violet-400 hover:text-violet-300">
          Dashboard
        </Link>
      </div>
      <p className="text-neutral-400">
        One bullet per line. Use opening hooks, discovery questions, objection
        responses, and closing next steps during roleplay.
      </p>

      {error && (
        <Card padding="sm" className="border-rose-800 bg-rose-950/30">
          <p className="text-sm text-rose-300">{error}</p>
        </Card>
      )}

      <Section title="New playbook">
        <Card padding="md" className="max-w-xl">
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              id="new-title"
              label="Title"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Cold outreach script"
              required
            />
            <div className="space-y-1">
              <label htmlFor="new-type" className="block text-sm font-medium text-neutral-200">
                Type
              </label>
              <select
                id="new-type"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className={selectClass}
              >
                {PLAYBOOK_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <Textarea
              id="new-content"
              label="Content (one bullet per line)"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder={"e.g.\nWhat's your biggest challenge right now?\nHow do you handle follow-ups today?"}
              rows={4}
            />
            <Button type="submit" disabled={creating} isLoading={creating}>
              {creating ? "Creating…" : "Create playbook"}
            </Button>
          </form>
        </Card>
      </Section>

      <Section title="Your playbooks">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={`${selectClass} w-auto min-w-[160px]`}
          >
            <option value="all">All types</option>
            {PLAYBOOK_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <p className="text-neutral-500">Loading…</p>
        ) : filteredPlaybooks.length === 0 ? (
          <p className="text-neutral-500">
            {playbooks.length === 0
              ? "No playbooks yet. Create one above."
              : "No playbooks match the selected type."}
          </p>
        ) : (
          <ul className="space-y-3">
            {filteredPlaybooks.map((p) => (
              <li key={p.id}>
                <Card padding="md">
                  {editingId === p.id ? (
                    <form onSubmit={(e) => handleUpdate(e, p.id)} className="space-y-4">
                      <Input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        required
                      />
                      <select
                        value={editType}
                        onChange={(e) => setEditType(e.target.value)}
                        className={selectClass}
                      >
                        {PLAYBOOK_TYPE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <Button type="submit">Save</Button>
                        <Button
                          variant="secondary"
                          type="button"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <h3 className="font-medium text-neutral-100">{p.title}</h3>
                          <Badge variant="accent" className="mt-1">
                            {typeLabel(p.type)}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(p)}>
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(p.id)}
                            disabled={deletingId === p.id}
                          >
                            {deletingId === p.id ? "Deleting…" : "Delete"}
                          </Button>
                        </div>
                      </div>
                      {p.content ? (
                        <pre className="mt-3 text-sm text-neutral-400 whitespace-pre-wrap font-sans">
                          {p.content.slice(0, 200)}
                          {p.content.length > 200 ? "…" : ""}
                        </pre>
                      ) : null}
                    </>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

/**
 * Mock coach: trainer-like structured output using phases + playbook bullets.
 * Selects 1–2 relevant bullets by phase; returns assistantReply, suggestedNextUserMessage,
 * oneThingToFix, drill, nextPhase, phaseRationale.
 */

import type { PlaybookType } from "./playbooks";

const DEFAULT_PHASES = [
  "opening",
  "discovery",
  "pitch",
  "objection",
  "close",
] as const;

function parsePhases(phasesJson: string | null): string[] {
  if (!phasesJson) return [...DEFAULT_PHASES];
  try {
    const arr = JSON.parse(phasesJson);
    return Array.isArray(arr) && arr.length > 0 ? arr.map(String) : [...DEFAULT_PHASES];
  } catch {
    return [...DEFAULT_PHASES];
  }
}

function getNextPhase(current: string | null, phases: string[]): string | null {
  if (!current) return phases[0] ?? null;
  const i = phases.indexOf(current);
  if (i < 0 || i >= phases.length - 1) return null;
  return phases[i + 1];
}

const PHASE_TO_PLAYBOOK_TYPE: Record<string, PlaybookType> = {
  opening: "opening_hooks",
  discovery: "discovery_questions",
  pitch: "objection_responses",
  objection: "objection_responses",
  close: "closing_next_steps",
};

function pickBullets(bullets: string[], count: number, seed: number): string[] {
  if (bullets.length === 0) return [];
  const idx = seed % bullets.length;
  const out: string[] = [bullets[idx]];
  if (count >= 2 && bullets.length > 1) {
    const idx2 = (seed + 1) % bullets.length;
    if (idx2 !== idx) out.push(bullets[idx2]);
  }
  return out;
}

export type PlaybooksByType = Record<PlaybookType, string[]>;

export type MockCoachInput = {
  currentPhase: string | null;
  phasesJson: string | null;
  playbooksByType: PlaybooksByType;
  userMessage: string;
  notesChunks?: { sourceTitle: string; content: string; score: number }[];
};

export type MockCoachOutput = {
  assistantReply: string;
  suggestedNextUserMessage: string;
  oneThingToFix: string;
  drill: string;
  nextPhase: string | null;
  phaseRationale: string | null;
};

const PROSPECT_REPLIES: Record<string, string> = {
  opening: "Hi, thanks for reaching out. What's this call about?",
  discovery: "We're looking to improve follow-ups. Our main pain is losing leads after the demo. What do you typically see?",
  pitch: "That sounds relevant. Can you walk me through how your solution would help? We're also a bit concerned about price.",
  objection: "I hear you. Our budget is tight this quarter—what would it take to get something we could start with?",
  close: "Okay, I'm open to trying it. What's the next step on your side?",
};

const SUGGESTED_NEXT: Record<string, string> = {
  opening: "Ask what their biggest challenge is right now.",
  discovery: "Ask: 'What would need to be true for this to become a priority?'",
  pitch: "Tie one feature to the pain they shared, then ask if that would help.",
  objection: "Acknowledge the concern, then reframe: 'If we could show X, would that change things?'",
  close: "Propose one concrete next step: 'Can we schedule a 15-min follow-up next Tuesday?'",
};

const ONE_THING_TO_FIX: Record<string, string> = {
  opening: "Try leading with one clear value prop before asking a question.",
  discovery: "Ask one more open question before moving to the pitch.",
  pitch: "Tie your next sentence directly to something they said.",
  objection: "Acknowledge their words first ('I hear you') before reframing.",
  close: "Name the exact next step instead of leaving it vague.",
};

const DRILL_TEMPLATES: Record<string, string> = {
  opening: "Practice opening with: state your one-sentence value prop, then ask one open question.",
  discovery: "Drill: Ask 3 discovery questions in a row without pitching. Then rate yourself.",
  pitch: "Roleplay: After they state a need, reply with only one feature tied to that need.",
  objection: "Drill: Say 'I hear you' + repeat their concern, then one reframe. Record and replay.",
  close: "Practice: End your next 3 roleplays with 'So the next step is [concrete action].'",
};

const PHASE_RATIONALE: Record<string, string> = {
  opening: "We're in the opening; prospect is sizing you up.",
  discovery: "Discovery phase; they're sharing context.",
  pitch: "Pitch phase; time to tie solution to needs.",
  objection: "They raised an objection; acknowledge then reframe.",
  close: "Closing; lock in a clear next step.",
};

function buildNotesSuffix(notesChunks: MockCoachInput["notesChunks"]): string {
  if (!notesChunks?.length) return "";
  const relevant = notesChunks.filter((c) => c.score > 0);
  if (relevant.length === 0) return "";
  const top = relevant[0];
  const snippet = top.content.slice(0, 80).trim() + (top.content.length > 80 ? "…" : "");
  return ` [From your notes: ${snippet}]`;
}

export function mockCoachReply(input: MockCoachInput): MockCoachOutput {
  const phases = parsePhases(input.phasesJson);
  const phase = input.currentPhase && phases.includes(input.currentPhase)
    ? input.currentPhase
    : phases[0] ?? "opening";
  const nextPhase = getNextPhase(phase, phases);
  const playbookType = PHASE_TO_PLAYBOOK_TYPE[phase] ?? "opening_hooks";
  const bullets = input.playbooksByType[playbookType] ?? [];
  const seed = input.userMessage.length + (input.currentPhase?.length ?? 0);
  const selectedBullets = pickBullets(bullets, 2, seed);

  const prospectLine = PROSPECT_REPLIES[phase] ?? "I'm following along. Tell me more.";
  const playbookSuffix = selectedBullets.length > 0
    ? ` [Your playbook: ${selectedBullets.join(" | ")}]`
    : "";
  const notesSuffix = buildNotesSuffix(input.notesChunks);
  const assistantReply = prospectLine + playbookSuffix + notesSuffix;

  const suggestedFromPlaybook = selectedBullets[0];
  const suggestedNextUserMessage =
    phase === "discovery" && suggestedFromPlaybook
      ? suggestedFromPlaybook.slice(0, 120) + (suggestedFromPlaybook.length > 120 ? "…" : "")
      : SUGGESTED_NEXT[phase] ?? "Ask one clear follow-up question.";

  const oneThingToFix = ONE_THING_TO_FIX[phase] ?? "Keep the conversation moving toward a clear next step.";
  const drill = DRILL_TEMPLATES[phase] ?? "Record yourself and rate the conversation.";
  const phaseRationale = PHASE_RATIONALE[phase] ?? null;

  return {
    assistantReply,
    suggestedNextUserMessage,
    oneThingToFix,
    drill,
    nextPhase,
    phaseRationale,
  };
}

/**
 * Playbook types and content parsing. Types are standardized for trainer-like coaching.
 */

export const PLAYBOOK_TYPES = [
  "opening_hooks",
  "discovery_questions",
  "objection_responses",
  "closing_next_steps",
] as const;

export type PlaybookType = (typeof PLAYBOOK_TYPES)[number];

/** Map legacy type values to standardized type (for migration). */
export function normalizePlaybookType(type: string): PlaybookType {
  const t = type.trim().toLowerCase();
  if (PLAYBOOK_TYPES.includes(t as PlaybookType)) return t as PlaybookType;
  if (t === "script" || t === "opening") return "opening_hooks";
  if (t === "framework" || t === "discovery") return "discovery_questions";
  if (t === "objection_library" || t === "objection") return "objection_responses";
  if (t === "close" || t === "closing") return "closing_next_steps";
  return "opening_hooks";
}

/** Parse playbook content as newline-separated bullets (trim, drop empty). */
export function parsePlaybookBullets(content: string): string[] {
  if (!content || typeof content !== "string") return [];
  return content
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Group parsed bullets by type. Input: playbooks from DB with type + content. */
export function groupBulletsByType(
  playbooks: { type: string; content: string }[]
): Record<PlaybookType, string[]> {
  const out: Record<PlaybookType, string[]> = {
    opening_hooks: [],
    discovery_questions: [],
    objection_responses: [],
    closing_next_steps: [],
  };
  for (const p of playbooks) {
    const type = normalizePlaybookType(p.type);
    out[type].push(...parsePlaybookBullets(p.content));
  }
  return out;
}

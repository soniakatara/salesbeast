/**
 * OpenAI-based rate: calls Chat Completions API for scores + feedback.
 * Returns null on any error or missing key; caller should fall back to mock.
 */

export type RateStructuredOutput = {
  scores: Record<string, number>;
  summary: string;
  actions: string[];
  weaknesses: string[];
  strengths: string[];
  suggestedRewrite: string;
  drill: string;
};

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const PHASES = ["opening", "discovery", "pitch", "objection", "close"];

function buildRatePrompt(transcript: string): string {
  return `You are a sales coach. Evaluate this sales conversation transcript.

Transcript:
---
${transcript.slice(0, 6000)}
---

Respond with a JSON object only (no markdown, no code block), with these exact keys:
- scores (object): Five keys exactly: opening, discovery, pitch, objection, close. Each value a number 0-100.
- summary (string): 1-2 sentences overall assessment.
- actions (array of strings): 2-4 specific improvements (e.g. "Add 2 open questions in discovery.").
- weaknesses (array of strings): 1-3 top weaknesses (short phrases).
- strengths (array of strings): 1-3 strengths (short phrases).
- suggestedRewrite (string): One example of a better "next message" the seller could have said (one sentence).
- drill (string): One concrete practice drill based on the weakest area (e.g. "Practice: Ask 5 discovery questions before mentioning your product.").

Output only valid JSON.`;
}

export async function openaiRateTranscript(transcript: string): Promise<RateStructuredOutput | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key?.trim()) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: buildRatePrompt(transcript) }],
        max_tokens: 800,
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("OpenAI rate API error:", res.status, err);
      return null;
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    const parsed = JSON.parse(content) as Record<string, unknown>;

    const scores: Record<string, number> = {};
    const rawScores = parsed.scores as Record<string, unknown> | undefined;
    if (rawScores && typeof rawScores === "object") {
      for (const p of PHASES) {
        const v = rawScores[p];
        scores[p] = typeof v === "number" && !Number.isNaN(v) ? Math.round(Math.max(0, Math.min(100, v))) : 50;
      }
    }
    if (Object.keys(scores).length !== 5) {
      for (const p of PHASES) if (scores[p] == null) scores[p] = 50;
    }

    const actions = Array.isArray(parsed.actions)
      ? (parsed.actions as unknown[]).map((a) => String(a))
      : [];
    const weaknesses = Array.isArray(parsed.weaknesses)
      ? (parsed.weaknesses as unknown[]).map((w) => String(w))
      : [];
    const strengths = Array.isArray(parsed.strengths)
      ? (parsed.strengths as unknown[]).map((s) => String(s))
      : [];

    return {
      scores,
      summary: String(parsed.summary ?? "").trim() || "Review the conversation.",
      actions,
      weaknesses,
      strengths,
      suggestedRewrite: String(parsed.suggestedRewrite ?? "").trim(),
      drill: String(parsed.drill ?? "").trim(),
    };
  } catch (e) {
    console.error("OpenAI rate error:", e);
    return null;
  }
}

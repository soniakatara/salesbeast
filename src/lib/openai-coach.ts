/**
 * OpenAI-based coach: calls Chat Completions API for structured coaching output.
 * Returns null on any error or missing key; caller should fall back to mock.
 */

export type CoachStructuredOutput = {
  assistantReply: string;
  suggestedNextUserMessage: string;
  oneThingToFix: string;
  drill: string;
  phaseRationale?: string | null;
  nextPhase?: string | null;
};

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

function buildCoachPrompt(context: {
  currentPhase: string | null;
  playbooksByType: Record<string, string[]>;
  recentMessages: { role: string; content: string }[];
  userMessage: string;
  notesChunks?: { sourceTitle: string; content: string; score: number }[];
}): string {
  const { currentPhase, playbooksByType, recentMessages, userMessage, notesChunks = [] } = context;
  const phase = currentPhase ?? "opening";
  const bullets: string[] = [];
  for (const [type, arr] of Object.entries(playbooksByType)) {
    if (arr.length) bullets.push(`${type}: ${arr.slice(0, 5).join(" | ")}`);
  }
  const playbookBlock = bullets.length ? `Playbook bullets (use where relevant):\n${bullets.join("\n")}` : "";
  const convo = recentMessages.slice(-6).map((m) => `${m.role}: ${m.content}`).join("\n");
  const relevantNotes =
    notesChunks.length > 0
      ? notesChunks.map((c) => `[${c.sourceTitle}]\n${c.content}`).join("\n\n---\n\n")
      : "";
  const notesBlock = relevantNotes
    ? `Relevant notes (user's gold knowledge—prioritize these over generic advice):\n${relevantNotes}`
    : "";

  return `You are a sales coach. The user is doing a roleplay: they play the seller, you play the prospect.

Current phase: ${phase}
${playbookBlock}
${notesBlock ? `\n${notesBlock}\n` : ""}
Recent conversation:
${convo || "(none yet)"}

Latest seller message: ${userMessage}

Respond with a JSON object only (no markdown, no code block), with these exact keys:
- assistantReply (string): Your next line as the prospect (1-3 sentences).
- suggestedNextUserMessage (string): One specific thing the seller could say next (e.g. a question or reframe).
- oneThingToFix (string): One concise coaching tip (e.g. "Ask one more open question before pitching.").
- drill (string): A short practice prompt they can do next (e.g. "Practice: End with one concrete next step.").
- phaseRationale (string, optional): One sentence on why we're in this phase.
- nextPhase (string, optional): The next phase if moving on: one of opening, discovery, pitch, objection, close.

Output only valid JSON.`;
}

export async function openaiCoachReply(context: {
  currentPhase: string | null;
  playbooksByType: Record<string, string[]>;
  recentMessages: { role: string; content: string }[];
  userMessage: string;
  notesChunks?: { sourceTitle: string; content: string; score: number }[];
}): Promise<CoachStructuredOutput | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key?.trim()) return null;

  const prompt = buildCoachPrompt(context);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 600,
        temperature: 0.6,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("OpenAI coach API error:", res.status, err);
      return null;
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    const parsed = JSON.parse(content) as Record<string, unknown>;
    return {
      assistantReply: String(parsed.assistantReply ?? "").trim() || "Tell me more.",
      suggestedNextUserMessage: String(parsed.suggestedNextUserMessage ?? "").trim(),
      oneThingToFix: String(parsed.oneThingToFix ?? "").trim(),
      drill: String(parsed.drill ?? "").trim(),
      phaseRationale: parsed.phaseRationale != null ? String(parsed.phaseRationale).trim() : null,
      nextPhase: parsed.nextPhase != null ? String(parsed.nextPhase).trim() : null,
    };
  } catch (e) {
    console.error("OpenAI coach error:", e);
    return null;
  }
}

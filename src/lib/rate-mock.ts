/**
 * Mock "rate my conversation" evaluator.
 * Deterministic heuristics: question count, objection keywords, next-step phrases, length.
 * No LLM.
 */

const PHASE_KEYS = ["opening", "discovery", "pitch", "objection", "close"] as const;

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function countQuestions(text: string): number {
  return (text.match(/\?/g) ?? []).length;
}

function countOccurrences(text: string, words: string[]): number {
  const t = normalize(text);
  return words.filter((w) => t.includes(w)).length;
}

export type RateResult = {
  scores: Record<string, number>;
  summary: string;
  actions: string[];
  practiceNext: string;
  weaknesses: string[];
  strengths: string[];
  suggestedRewrite: string;
  drill: string;
  primaryLeak: string | null;
  secondaryLeak: string | null;
  leakExplanation: string | null;
  leakEvidence: string[];
};

function extractSellerBlocks(transcript: string): string[] {
  const lines = transcript.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const blocks: string[] = [];
  let current: string[] = [];
  const sellerPrefixes = /^(seller|salesperson|sales rep|rep|you|s):\s*/i;
  for (const line of lines) {
    if (sellerPrefixes.test(line)) {
      if (current.length) {
        blocks.push(current.join(" "));
        current = [];
      }
      current.push(line.replace(sellerPrefixes, "").trim());
    } else if (current.length && line) {
      current.push(line);
    }
  }
  if (current.length) blocks.push(current.join(" "));
  if (blocks.length === 0 && transcript.trim()) {
    return [transcript.trim()];
  }
  return blocks;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function computeLeakSignals(transcript: string): {
  frame: { score: number; evidence: string[] };
  leverage: { score: number; evidence: string[] };
  precision: { score: number; evidence: string[] };
} {
  const t = transcript.trim();
  const normalized = normalize(t);
  const wordCount = countWords(t);
  const sellerBlocks = extractSellerBlocks(t);
  const questionCount = countQuestions(t);
  const questionDensity = wordCount > 0 ? (questionCount / wordCount) * 100 : 0;

  const softWords = ["maybe", "just", "i think", "sort of", "kind of"];
  const nextStepPhrases = ["next step", "follow up", "schedule", "calendar", "send", "meeting", "call back", "let's do"];
  const timeBoundPhrases = ["next week", "tuesday", "wednesday", "thursday", "friday", "monday", "15 min", "tomorrow", "this week", "next month"];

  const softCount = softWords.reduce((sum, w) => sum + (normalized.split(w).length - 1), 0);
  const maxBlockWords = sellerBlocks.reduce((max, b) => Math.max(max, countWords(b)), 0);
  const hasLongMonologue = maxBlockWords > 120;

  const frameEvidence: string[] = [];
  let frameScore = 0;
  if (hasLongMonologue) {
    frameScore += 2;
    frameEvidence.push(`Seller block of ${maxBlockWords} words (over 120-word threshold)`);
  }
  if (softCount >= 2) {
    frameScore += 1 + Math.min(2, softCount - 2);
    frameEvidence.push(`${softCount} soft-language phrases detected (maybe, just, I think, sort of, kind of)`);
  }

  const hasNextStep = nextStepPhrases.some((p) => normalized.includes(p));
  const hasTimeBound = timeBoundPhrases.some((p) => normalized.includes(p));

  const leverageEvidence: string[] = [];
  let leverageScore = 0;
  if (!hasNextStep) {
    leverageScore += 2;
    leverageEvidence.push("No explicit next-step phrases found");
  }
  if (!hasTimeBound) {
    leverageScore += 1;
    leverageEvidence.push("No time-bound language (e.g. next week, 15 min) found");
  }

  const precisionEvidence: string[] = [];
  let precisionScore = 0;
  const questionThreshold = wordCount < 150 ? 1 : wordCount < 400 ? 2 : 3;
  if (questionCount < questionThreshold) {
    precisionScore += 2;
    precisionEvidence.push(`Only ${questionCount} question(s) in ${wordCount} words (threshold: ${questionThreshold})`);
  }
  if (questionDensity < 0.5 && wordCount > 100) {
    precisionScore += 1;
    precisionEvidence.push(`Low question density: ${questionDensity.toFixed(1)} per 100 words`);
  }

  return {
    frame: { score: frameScore, evidence: frameEvidence },
    leverage: { score: leverageScore, evidence: leverageEvidence },
    precision: { score: precisionScore, evidence: precisionEvidence },
  };
}

export function buildLeakDiagnostic(transcript: string): {
  primaryLeak: string | null;
  secondaryLeak: string | null;
  leakExplanation: string;
  leakEvidence: string[];
} {
  const signals = computeLeakSignals(transcript);
  const leakNames = { frame: "Frame" as const, leverage: "Leverage" as const, precision: "Precision" as const };
  const ranked = (["frame", "leverage", "precision"] as const)
    .map((k) => ({
      leak: leakNames[k],
      key: k,
      score: signals[k].score,
      evidence: signals[k].evidence,
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) {
    return {
      primaryLeak: null,
      secondaryLeak: null,
      leakExplanation: "No major Frame, Leverage, or Precision leaks detected. Conversation shows solid structure.",
      leakEvidence: [],
    };
  }

  const primary = ranked[0];
  const secondary = ranked[1] ?? null;
  const allEvidence = [...primary.evidence, ...(secondary?.evidence ?? [])];

  const explanations: string[] = [];
  if (primary.leak === "Frame") {
    explanations.push("Frame leak suggests authority or confidence may be softening—long monologues or hedging language reduce presence.");
  } else if (primary.leak === "Leverage") {
    explanations.push("Leverage leak indicates unclear commitment—without next steps or time-bound language, the prospect has no clear path forward.");
  } else {
    explanations.push("Precision leak points to insufficient discovery—too few questions limit understanding of the prospect's needs and priorities.");
  }
  if (secondary) {
    explanations.push(`${secondary.leak} also shows minor signals worth addressing in future conversations.`);
  }

  return {
    primaryLeak: primary.leak,
    secondaryLeak: secondary?.leak ?? null,
    leakExplanation: explanations.join(" "),
    leakEvidence: allEvidence,
  };
}

export function mockRateTranscript(transcript: string): RateResult {
  const t = transcript.trim();
  const normalized = normalize(t);
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  const questionCount = countQuestions(t);

  const objectionWords = ["price", "expensive", "budget", "cost", "too much", "cheaper", "discount", "afford"];
  const nextStepWords = ["next step", "follow up", "schedule", "calendar", "send", "meeting", "call back", "let's do"];
  const openingWords = ["hi", "hello", "thanks for", "good morning", "good afternoon", "hey"];
  const discoveryWords = ["tell me", "what's", "how do", "why", "when", "which", "who", "where"];

  const objectionScore = Math.min(100, 40 + countOccurrences(t, objectionWords) * 15);
  const nextStepScore = Math.min(100, 30 + countOccurrences(t, nextStepWords) * 12);
  const openingScore = Math.min(100, 35 + countOccurrences(t, openingWords) * 10);
  const discoveryScore = Math.min(100, 40 + questionCount * 4 + countOccurrences(t, discoveryWords) * 5);
  const pitchScore = Math.min(100, 50 + Math.min(20, Math.floor(wordCount / 50)));

  const scores: Record<string, number> = {
    opening: Math.round(openingScore),
    discovery: Math.round(discoveryScore),
    pitch: Math.round(pitchScore),
    objection: Math.round(objectionScore),
    close: Math.round(nextStepScore),
  };

  const avg = Math.round(
    (scores.opening + scores.discovery + scores.pitch + scores.objection + scores.close) / 5
  );

  const weakPhases = PHASE_KEYS.filter((k) => scores[k] < 60);
  const strongPhases = PHASE_KEYS.filter((k) => scores[k] >= 75);

  const weaknesses: string[] = weakPhases.map(
    (k) => `Need more in ${k}: ${k === "discovery" ? "ask more questions" : k === "close" ? "suggest a clear next step" : k === "objection" ? "address concerns explicitly" : "develop this phase"}.`
  );
  if (weaknesses.length === 0 && avg < 70) {
    weaknesses.push("Overall flow could be tighter; try one clear next step per conversation.");
  }

  const strengths: string[] = strongPhases.map(
    (k) => `${k.charAt(0).toUpperCase() + k.slice(1)} was strong.`
  );
  if (strengths.length === 0) {
    strengths.push("You covered multiple phases; focus on one or two to improve next.");
  }

  const actions: string[] = [];
  if (scores.discovery < 70) actions.push("Add 2–3 open questions in discovery.");
  if (scores.objection < 70) actions.push("Acknowledge price/objection and reframe with value.");
  if (scores.close < 70) actions.push("End with one concrete next step (e.g. calendar link or follow-up date).");
  if (wordCount < 100) actions.push("Practice longer roleplays to build depth.");
  if (actions.length === 0) actions.push("Keep structure; try varying your opening hook.");

  const summary =
    avg >= 75
      ? "Solid conversation with clear structure. Small tweaks will make it even stronger."
      : avg >= 60
        ? "Good base. Focus on the suggested improvements to score higher next time."
        : "Practice the drills below and re-run a similar conversation to see improvement.";

  const practiceNext =
    weakPhases.length > 0
      ? `Drill: ${weakPhases[0]} — ${weakPhases[0] === "discovery" ? "Ask 5 questions before pitching." : weakPhases[0] === "close" ? "End every practice with 'So the next step is…'." : "Roleplay this phase twice with a peer."}`
      : "Drill: Record yourself on a cold open and rate again.";

  const drill =
    weakPhases.length > 0
      ? weakPhases[0] === "discovery"
        ? "Practice: Ask 5 discovery questions in your next call before mentioning your product."
        : weakPhases[0] === "close"
          ? "Practice: End your next 3 conversations with one concrete next step (e.g. 'Can we schedule a 15-min follow-up Tuesday?')."
          : weakPhases[0] === "objection"
            ? "Practice: When they mention price or concern, say 'I hear you' then reframe with one benefit."
            : `Practice: Focus on ${weakPhases[0]}—roleplay that phase twice.`
      : practiceNext;

  const suggestedRewrite =
    scores.close < 70
      ? "So the next step is [concrete action, e.g. a 15-min call next week]. Does that work?"
      : scores.discovery < 70
        ? "What would need to be true for this to become a priority for you?"
        : scores.objection < 70
          ? "I hear you. If we could show [specific outcome], would that change how you see it?"
          : "Great—what's one thing you'd want to see before making a decision?";

  const leakDiagnostic = buildLeakDiagnostic(t);

  return {
    scores,
    summary,
    actions,
    practiceNext,
    weaknesses,
    strengths,
    suggestedRewrite,
    drill,
    primaryLeak: leakDiagnostic.primaryLeak,
    secondaryLeak: leakDiagnostic.secondaryLeak,
    leakExplanation: leakDiagnostic.leakExplanation,
    leakEvidence: leakDiagnostic.leakEvidence,
  };
}

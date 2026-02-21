/**
 * Coach logic: mock vs OpenAI.
 * If mode === "mock" or OPENAI_API_KEY is missing, returns deterministic placeholder.
 * Otherwise calls OpenAI for model reply.
 */

import { mockCoachReply } from "@/lib/coach-mock";
import { openaiCoachReply } from "@/lib/openai-coach";
import type { PlaybooksByType } from "@/lib/coach-mock";

export type CoachOutput = {
  assistantReply: string;
  suggestedNextUserMessage: string;
  oneThingToFix: string;
  drill: string;
  nextPhase: string | null;
  phaseRationale: string | null;
};

export type NotesChunk = {
  id: string;
  sourceTitle: string;
  content: string;
  score: number;
};

export type CoachInput = {
  mode: "mock" | "openai";
  currentPhase: string | null;
  phasesJson: string | null;
  playbooksByType: PlaybooksByType;
  userMessage: string;
  recentMessages: { role: string; content: string }[];
  notesChunks: NotesChunk[];
};

export async function getCoachReply(input: CoachInput): Promise<{
  output: CoachOutput;
  usedFallback?: boolean;
}> {
  const useOpenAI =
    input.mode === "openai" && !!process.env.OPENAI_API_KEY?.trim();

  if (useOpenAI) {
    const openaiResult = await openaiCoachReply({
      currentPhase: input.currentPhase,
      playbooksByType: input.playbooksByType,
      recentMessages: input.recentMessages,
      userMessage: input.userMessage,
      notesChunks: input.notesChunks,
    });
    if (openaiResult) {
      return {
        output: {
          assistantReply: openaiResult.assistantReply,
          suggestedNextUserMessage: openaiResult.suggestedNextUserMessage,
          oneThingToFix: openaiResult.oneThingToFix,
          drill: openaiResult.drill,
          nextPhase: openaiResult.nextPhase ?? null,
          phaseRationale: openaiResult.phaseRationale ?? null,
        },
      };
    }
    // Fallback to mock on OpenAI error or missing response
    const mockOut = mockCoachReply({
      currentPhase: input.currentPhase,
      phasesJson: input.phasesJson,
      playbooksByType: input.playbooksByType,
      userMessage: input.userMessage,
      notesChunks: input.notesChunks,
    });
    return {
      output: {
        assistantReply: mockOut.assistantReply,
        suggestedNextUserMessage: mockOut.suggestedNextUserMessage,
        oneThingToFix: mockOut.oneThingToFix,
        drill: mockOut.drill,
        nextPhase: mockOut.nextPhase,
        phaseRationale: mockOut.phaseRationale,
      },
      usedFallback: true,
    };
  }

  const mockOut = mockCoachReply({
    currentPhase: input.currentPhase,
    phasesJson: input.phasesJson,
    playbooksByType: input.playbooksByType,
    userMessage: input.userMessage,
    notesChunks: input.notesChunks,
  });
  return {
    output: {
      assistantReply: mockOut.assistantReply,
      suggestedNextUserMessage: mockOut.suggestedNextUserMessage,
      oneThingToFix: mockOut.oneThingToFix,
      drill: mockOut.drill,
      nextPhase: mockOut.nextPhase,
      phaseRationale: mockOut.phaseRationale,
    },
  };
}

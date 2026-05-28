import { anthropicProvider } from "./providers/anthropic";
import { openaiProvider } from "./providers/openai";
import type { AIProvider } from "./providers/types";

/**
 * Pick the AI provider at request time based on AI_PROVIDER env. Defaults to
 * Anthropic. The chosen provider must have its own API key configured —
 * generateText() returns { ok: false } cleanly when it does not.
 */
export function getAIProvider(): AIProvider {
  const pick = (process.env.AI_PROVIDER ?? "anthropic").toLowerCase();
  if (pick === "openai") return openaiProvider;
  return anthropicProvider;
}

export function getAIProviderByName(name: string): AIProvider {
  return name === "openai" ? openaiProvider : anthropicProvider;
}

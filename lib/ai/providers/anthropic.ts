import type { AIProvider, GenerateInput, GenerateResult } from "./types";

const ENDPOINT = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

export const anthropicProvider: AIProvider = {
  name: "anthropic",
  defaultModel: DEFAULT_MODEL,

  async generateText(input: GenerateInput): Promise<GenerateResult> {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return { ok: false, error: "ANTHROPIC_API_KEY missing" };
    const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: input.maxTokens ?? 1024,
          temperature: input.temperature ?? 0.7,
          system: input.system,
          messages: [{ role: "user", content: input.prompt }],
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return {
          ok: false,
          error: `Anthropic ${res.status}: ${text.slice(0, 200)}`,
        };
      }
      const json = (await res.json()) as {
        content?: Array<{ type: string; text?: string }>;
      };
      const text =
        json.content
          ?.filter((b) => b.type === "text" && typeof b.text === "string")
          .map((b) => b.text as string)
          .join("\n")
          .trim() ?? "";
      if (!text) return { ok: false, error: "Anthropic empty response" };
      return { ok: true, text, provider: "anthropic", model, raw: json };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "anthropic network error",
      };
    }
  },
};

import type { AIProvider, GenerateInput, GenerateResult } from "./types";

const ENDPOINT = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";

export const openaiProvider: AIProvider = {
  name: "openai",
  defaultModel: DEFAULT_MODEL,

  async generateText(input: GenerateInput): Promise<GenerateResult> {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return { ok: false, error: "OPENAI_API_KEY missing" };
    const model = process.env.OPENAI_MODEL ?? DEFAULT_MODEL;

    const messages: Array<{ role: "system" | "user"; content: string }> = [];
    if (input.system) messages.push({ role: "system", content: input.system });
    messages.push({ role: "user", content: input.prompt });

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: input.maxTokens ?? 1024,
          temperature: input.temperature ?? 0.7,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return {
          ok: false,
          error: `OpenAI ${res.status}: ${text.slice(0, 200)}`,
        };
      }
      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = json.choices?.[0]?.message?.content?.trim() ?? "";
      if (!text) return { ok: false, error: "OpenAI empty response" };
      return { ok: true, text, provider: "openai", model, raw: json };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "openai network error",
      };
    }
  },
};

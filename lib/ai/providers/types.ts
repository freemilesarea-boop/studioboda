export type GenerateInput = {
  system?: string;
  prompt: string;
  /** Hard ceiling on output tokens. Default 1024. */
  maxTokens?: number;
  /** 0..1 (0.7 default). */
  temperature?: number;
};

export type GenerateResult =
  | {
      ok: true;
      text: string;
      provider: string;
      model: string;
      raw?: unknown;
    }
  | { ok: false; error: string };

export interface AIProvider {
  readonly name: "openai" | "anthropic";
  readonly defaultModel: string;
  generateText(input: GenerateInput): Promise<GenerateResult>;
}

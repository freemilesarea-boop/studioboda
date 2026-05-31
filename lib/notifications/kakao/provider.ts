// ============================================================
// STUDIO BODA — Kakao Alimtalk provider abstraction
// ============================================================
// Channel-agnostic interface so a real provider (NHN Cloud / Solapi /
// Aligo / Kakao BizMessage) can be plugged in later without touching call
// sites. Until KAKAO_* env is configured, the default provider runs in
// dryRun mode: it logs the rendered message and returns ok without sending.
// ============================================================

export type KakaoSendInput = {
  toPhone: string;
  templateCode: string;
  variables: Record<string, string>;
  /** Fallback SMS text if Alimtalk can't be delivered (optional). */
  fallbackText?: string;
};

export type KakaoSendResult =
  | { ok: true; dryRun: boolean; providerMessageId?: string }
  | { ok: false; error: string };

export interface KakaoProvider {
  name: string;
  /** True when no real credentials are configured → dryRun only. */
  isDryRun(): boolean;
  send(input: KakaoSendInput): Promise<KakaoSendResult>;
}

function digits(phone: string): string {
  return (phone ?? "").replace(/[^0-9]/g, "");
}

// ---- Default (dryRun) provider -------------------------------------------
// Renders + logs the message. Returns ok with dryRun=true. Swap this out for
// a real HTTP implementation once KAKAO_PROVIDER credentials exist.
const dryRunProvider: KakaoProvider = {
  name: "dryrun",
  isDryRun: () => true,
  async send(input: KakaoSendInput): Promise<KakaoSendResult> {
    const phone = digits(input.toPhone);
    if (!phone) return { ok: false, error: "no phone" };
    // eslint-disable-next-line no-console
    console.log(
      "[kakao:dryRun]",
      JSON.stringify({
        to: phone.replace(/(\d{3})\d+(\d{4})/, "$1****$2"),
        templateCode: input.templateCode,
        variables: input.variables,
      }),
    );
    return { ok: true, dryRun: true };
  },
};

/**
 * Resolve the active Kakao provider. Real providers are selected by
 * KAKAO_PROVIDER env (e.g. "solapi", "nhncloud") once implemented; for now
 * everything falls back to the dryRun provider so the pipeline is exercised
 * end-to-end without sending.
 */
export function getKakaoProvider(): KakaoProvider {
  const configured = process.env.KAKAO_PROVIDER;
  // Future: switch (configured) { case "solapi": return solapiProvider; ... }
  void configured;
  return dryRunProvider;
}

/**
 * Thin convenience wrapper requested in the spec.
 * sendKakaoAlimtalk({ toPhone, templateCode, variables })
 */
export async function sendKakaoAlimtalk(
  input: KakaoSendInput,
): Promise<KakaoSendResult> {
  if (!digits(input.toPhone)) {
    return { ok: false, error: "no phone" };
  }
  return getKakaoProvider().send(input);
}

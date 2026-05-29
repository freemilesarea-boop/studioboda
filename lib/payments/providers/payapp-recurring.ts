// PayApp 자동결제 (recurring) helpers.
//
// Distinct from the one-shot link API in `payapp.ts`. PayApp's 자동결제 flow:
//   1. Server calls `cmd=payrequest` with `recu=y` → response includes a
//      hosted card-registration URL the customer opens to enter card details.
//   2. Customer completes registration → PayApp posts back to the common
//      notification URL (shared edge function) with the billing key (`recu_no`).
//   3. Each cycle, cron calls `cmd=recupay` with the billing key + amount.
//      PayApp synchronously returns success/failure for the charge.
//   4. Cancel binding via `cmd=recucancel`.
//
// Var routing in webhooks: registration uses var2="subreg:<sub_id>", charges
// use var2="subinv:<invoice_id>". The Vercel webhook handler reads var2 and
// dispatches to the appropriate path.

import { payappEnv } from "@/lib/env";

const PAYAPP_ENDPOINT = "https://api.payapp.kr/oapi/apiLoad.html";

function parseFormBody(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of text.split("&")) {
    if (!pair) continue;
    const idx = pair.indexOf("=");
    const k = idx === -1 ? pair : pair.slice(0, idx);
    const v = idx === -1 ? "" : pair.slice(idx + 1);
    out[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, " "));
  }
  return out;
}

export type CreateRegistrationInput = {
  subscriptionId: string;
  planName: string;
  monthlyAmount: number;
  buyerName?: string | null;
  buyerEmail?: string | null;
  buyerPhone: string;
  returnUrl: string;
};

export type CreateRegistrationResult =
  | {
      ok: true;
      registrationUrl: string;
      providerMulNo: string;
      raw: Record<string, string>;
    }
  | { ok: false; error: string; raw?: Record<string, string> };

/**
 * Issue a 자동결제 card-registration link the customer opens to enter card.
 * The registration cycle is tied to subscription via var2="subreg:<id>".
 */
export async function createRegistration(
  input: CreateRegistrationInput,
): Promise<CreateRegistrationResult> {
  let env;
  try {
    env = payappEnv();
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error
          ? `PayApp 환경변수 누락 (${e.message})`
          : "PayApp 환경변수 누락",
    };
  }

  const body = new URLSearchParams();
  body.set("cmd", "payrequest");
  body.set("userid", env.SHOP_ID);
  body.set("shop_user_id", `subreg-${input.subscriptionId}`);
  body.set("goodname", `${input.planName} 정기 구독`.slice(0, 100));
  body.set("price", String(Math.round(input.monthlyAmount)));
  body.set("recvphone", input.buyerPhone.replace(/[^0-9]/g, ""));
  if (input.buyerName) body.set("recvname", input.buyerName.slice(0, 60));
  if (input.buyerEmail) body.set("email", input.buyerEmail);
  body.set("returnurl", input.returnUrl);
  body.set("recu", "y"); // request 자동결제 binding (PayApp)
  body.set("var1", "studioboda");
  body.set("var2", `subreg:${input.subscriptionId}`);
  body.set("smsuse", "n");
  body.set("skip_cstpage", "y");

  try {
    const res = await fetch(PAYAPP_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/x-www-form-urlencoded, text/plain, */*",
      },
      body: body.toString(),
    });
    const text = await res.text();
    const parsed = parseFormBody(text);
    const state = parsed.state ?? parsed.STATE;
    if (state === "1" && parsed.payurl && parsed.mul_no) {
      return {
        ok: true,
        registrationUrl: parsed.payurl,
        providerMulNo: parsed.mul_no,
        raw: parsed,
      };
    }
    return {
      ok: false,
      error:
        parsed.errorMessage ||
        parsed.errormessage ||
        parsed.message ||
        `자동결제 등록 요청 실패 (state=${state ?? "?"})`,
      raw: parsed,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "PayApp 네트워크 오류",
    };
  }
}

export type ChargeInput = {
  invoiceId: string;
  subscriptionId: string;
  billingKey: string;
  amount: number;
  goodName: string;
};

export type ChargeResult =
  | { ok: true; providerMulNo: string; raw: Record<string, string> }
  | { ok: false; error: string; raw?: Record<string, string> };

/**
 * Synchronously charge an amount against a stored billing key. PayApp returns
 * success/failure immediately (the periodic webhook still arrives later).
 */
export async function chargeRecurring(input: ChargeInput): Promise<ChargeResult> {
  let env;
  try {
    env = payappEnv();
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error
          ? `PayApp 환경변수 누락 (${e.message})`
          : "PayApp 환경변수 누락",
    };
  }

  const body = new URLSearchParams();
  body.set("cmd", "recupay");
  body.set("userid", env.SHOP_ID);
  body.set("recu_no", input.billingKey);
  body.set("price", String(Math.round(input.amount)));
  body.set("goodname", input.goodName.slice(0, 100));
  body.set("shop_user_id", `subinv-${input.invoiceId}`);
  body.set("var1", "studioboda");
  body.set("var2", `subinv:${input.invoiceId}`);

  try {
    const res = await fetch(PAYAPP_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/x-www-form-urlencoded, text/plain, */*",
      },
      body: body.toString(),
    });
    const text = await res.text();
    const parsed = parseFormBody(text);
    const state = parsed.state ?? parsed.STATE;
    if (state === "1" && parsed.mul_no) {
      return { ok: true, providerMulNo: parsed.mul_no, raw: parsed };
    }
    return {
      ok: false,
      error:
        parsed.errorMessage ||
        parsed.errormessage ||
        parsed.message ||
        `자동결제 청구 실패 (state=${state ?? "?"})`,
      raw: parsed,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "PayApp 네트워크 오류",
    };
  }
}

export type CancelBindingResult = { ok: boolean; error?: string };

/** Release the billing key binding on PayApp's side. */
export async function cancelRecurringBinding(
  billingKey: string,
): Promise<CancelBindingResult> {
  let env;
  try {
    env = payappEnv();
  } catch {
    return { ok: false, error: "PayApp 환경변수 누락" };
  }
  const body = new URLSearchParams();
  body.set("cmd", "recucancel");
  body.set("userid", env.SHOP_ID);
  body.set("recu_no", billingKey);

  try {
    const res = await fetch(PAYAPP_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const text = await res.text();
    const parsed = parseFormBody(text);
    const state = parsed.state ?? parsed.STATE;
    if (state === "1") return { ok: true };
    return {
      ok: false,
      error:
        parsed.errorMessage ||
        parsed.errormessage ||
        parsed.message ||
        "자동결제 해지 실패",
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "자동결제 해지 네트워크 오류",
    };
  }
}

// =====================================================
// Webhook parsing helpers — the shared payapp-webhook edge function forwards
// every event to /api/payapp/webhook. The route reads var2 and dispatches.
// =====================================================

export type RecurringEventKind =
  | "registration_success"
  | "charge_success"
  | "charge_failed"
  | "binding_canceled"
  | "unknown";

export type RecurringEventDescriptor =
  | {
      kind: "registration";
      subscriptionId: string;
      billingKey: string | null;
      providerMulNo: string | null;
      eventStatus: "success" | "failed";
      reason: string | null;
    }
  | {
      kind: "invoice";
      invoiceId: string;
      providerMulNo: string | null;
      eventStatus: "success" | "failed";
      reason: string | null;
    }
  | { kind: "none" };

/**
 * Inspect a webhook body and decide if it is a 자동결제 event. var2 routes:
 *   subreg:<sub_id> → card-registration result (billing key in `recu_no`)
 *   subinv:<inv_id> → monthly charge result
 */
export function parseRecurringEvent(
  body: Record<string, string>,
): RecurringEventDescriptor {
  const var2 = body.var2 ?? body.VAR2 ?? "";
  if (!var2 || (!var2.startsWith("subreg:") && !var2.startsWith("subinv:"))) {
    return { kind: "none" };
  }
  // PayApp pay_state for one-shot is 4 = paid. Registration also uses 4 to
  // signal "successfully bound". Failures use 65/70 like normal payments.
  const state = body.pay_state ?? body.PAY_STATE ?? "";
  const success = state === "4";
  const failed = state === "65" || state === "70" || state === "64";
  const eventStatus: "success" | "failed" = success ? "success" : "failed";

  if (var2.startsWith("subreg:")) {
    return {
      kind: "registration",
      subscriptionId: var2.slice("subreg:".length),
      billingKey: body.recu_no ?? null,
      providerMulNo: body.mul_no ?? null,
      eventStatus,
      reason: failed
        ? body.errorMessage ?? body.errormessage ?? body.message ?? null
        : null,
    };
  }
  return {
    kind: "invoice",
    invoiceId: var2.slice("subinv:".length),
    providerMulNo: body.mul_no ?? null,
    eventStatus,
    reason: failed
      ? body.errorMessage ?? body.errormessage ?? body.message ?? null
      : null,
  };
}

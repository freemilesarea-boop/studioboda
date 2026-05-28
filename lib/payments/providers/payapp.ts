import { payappEnv } from "@/lib/env";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  WebhookEvent,
  WebhookStatus,
} from "./types";

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

// PayApp pay_state mapping (per PayApp docs):
//   4  결제 완료
//   9  매출 취소
//   64 결제 요청 만료
//   65 결제 거절
//   70 결제 실패
function stateToStatus(state: string | undefined): WebhookStatus {
  switch (state) {
    case "4":
      return "paid";
    case "9":
      return "cancelled";
    case "64":
    case "65":
    case "70":
      return "failed";
    default:
      return "unknown";
  }
}

export const payappProvider: PaymentProvider = {
  name: "payapp",

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    let env;
    try {
      env = payappEnv();
    } catch (e) {
      return {
        ok: false,
        error:
          e instanceof Error
            ? `PayApp 환경변수가 누락되었습니다 (${e.message})`
            : "PayApp 환경변수가 누락되었습니다",
      };
    }

    const body = new URLSearchParams();
    body.set("cmd", "payrequest");
    body.set("userid", env.SHOP_ID);
    body.set("shop_user_id", input.orderRef);
    body.set("goodname", input.goodName.slice(0, 100));
    body.set("price", String(Math.round(input.price)));
    body.set("recvphone", input.buyerPhone.replace(/[^0-9]/g, ""));
    if (input.buyerName) body.set("recvname", input.buyerName.slice(0, 60));
    if (input.buyerEmail) body.set("email", input.buyerEmail);
    body.set("returnurl", input.returnUrl);
    // Note: feedbackurl is intentionally NOT set per-request. The PayApp
    // merchant has a fixed common notification URL (Supabase Edge Function
    // `payapp-webhook`) shared with two other sites. That function reads
    // var1 and forwards STUDIO BODA payments to our Vercel webhook.
    body.set("var1", "studioboda");
    body.set("var2", input.orderRef);
    body.set("smsuse", "n");
    body.set("skip_cstpage", "y");
    body.set("checkretry", "y");

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
      if (state === "1" && parsed.mul_no && parsed.payurl) {
        return {
          ok: true,
          providerPaymentNo: parsed.mul_no,
          payUrl: parsed.payurl,
          qrUrl: parsed.qrurl,
          raw: parsed,
        };
      }
      return {
        ok: false,
        error:
          parsed.errorMessage ||
          parsed.errormessage ||
          parsed.message ||
          `PayApp 결제 요청 실패 (state=${state ?? "?"})`,
        raw: parsed,
      };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "PayApp 네트워크 오류",
      };
    }
  },

  verifyAndParseWebhook(body: Record<string, string>): WebhookEvent {
    let env;
    try {
      env = payappEnv();
    } catch {
      return {
        ok: false,
        paymentRef: null,
        providerPaymentNo: null,
        amount: null,
        status: "unknown",
        rawState: null,
        raw: body,
      };
    }
    const okSignature =
      body.linkval === env.LINKVAL &&
      (!body.linkkey || body.linkkey === env.LINKKEY);

    // var2 is our payment.id; var1 is the route marker ("studioboda").
    // shop_user_id is also our payment.id (PayApp echoes it back).
    const ref =
      body.var2 ||
      body.shop_user_id ||
      // legacy fallback for older outbound requests that used var1
      (body.var1 && body.var1 !== "studioboda" ? body.var1 : null) ||
      null;
    return {
      ok: okSignature,
      paymentRef: ref,
      providerPaymentNo: body.mul_no ?? null,
      amount: body.price ? Number(body.price) : null,
      status: stateToStatus(body.pay_state),
      rawState: body.pay_state ?? null,
      raw: body,
    };
  },

  async cancelPayment(providerPaymentNo, reason) {
    let env;
    try {
      env = payappEnv();
    } catch {
      return { ok: false, error: "PayApp 환경변수가 누락되었습니다" };
    }
    const body = new URLSearchParams();
    body.set("cmd", "paycancel");
    body.set("userid", env.SHOP_ID);
    body.set("mul_no", providerPaymentNo);
    if (reason) body.set("reason", reason.slice(0, 100));

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
          "결제 취소 실패",
      };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "결제 취소 네트워크 오류",
      };
    }
  },
};

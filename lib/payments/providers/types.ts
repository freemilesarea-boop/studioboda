// PG-agnostic interface. Concrete providers (PayApp, Toss, PortOne, Stripe…)
// implement this so the rest of the app can stay payment-provider-neutral.

export type CreatePaymentInput = {
  /** Our internal reference for the payment (e.g. payments.id) */
  orderRef: string;
  goodName: string;
  /** KRW (integer) */
  price: number;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone: string;
  returnUrl: string;
  feedbackUrl: string;
};

export type CreatePaymentResult =
  | {
      ok: true;
      providerPaymentNo: string;
      payUrl: string;
      qrUrl?: string;
      raw: Record<string, string>;
    }
  | { ok: false; error: string; raw?: Record<string, string> };

export type WebhookStatus =
  | "paid"
  | "failed"
  | "cancelled"
  | "pending"
  | "unknown";

export type WebhookEvent = {
  /** Whether the request was authenticated against our provider secrets */
  ok: boolean;
  /** Our reference (orderRef from createPayment) — should map to payments.id */
  paymentRef: string | null;
  providerPaymentNo: string | null;
  /** KRW (integer) reported by the provider, for amount-tampering checks */
  amount: number | null;
  status: WebhookStatus;
  rawState: string | null;
  raw: Record<string, string>;
};

export type CancelResult = { ok: boolean; error?: string };

export interface PaymentProvider {
  /** Stable name written to payments.metadata.provider */
  readonly name: string;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyAndParseWebhook(
    body: Record<string, string>,
    headers: Headers,
  ): WebhookEvent;
  cancelPayment?(
    providerPaymentNo: string,
    reason?: string,
  ): Promise<CancelResult>;
}

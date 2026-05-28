import { payappProvider } from "./providers/payapp";
import type { PaymentProvider } from "./providers/types";

// Single entry point. Add Toss / PortOne / Stripe here later by branching on
// settings.value->>'provider' or env.PROVIDER.
export function getPaymentProvider(): PaymentProvider {
  return payappProvider;
}

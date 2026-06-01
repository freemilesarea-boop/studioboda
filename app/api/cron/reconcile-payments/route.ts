import { NextRequest, NextResponse } from "next/server";
import { reconcilePendingPaymentsCore } from "@/lib/actions/payment-reconcile";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

// Safety-net cron: auto-reconcile any pending PayApp payment that the webhook
// may have missed. The edge function (v38) is the primary instant path; this
// guarantees eventual consistency with NO human action. Auth via CRON_SECRET.
function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  // Vercel Cron sends the secret as a Bearer token.
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

async function run(req: NextRequest) {
  if (!authorized(req)) {
    return new NextResponse("UNAUTHORIZED", { status: 401 });
  }
  const result = await reconcilePendingPaymentsCore();
  if (result.paid > 0) {
    await logActivity({
      entity_type: "payment",
      entity_id: null,
      action: "cron_reconcile_applied",
      metadata: { checked: result.checked, paid: result.paid },
    });
  }
  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), ...result });
}

export async function GET(req: NextRequest) {
  return run(req);
}
export async function POST(req: NextRequest) {
  return run(req);
}

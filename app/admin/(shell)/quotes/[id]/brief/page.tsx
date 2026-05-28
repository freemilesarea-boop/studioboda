import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { AdminCard } from "@/components/admin/Card";
import type { AIAsset, Quote } from "@/lib/types/db";
import { QuoteBriefClient } from "./QuoteBriefClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · 견적 AI 브리프",
  robots: { index: false, follow: false },
};

export default async function QuoteBriefPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = createAdminSupabase();
  const { data: quote } = await admin
    .from("quotes")
    .select("id,title,service_type,total_price")
    .eq("id", params.id)
    .maybeSingle();
  if (!quote) notFound();
  const q = quote as Pick<Quote, "id" | "title" | "service_type" | "total_price">;

  const { data: latestRow } = await admin
    .from("ai_assets")
    .select("*")
    .eq("quote_id", q.id)
    .eq("kind", "brief")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const latest = latestRow as AIAsset | null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-[12px] text-ink-50">
        <Link href={`/admin/quotes/${q.id}`} className="hover:text-iris">
          ← 견적으로
        </Link>
      </div>

      <div>
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-iris">
          견적 단계 AI 브리프
        </p>
        <h2 className="mt-1 font-display text-[22px] font-extrabold tracking-[-0.4px] text-ink-100">
          {q.title}
        </h2>
        <p className="mt-1 text-[12px] text-ink-50">
          {q.service_type ?? "—"}
          {q.total_price
            ? ` · 견적가 ${new Intl.NumberFormat("ko-KR").format(q.total_price)}원`
            : ""}
        </p>
      </div>

      <AdminCard title="브리프">
        <QuoteBriefClient
          quoteId={q.id}
          initialText={latest?.output ?? ""}
          initialMeta={
            latest
              ? {
                  provider: latest.provider ?? undefined,
                  model: latest.model ?? undefined,
                  createdAt: format(
                    new Date(latest.created_at),
                    "yyyy-MM-dd HH:mm",
                  ),
                }
              : undefined
          }
        />
      </AdminCard>
    </div>
  );
}

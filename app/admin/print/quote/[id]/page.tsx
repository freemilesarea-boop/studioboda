import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth";
import { PrintToolbar } from "./PrintToolbar";
import type { Quote, QuoteOption, Profile, Inquiry } from "@/lib/types/db";

export const metadata: Metadata = {
  title: "견적서 · STUDIO BODA",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

export default async function QuotePrintPage({
  params,
}: {
  params: { id: string };
}) {
  await requireStaff();
  const admin = createAdminSupabase();
  const { data: quote } = await admin
    .from("quotes")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!quote) notFound();
  const q = quote as Quote;

  let profile: Profile | null = null;
  let inquiry: Inquiry | null = null;
  if (q.user_id) {
    const { data } = await admin
      .from("profiles")
      .select("*")
      .eq("id", q.user_id)
      .maybeSingle();
    profile = (data ?? null) as Profile | null;
  }
  if (q.inquiry_id) {
    const { data } = await admin
      .from("inquiries")
      .select("*")
      .eq("id", q.inquiry_id)
      .maybeSingle();
    inquiry = (data ?? null) as Inquiry | null;
  }

  const customerName =
    profile?.company_name ||
    profile?.name ||
    inquiry?.company ||
    inquiry?.name ||
    "—";
  const customerCompany =
    profile?.account_type === "business" ? profile.company_name : null;
  const customerEmail = profile?.email || inquiry?.email || "—";
  const customerPhone =
    profile?.contact_phone || profile?.phone || inquiry?.phone || "—";

  const options = (q.options as QuoteOption[]) ?? [];
  const depositRate = q.deposit_rate ?? 10;
  const deposit =
    q.deposit_amount ?? Math.round((q.total_price * depositRate) / 100);
  const balance = q.balance_amount ?? q.total_price - deposit;

  return (
    <div className="bg-ink-5 print:bg-white">
      <style>{`
        @media print {
          @page { size: A4; margin: 18mm 14mm; }
          body { background: #ffffff !important; }
          .no-print { display: none !important; }
          .print-page { box-shadow: none !important; border: none !important; padding: 0 !important; }
        }
        @media screen {
          .print-page { box-shadow: 0 24px 60px -32px rgba(10,10,18,0.18); }
        }
      `}</style>

      <PrintToolbar quoteId={q.id} />

      <main className="mx-auto max-w-[820px] px-6 py-10 lg:px-12">
        <article className="print-page rounded-2xl border border-ink-15 bg-white p-10">
          <header className="flex items-start justify-between gap-6 border-b border-ink-100 pb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-md bg-iris">
                  <span className="font-display text-[12px] font-bold text-white">
                    B
                  </span>
                </span>
                <div>
                  <p className="font-display text-[14px] font-extrabold tracking-tight text-ink-100">
                    STUDIO BODA · 스튜디오 보다
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-50">
                    AI · CREATIVE · STUDIO
                  </p>
                </div>
              </div>
              <p className="mt-4 text-[11px] text-ink-50">
                Seoul, KR · hello@studioboda.kr
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.12em] text-iris">
                Quotation
              </p>
              <p className="mt-1 font-display text-[24px] font-extrabold tracking-[-0.04em] text-ink-100">
                견적서
              </p>
              <p className="mt-1 font-mono text-[10px] text-ink-50">
                ID · {q.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </header>

          <section className="mt-7 grid grid-cols-2 gap-6 text-[12.5px]">
            <div>
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.12em] text-ink-50">
                고객 정보
              </p>
              <p className="mt-2 font-display text-[14px] font-bold text-ink-100">
                {customerName}
              </p>
              {customerCompany && customerCompany !== customerName ? (
                <p className="text-[12px] text-ink-70">{customerCompany}</p>
              ) : null}
              <p className="mt-1 text-[12px] text-ink-70">{customerEmail}</p>
              <p className="text-[12px] text-ink-70">{customerPhone}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.12em] text-ink-50">
                발행일
              </p>
              <p className="mt-2 text-[12.5px] text-ink-100">
                {format(new Date(q.created_at), "yyyy년 MM월 dd일")}
              </p>
              {q.expires_at ? (
                <>
                  <p className="mt-3 font-display text-[10px] font-bold uppercase tracking-[0.12em] text-ink-50">
                    유효기간
                  </p>
                  <p className="mt-1 text-[12.5px] text-ink-100">
                    ~ {format(new Date(q.expires_at), "yyyy년 MM월 dd일")}
                  </p>
                </>
              ) : null}
              <p className="mt-3 font-display text-[10px] font-bold uppercase tracking-[0.12em] text-ink-50">
                납기
              </p>
              <p className="mt-1 text-[12.5px] text-ink-100">
                {q.delivery_days}일 (영업일 기준)
              </p>
            </div>
          </section>

          <section className="mt-8">
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.12em] text-iris">
              Project
            </p>
            <h2 className="mt-1.5 font-display text-[22px] font-extrabold tracking-[-0.03em] text-ink-100">
              {q.title}
            </h2>
            {q.service_type ? (
              <p className="mt-1 text-[12.5px] text-ink-70">
                서비스 · {q.service_type}
              </p>
            ) : null}
          </section>

          <section className="mt-7">
            <table className="w-full border-t border-b border-ink-100 text-[13px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.12em] text-ink-50">
                  <th className="py-2.5 pr-4 text-left">항목</th>
                  <th className="py-2.5 text-right">금액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-15">
                <tr>
                  <td className="py-3 pr-4 text-ink-100">기본 금액</td>
                  <td className="num py-3 text-right text-ink-100">
                    {fmt(q.base_price)}원
                  </td>
                </tr>
                {options.map((o, i) => (
                  <tr key={i}>
                    <td className="py-3 pr-4 text-ink-70">
                      옵션 · {o.label}
                    </td>
                    <td className="num py-3 text-right text-ink-100">
                      +{fmt(o.price)}원
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-ink-100 font-display">
                  <td className="py-4 pr-4 text-[14px] font-bold text-ink-100">
                    합계 (VAT 별도)
                  </td>
                  <td className="num py-4 text-right text-[22px] font-extrabold text-ink-100">
                    {fmt(q.total_price)}원
                  </td>
                </tr>
              </tfoot>
            </table>
          </section>

          <section className="mt-7 grid grid-cols-2 gap-4 rounded-2xl border border-ink-15 bg-ink-5 p-5">
            <div>
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.12em] text-ink-50">
                예약금 ({depositRate}%)
              </p>
              <p className="num mt-1.5 font-display text-[20px] font-extrabold tracking-tightish text-iris">
                {fmt(deposit)}원
              </p>
              <p className="mt-1 text-[11px] text-ink-50">
                착수 전 예약금 입금
              </p>
            </div>
            <div>
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.12em] text-ink-50">
                잔금
              </p>
              <p className="num mt-1.5 font-display text-[20px] font-extrabold tracking-tightish text-ink-100">
                {fmt(balance)}원
              </p>
              <p className="mt-1 text-[11px] text-ink-50">
                최종 검수 후 본결제
              </p>
            </div>
          </section>

          {q.notes ? (
            <section className="mt-7">
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.12em] text-ink-50">
                메모
              </p>
              <p className="mt-2 whitespace-pre-wrap text-[12.5px] leading-[1.7] text-ink-70">
                {q.notes}
              </p>
            </section>
          ) : null}

          <section className="mt-8 border-t border-ink-15 pt-6 text-[11.5px] leading-[1.7] text-ink-70">
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.12em] text-ink-50">
              약관 요약
            </p>
            <ul className="mt-2 space-y-1.5 pl-4 [list-style:disc]">
              <li>모든 금액은 VAT 별도이며, 예약금 입금일을 작업 착수일로 합니다.</li>
              <li>본 견적서는 발행일 기준 {q.expires_at ? "유효기간 표기일" : "30일"}까지 유효합니다.</li>
              <li>패키지별로 기본 2~3회의 디렉팅 수정이 포함되며, 추가 수정은 별도 비용이 발생합니다.</li>
              <li>최종 산출물의 저작재산권은 잔금 입금 완료 시점에 고객에게 양도됩니다.</li>
              <li>전체 이용약관은 <span className="underline">studioboda.vercel.app/legal/terms</span> 에서 확인하실 수 있습니다.</li>
            </ul>
          </section>

          <footer className="mt-10 flex items-end justify-between border-t border-ink-100 pt-6 text-[11px] text-ink-50">
            <p>© 2026 STUDIO BODA · 스튜디오 보다</p>
            <p className="font-mono text-[10px]">
              Quote · {q.id} · {format(new Date(q.created_at), "yyyyMMdd")}
            </p>
          </footer>
        </article>
      </main>
    </div>
  );
}

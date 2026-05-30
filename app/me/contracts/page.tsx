import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { getProfile } from "@/lib/auth";
import { listMyContracts } from "@/lib/queries/contracts";
import { contractStatusLabels, type ContractStatus } from "@/lib/types/db";

export const metadata: Metadata = {
  title: "계약서",
  robots: { index: false, follow: false },
};

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

const TONE: Record<ContractStatus, string> = {
  draft: "bg-ink-15 text-ink-70",
  sent: "bg-iris/15 text-iris",
  viewed: "bg-warning/15 text-warning",
  signed: "bg-success/15 text-success",
  expired: "bg-ink-5 text-ink-70",
  cancelled: "bg-ink-5 text-ink-70",
};

export default async function MyContractsPage() {
  const me = await getProfile();
  if (!me) return null;
  const contracts = await listMyContracts(me.id);

  return (
    <div className="space-y-5">
      <header>
        <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-iris">
          Contracts
        </p>
        <h1 className="mt-1 font-display text-[22px] font-extrabold tracking-tightish text-ink-100">
          전자 계약서
          <span className="num ml-1.5 text-[13px] font-bold text-ink-50">
            {contracts.length}
          </span>
        </h1>
        <p className="mt-1 text-[12px] text-ink-50">
          발송된 계약서를 검토하고 전자서명할 수 있습니다.
        </p>
      </header>

      {contracts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-15 bg-white px-5 py-12 text-center">
          <i className="ti ti-file-text text-[26px] text-ink-30" aria-hidden />
          <p className="mt-2 text-[12.5px] text-ink-50">
            아직 발송된 계약서가 없습니다.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {contracts.map((c) => (
            <li key={c.id}>
              <Link
                href={`/me/contracts/${c.id}`}
                className="block rounded-2xl border border-ink-15 bg-white px-4 py-4 transition-colors hover:border-ink-30 sm:px-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-caption ${TONE[c.status]}`}
                      >
                        {contractStatusLabels[c.status]}
                      </span>
                      <span className="font-mono text-[10px] text-ink-50">
                        {c.contract_number}
                      </span>
                    </div>
                    <p className="mt-2 font-display text-[14px] font-bold text-ink-100">
                      {c.title}
                    </p>
                    <p className="mt-1 text-[11px] text-ink-50">
                      발행 {format(new Date(c.created_at), "yyyy-MM-dd")}
                      {c.signed_at
                        ? ` · 서명 ${format(new Date(c.signed_at), "yyyy-MM-dd")}`
                        : ""}
                    </p>
                  </div>
                  <p className="num font-display text-[18px] font-extrabold tracking-tightish text-ink-100">
                    {fmt(c.amount)}원
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

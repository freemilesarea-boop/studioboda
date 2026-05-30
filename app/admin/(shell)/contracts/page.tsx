import Link from "next/link";
import { format } from "date-fns";
import { requireStaff } from "@/lib/auth";
import { adminListContracts } from "@/lib/queries/contracts";
import { AdminCard, EmptyState } from "@/components/admin/Card";
import { contractStatusLabels, type ContractStatus } from "@/lib/types/db";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · Contracts",
  robots: { index: false, follow: false },
};

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);
const STATUSES: (ContractStatus | "all")[] = [
  "all",
  "draft",
  "sent",
  "viewed",
  "signed",
  "cancelled",
];
const TONE: Record<ContractStatus, string> = {
  draft: "bg-ink-15 text-ink-70",
  sent: "bg-iris/15 text-iris",
  viewed: "bg-warning/15 text-warning",
  signed: "bg-success/15 text-success",
  expired: "bg-ink-5 text-ink-70",
  cancelled: "bg-ink-5 text-ink-70",
};

export default async function AdminContractsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  await requireStaff();
  const status = (
    STATUSES.includes(searchParams.status as ContractStatus | "all")
      ? searchParams.status
      : "all"
  ) as ContractStatus | "all";
  const contracts = await adminListContracts({ status });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-[20px] font-extrabold tracking-tightish text-ink-100">
          전자 계약서
        </h1>
        <p className="mt-1 text-[12.5px] text-ink-50">
          견적에서 계약서를 생성하고, 발송 · 서명 · 완료까지 관리합니다.
        </p>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/admin/contracts" : `/admin/contracts?status=${s}`}
            className={`rounded-lg px-3 py-1.5 font-display text-[12px] font-bold ${
              status === s
                ? "bg-ink-100 text-white"
                : "border border-ink-15 bg-white text-ink-70 hover:border-ink-30"
            }`}
          >
            {s === "all" ? "전체" : contractStatusLabels[s]}
          </Link>
        ))}
      </div>

      <AdminCard>
        {contracts.length === 0 ? (
          <EmptyState
            title="계약서가 없습니다"
            description="견적 상세 화면에서 '계약서 생성'으로 만들 수 있습니다."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-ink-15 text-[10px] uppercase tracking-caption text-ink-50">
                  <th className="py-2.5 pr-4">계약번호</th>
                  <th className="py-2.5 pr-4">제목</th>
                  <th className="py-2.5 pr-4">고객</th>
                  <th className="py-2.5 pr-4 text-right">금액</th>
                  <th className="py-2.5 pr-4">상태</th>
                  <th className="py-2.5">생성일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-15">
                {contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-ink-5/60">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/contracts/${c.id}`}
                        className="font-mono text-[11px] text-iris hover:underline"
                      >
                        {c.contract_number}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 font-medium text-ink-100">{c.title}</td>
                    <td className="py-3 pr-4 text-ink-70">
                      {c.client_name ?? c.client_email ?? "—"}
                    </td>
                    <td className="num py-3 pr-4 text-right text-ink-100">
                      {fmt(c.amount)}원
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-caption ${TONE[c.status]}`}
                      >
                        {contractStatusLabels[c.status]}
                      </span>
                    </td>
                    <td className="py-3 text-ink-50">
                      {format(new Date(c.created_at), "yyyy-MM-dd")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}

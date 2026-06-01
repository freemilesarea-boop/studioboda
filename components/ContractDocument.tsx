import { format } from "date-fns";
import { company } from "@/lib/company";
import { contractStatusLabels, type Contract } from "@/lib/types/db";

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

export type ContractParty = {
  name: string;
  company?: string | null;
  email?: string | null;
};

/**
 * Printable A4 contract document. Pure presentational — shared by the admin
 * and customer print routes. Renders both signature blocks (image or pending).
 */
export function ContractDocument({
  contract: c,
  client,
}: {
  contract: Contract;
  client: ContractParty;
}) {
  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 18mm 14mm; }
          body { background: #ffffff !important; }
          .no-print { display: none !important; }
          .print-page { box-shadow: none !important; border: none !important; padding: 0 !important; }
        }
        @media screen { .print-page { box-shadow: 0 24px 60px -32px rgba(10,10,18,0.18); } }
      `}</style>

      <main className="mx-auto max-w-[820px] px-6 py-10 lg:px-12">
        <article className="print-page rounded-2xl border border-ink-15 bg-white p-10">
          <header className="flex items-start justify-between gap-6 border-b border-ink-100 pb-6">
            <div>
              <p className="font-display text-[14px] font-extrabold tracking-tight text-ink-100">
                STUDIO BODA · 스튜디오 보다
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-50">
                {company.locationShort} · {company.email}
              </p>
              {company.businessRegistrationNumber ? (
                <p className="mt-0.5 text-[11px] text-ink-50">
                  사업자등록번호 {company.businessRegistrationNumber}
                  {company.representativeName ? ` · 대표 ${company.representativeName}` : ""}
                </p>
              ) : null}
            </div>
            <div className="text-right">
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.12em] text-iris">
                Contract
              </p>
              <p className="mt-1 font-display text-[24px] font-extrabold tracking-[-0.04em] text-ink-100">
                계약서
              </p>
              <p className="mt-1 font-mono text-[10px] text-ink-50">
                NO · {c.contract_number}
              </p>
              <p className="mt-1 text-[10px] text-ink-50">
                상태 · {contractStatusLabels[c.status]} (v{c.current_version})
              </p>
            </div>
          </header>

          <section className="mt-7 grid grid-cols-2 gap-6 text-[12.5px]">
            <div>
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.12em] text-ink-50">
갑 (회사)
              </p>
              <p className="mt-2 font-display text-[14px] font-bold text-ink-100">
                {company.name}
              </p>
              <p className="text-[12px] text-ink-70">{company.email}</p>
            </div>
            <div>
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.12em] text-ink-50">
을 (고객)
              </p>
              <p className="mt-2 font-display text-[14px] font-bold text-ink-100">
                {client.name || "—"}
              </p>
              {client.company && client.company !== client.name ? (
                <p className="text-[12px] text-ink-70">{client.company}</p>
              ) : null}
              <p className="text-[12px] text-ink-70">{client.email || "—"}</p>
            </div>
          </section>

          <section className="mt-8">
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.12em] text-iris">
              용역계약서
            </p>
            <h2 className="mt-1 font-display text-[18px] font-extrabold tracking-[-0.02em] text-ink-100">
              {c.title}
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-4 rounded-xl border border-ink-15 bg-ink-5 p-4 text-[12.5px]">
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-ink-50">계약 금액</p>
                <p className="num mt-1 font-display text-[18px] font-extrabold text-iris">
                  {fmt(c.amount)}원 <span className="text-[11px] text-ink-50">(VAT 별도)</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-ink-50">계약 체결일</p>
                <p className="mt-1 text-[13px] text-ink-100">
                  {c.signed_at
                    ? format(new Date(c.signed_at), "yyyy년 MM월 dd일")
                    : "서명 시 자동 기록"}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-7">
            <p className="whitespace-pre-wrap text-[12.5px] leading-[1.85] text-ink-70">
              {c.body}
            </p>
          </section>

          <section className="mt-10 grid grid-cols-2 gap-6 border-t border-ink-15 pt-6">
            <SignatureBlock
              role="회사 (갑)"
              name={company.name}
              signature={c.admin_signature}
              signedAt={c.admin_signed_at}
            />
            <SignatureBlock
              role="고객 (을)"
              name={client.name}
              signature={c.client_signature}
              signedAt={c.signed_at}
            />
          </section>

          <footer className="mt-10 flex items-end justify-between border-t border-ink-100 pt-6 text-[11px] text-ink-50">
            <p>© 2026 STUDIO BODA · 스튜디오 보다</p>
            <p className="font-mono text-[10px]">
              {c.contract_number} · {format(new Date(c.created_at), "yyyyMMdd")}
            </p>
          </footer>
        </article>
      </main>
    </>
  );
}

function SignatureBlock({
  role,
  name,
  signature,
  signedAt,
}: {
  role: string;
  name: string;
  signature: string | null;
  signedAt: string | null;
}) {
  return (
    <div>
      <p className="font-display text-[10px] font-bold uppercase tracking-[0.12em] text-ink-50">
        {role}
      </p>
      <div className="mt-2 flex h-[90px] items-center justify-center rounded-lg border border-ink-15 bg-white">
        {signature ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={signature} alt="서명" className="max-h-[80px] object-contain" />
        ) : (
          <span className="text-[11px] text-ink-30">서명 대기</span>
        )}
      </div>
      <p className="mt-2 text-[12px] font-bold text-ink-100">{name}</p>
      <p className="text-[10.5px] text-ink-50">
        {signedAt ? format(new Date(signedAt), "yyyy-MM-dd HH:mm") : "—"}
      </p>
    </div>
  );
}

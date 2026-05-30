import { requireStaff } from "@/lib/auth";
import { adminListClauseBlocks } from "@/lib/queries/contract-clauses";
import { ClauseAdmin } from "./ClauseAdmin";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · 계약 조항 블록",
  robots: { index: false, follow: false },
};

export default async function ContractClausesPage() {
  await requireStaff();
  const { builtin, custom, overriddenKeys } = await adminListClauseBlocks();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-[20px] font-extrabold tracking-tightish text-ink-100">
          계약 조항 블록 (Template Engine)
        </h1>
        <p className="mt-1 text-[12.5px] text-ink-50">
          계약서는 공통 + 서비스별 + 견적별 조항 블록으로 조립됩니다. 새 서비스가
          생겨도 코드 수정 없이 여기에서 조항 블록만 추가하면 됩니다. 같은 key로
          저장하면 기본 조항을 덮어쓰거나 비활성화할 수 있습니다.
        </p>
      </header>

      <ClauseAdmin
        builtin={builtin}
        custom={custom}
        overriddenKeys={overriddenKeys}
      />
    </div>
  );
}

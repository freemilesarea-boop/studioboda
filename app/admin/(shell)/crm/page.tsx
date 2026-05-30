import { requireStaff } from "@/lib/auth";
import { listLeads } from "@/lib/queries/crm";
import { CrmBoard } from "./CrmBoard";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · CRM",
  robots: { index: false, follow: false },
};

export default async function CrmPage() {
  await requireStaff();
  const leads = await listLeads();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-[20px] font-extrabold tracking-tightish text-ink-100">
          영업 파이프라인 · CRM
        </h1>
        <p className="mt-1 text-[12.5px] text-ink-50">
          카드를 드래그하여 단계를 이동하세요. 모든 이동은 활동 로그에 기록됩니다.
        </p>
      </header>
      <CrmBoard initial={leads} />
    </div>
  );
}

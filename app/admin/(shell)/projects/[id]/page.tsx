import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { AdminCard } from "@/components/admin/Card";
import {
  ProjectStatusBadge,
  PriorityBadge,
  billingStatusToneClass,
} from "@/components/admin/Badge";
import {
  billingStatusLabels,
  projectStatusLabels,
  type BrandProfile,
  type Payment,
  type Profile,
  type Project,
  type ProjectBrief,
  type ProjectComment,
  type ProjectDeliverable,
  type ProjectFile,
  type Quote,
  type RevisionRequest,
} from "@/lib/types/db";
import { ProjectControls } from "./ProjectControls";
import { CommentForm } from "./CommentForm";
import { CommentsList } from "./CommentsList";
import { FilesPanel } from "./FilesPanel";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { AIToolsPanel } from "./AIToolsPanel";
import { AIAssetsList } from "./AIAssetsList";
import { KickoffOverride } from "./KickoffOverride";
import { RevisionsAdmin } from "./RevisionsAdmin";
import { DeliverablesAdmin } from "./DeliverablesAdmin";
import { kickoffReadinessForQuote } from "@/lib/projects/kickoff";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · 프로젝트 워크스페이스",
  robots: { index: false, follow: false },
};

const fmtKRW = (n: number | null | undefined) =>
  n == null ? "—" : `${new Intl.NumberFormat("ko-KR").format(n)}원`;

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = createAdminSupabase();
  const { data: project } = await admin
    .from("projects")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!project) notFound();
  const p = project as Project;

  const [
    { data: files },
    { data: comments },
    { data: staff },
    { data: quoteRow },
    { data: payments },
    { data: brand },
    { data: briefRow },
    { data: revisionRows },
    { data: deliverableRows },
  ] = await Promise.all([
    admin
      .from("project_files")
      .select("*")
      .eq("project_id", p.id)
      .order("created_at", { ascending: false }),
    admin
      .from("project_comments")
      .select("*")
      .eq("project_id", p.id)
      .order("created_at", { ascending: false }),
    admin
      .from("profiles")
      .select("*")
      .in("role", ["admin", "manager", "designer"]),
    p.quote_id
      ? admin
          .from("quotes")
          .select(
            "id,title,total_price,deposit_amount,balance_amount,payment_status,status,expires_at",
          )
          .eq("id", p.quote_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from("payments")
      .select("id,type,amount,status,paid_at,created_at")
      .eq("project_id", p.id)
      .order("created_at", { ascending: false })
      .limit(8),
    p.user_id
      ? admin
          .from("brand_profiles")
          .select("*")
          .eq("user_id", p.user_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    admin.from("project_briefs").select("*").eq("project_id", p.id).maybeSingle(),
    admin
      .from("revision_requests")
      .select("*")
      .eq("project_id", p.id)
      .order("created_at", { ascending: false }),
    admin
      .from("project_deliverables")
      .select("*")
      .eq("project_id", p.id)
      .order("version", { ascending: false }),
  ]);

  const team = (staff ?? []) as Profile[];
  const quote = quoteRow as
    | (Pick<
        Quote,
        | "id"
        | "title"
        | "total_price"
        | "deposit_amount"
        | "balance_amount"
        | "payment_status"
        | "status"
        | "expires_at"
      >)
    | null;
  const paymentRows = (payments ?? []) as Pick<
    Payment,
    "id" | "type" | "amount" | "status" | "paid_at" | "created_at"
  >[];
  const brandRow = brand as BrandProfile | null;
  const brief = briefRow as ProjectBrief | null;
  const revisions = (revisionRows ?? []) as RevisionRequest[];
  const deliverables = (deliverableRows ?? []) as ProjectDeliverable[];
  const openRevisions = revisions.filter((r) => r.status !== "done").length;

  // Kickoff gate readiness (계약서 서명 + 예약금 결제) for the status checklist.
  const kickoff = p.quote_id
    ? await kickoffReadinessForQuote(p.quote_id)
    : null;
  const contractSigned = kickoff?.contractSigned ?? false;
  const depositPaid = kickoff?.depositPaid ?? false;
  const contractSent = Boolean(
    quote || paymentRows.length > 0 || contractSigned,
  );
  const inProgress = !["queued"].includes(p.status) && p.billing_status === "in_progress";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-[12px] text-ink-50">
        <Link href="/admin/projects" className="hover:text-iris">
          ← 프로젝트 목록
        </Link>
        <span className="text-ink-30">·</span>
        <span className="font-mono text-[11px]">{p.project_no}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[22px] font-extrabold tracking-[-0.4px] text-ink-100">
            {p.title}
          </h2>
          <p className="mt-1 text-[12px] text-ink-50">
            {p.client_name}
            {p.company ? ` · ${p.company}` : ""}
            {p.service_type ? ` · ${p.service_type}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/projects/${p.id}/brief`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-iris/30 bg-iris/10 px-3 font-display text-[12px] font-bold text-iris hover:bg-iris/15"
          >
            <i className="ti ti-sparkles text-[14px]" aria-hidden />
            AI 브리프
          </Link>
          <Link
            href={`/admin/projects/${p.id}/ai`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink-15 bg-white px-3 font-display text-[12px] font-bold text-ink-70 hover:border-ink-30 hover:text-ink-100"
          >
            <i className="ti ti-stack-2 text-[14px]" aria-hidden />
            AI 자산
          </Link>
          <ProjectStatusBadge status={p.status} />
          <PriorityBadge priority={p.priority} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <aside className="space-y-5 xl:col-span-3">
          <AdminCard title="프로젝트 정보">
            <dl className="space-y-2.5">
              <Row label="번호" value={p.project_no} mono />
              <Row
                label="상태"
                value={projectStatusLabels[p.status]}
              />
              <Row
                label="결제"
                value={billingStatusLabels[p.billing_status]}
                toneClass={billingStatusToneClass[p.billing_status]}
              />
              <Row label="진행률" value={`${p.progress}%`} />
              <Row label="납기" value={p.due_date ?? "—"} />
              <Row
                label="담당"
                value={
                  team.find((t) => t.id === p.assigned_to)?.name ??
                  team.find((t) => t.id === p.assigned_to)?.email ??
                  "—"
                }
              />
              <Row label="고객" value={p.client_name} />
              <Row label="회사" value={p.company ?? "—"} />
              <Row label="서비스" value={p.service_type ?? "—"} />
              <Row
                label="생성"
                value={format(new Date(p.created_at), "yyyy-MM-dd")}
              />
            </dl>
          </AdminCard>

          <AdminCard title="착수 체크리스트">
            <ul className="space-y-1.5">
              <CheckRow done label="견적 발송" />
              <CheckRow done={contractSent} label="계약서 발송" />
              <CheckRow done={contractSigned} label="계약서 서명 완료" />
              <CheckRow done={depositPaid} label="예약금 결제 완료" />
              <CheckRow
                done={contractSigned && depositPaid}
                label="착수 가능"
                accent
              />
              <CheckRow done={inProgress} label="진행중" accent />
            </ul>
            {!inProgress && !(contractSigned && depositPaid) ? (
              <KickoffOverride projectId={p.id} />
            ) : null}
          </AdminCard>

          <AdminCard title="빠른 액션">
            <ProjectControls
              project={{
                id: p.id,
                status: p.status,
                priority: p.priority,
                progress: p.progress,
                due_date: p.due_date,
                assigned_to: p.assigned_to,
              }}
              team={team.map((t) => ({
                id: t.id,
                label: `${t.name ?? t.email} · ${t.role}`,
              }))}
              compact
            />
          </AdminCard>
        </aside>

        <section className="space-y-5 xl:col-span-6">
          <AdminCard title="AI 어시스턴트">
            <AIToolsPanel projectId={p.id} />
          </AdminCard>

          <AdminCard
            title={`고객 브리프${brief?.status === "submitted" ? " · 제출됨" : brief ? " · 작성중" : " · 미작성"}`}
          >
            {brief ? (
              <BriefView brief={brief} />
            ) : (
              <p className="text-[12.5px] text-ink-50">
                고객이 아직 브리프를 작성하지 않았습니다.
              </p>
            )}
          </AdminCard>

          <AdminCard
            title={`수정 요청${openRevisions ? ` · 진행 ${openRevisions}건` : ""}`}
          >
            <RevisionsAdmin requests={revisions} />
          </AdminCard>

          <AdminCard title="메시지 · 채팅 · 내부 메모">
            <CommentForm projectId={p.id} />
            <div className="mt-4">
              <CommentsList
                projectId={p.id}
                initial={(comments ?? []) as ProjectComment[]}
              />
            </div>
          </AdminCard>

          <AdminCard title="활동 타임라인">
            <ActivityTimeline
              entityType="project"
              entityId={p.id}
              limit={40}
              showRawAction
            />
          </AdminCard>
        </section>

        <aside className="space-y-5 xl:col-span-3">
          <AdminCard title="파일">
            <FilesPanel
              projectId={p.id}
              files={(files ?? []) as ProjectFile[]}
            />
          </AdminCard>

          <AdminCard title="산출물 · 버전 관리">
            <DeliverablesAdmin projectId={p.id} deliverables={deliverables} />
          </AdminCard>

          {quote ? (
            <AdminCard title="견적 / 결제">
              <dl className="space-y-2.5">
                <Row label="견적" value={quote.title} />
                <Row label="총액" value={fmtKRW(quote.total_price)} />
                <Row label="예약금" value={fmtKRW(quote.deposit_amount)} />
                <Row label="잔금" value={fmtKRW(quote.balance_amount)} />
                {quote.expires_at ? (
                  <Row
                    label="만료"
                    value={format(new Date(quote.expires_at), "yyyy-MM-dd")}
                  />
                ) : null}
              </dl>
              <div className="mt-3 border-t border-ink-15 pt-3">
                <p className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-ink-50">
                  결제 내역
                </p>
                {paymentRows.length === 0 ? (
                  <p className="mt-2 text-[12px] text-ink-50">없음</p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {paymentRows.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-center justify-between gap-2 text-[12px]"
                      >
                        <span className="text-ink-70">
                          {r.type === "deposit"
                            ? "예약금"
                            : r.type === "balance"
                            ? "본결제"
                            : "추가"}
                        </span>
                        <span
                          className={`font-mono text-[11.5px] ${
                            r.status === "paid"
                              ? "text-success"
                              : r.status === "pending"
                              ? "text-warning"
                              : "text-ink-50"
                          }`}
                        >
                          {fmtKRW(r.amount)} · {r.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  href={`/admin/quotes/${quote.id}`}
                  className="mt-3 inline-flex text-[12px] text-iris hover:underline"
                >
                  견적 상세 →
                </Link>
              </div>
            </AdminCard>
          ) : null}

          <AdminCard title="브랜드 프로필">
            {brandRow ? (
              <dl className="space-y-2.5">
                <Row label="브랜드" value={brandRow.brand_name ?? "—"} />
                <Row label="톤" value={brandRow.tone ?? "—"} />
                <Row label="컬러" value={brandRow.brand_colors ?? "—"} />
                <Row
                  label="레퍼런스"
                  value={brandRow.reference_sites ?? "—"}
                />
              </dl>
            ) : (
              <p className="text-[12.5px] text-ink-50">
                고객이 등록한 브랜드 프로필이 없습니다.
              </p>
            )}
          </AdminCard>

          <AdminCard title="최근 AI 자산">
            <AIAssetsList projectId={p.id} />
          </AdminCard>
        </aside>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  toneClass,
}: {
  label: string;
  value: string;
  mono?: boolean;
  toneClass?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
      <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-50">
        {label}
      </dt>
      <dd
        className={`max-w-[60%] truncate text-right ${
          toneClass ?? "text-ink-100"
        } ${mono ? "font-mono text-[11.5px]" : ""}`}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}

function BriefView({ brief }: { brief: ProjectBrief }) {
  const rows: Array<[string, string | null]> = [
    ["회사명", brief.company_name],
    ["담당자", brief.manager_name],
    ["연락처", brief.contact_phone],
    ["이메일", brief.contact_email],
    ["제작 유형", brief.production_type],
    ["제작 목적", brief.purpose],
    ["목표 고객층", brief.target_audience],
    ["원하는 분위기", brief.desired_mood],
    ["참고 사이트", brief.reference_urls],
    ["경쟁사", brief.competitor_urls],
    ["필수 요청사항", brief.must_requirements],
  ];
  return (
    <dl className="space-y-2">
      {rows.map(([label, value]) => (
        <div key={label} className="text-[12.5px]">
          <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-50">
            {label}
          </dt>
          <dd className="mt-0.5 whitespace-pre-wrap text-ink-100">
            {value?.trim() ? value : <span className="text-ink-30">—</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function CheckRow({
  done,
  label,
  accent,
}: {
  done: boolean;
  label: string;
  accent?: boolean;
}) {
  return (
    <li className="flex items-center gap-2 text-[12.5px]">
      <span
        className={`grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border ${
          done
            ? accent
              ? "border-success bg-success text-white"
              : "border-iris bg-iris text-white"
            : "border-ink-30 bg-white text-transparent"
        }`}
      >
        <i className="ti ti-check text-[11px]" aria-hidden />
      </span>
      <span
        className={
          done
            ? accent
              ? "font-bold text-success"
              : "text-ink-100"
            : "text-ink-50"
        }
      >
        {label}
      </span>
    </li>
  );
}

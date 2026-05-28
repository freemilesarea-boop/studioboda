import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { AdminCard, EmptyState } from "@/components/admin/Card";
import {
  aiAssetKindLabels,
  type AIAsset,
  type AIAssetKind,
  type Project,
} from "@/lib/types/db";
import { AIAssetCopyButton } from "../AIAssetCopyButton";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · AI 자산 라이브러리",
  robots: { index: false, follow: false },
};

const KIND_OPTIONS: { value: AIAssetKind | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "brief", label: "브리프" },
  { value: "copy", label: "카피" },
  { value: "headline", label: "헤드라인" },
  { value: "cta", label: "CTA" },
  { value: "description", label: "설명" },
  { value: "design_prompt", label: "디자인 프롬프트" },
];

export default async function ProjectAILibraryPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { kind?: string; q?: string };
}) {
  const admin = createAdminSupabase();
  const { data: project } = await admin
    .from("projects")
    .select("id,title,project_no")
    .eq("id", params.id)
    .maybeSingle();
  if (!project) notFound();
  const p = project as Pick<Project, "id" | "title" | "project_no">;

  const kind = (searchParams?.kind ?? "all") as AIAssetKind | "all";
  const q = (searchParams?.q ?? "").trim();

  let query = admin
    .from("ai_assets")
    .select("*")
    .eq("project_id", p.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (kind !== "all") query = query.eq("kind", kind);
  if (q) query = query.ilike("output", `%${q}%`);

  const { data } = await query;
  const rows = (data ?? []) as AIAsset[];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-[12px] text-ink-50">
        <Link href={`/admin/projects/${p.id}`} className="hover:text-iris">
          ← 프로젝트로
        </Link>
        <span className="text-ink-30">·</span>
        <span className="font-mono text-[11px]">{p.project_no}</span>
      </div>

      <div>
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-iris">
          AI 자산 라이브러리
        </p>
        <h2 className="mt-1 font-display text-[22px] font-extrabold tracking-[-0.4px] text-ink-100">
          {p.title}
        </h2>
        <p className="mt-1 text-[12px] text-ink-50">
          이 프로젝트에서 생성된 모든 AI 산출물 — 운영자만 열람 가능.
        </p>
      </div>

      <AdminCard
        title="필터"
        action={
          <span className="text-[11px] text-ink-50">
            총 {rows.length}건
          </span>
        }
      >
        <form className="flex flex-wrap items-center gap-2" method="get">
          <div className="flex flex-wrap gap-1.5">
            {KIND_OPTIONS.map((o) => (
              <a
                key={o.value}
                href={`?kind=${o.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={`rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${
                  kind === o.value
                    ? "border-ink-100 bg-ink-100 text-white"
                    : "border-ink-15 bg-white text-ink-70 hover:border-ink-30"
                }`}
              >
                {o.label}
              </a>
            ))}
          </div>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="내용 검색"
            className="ml-auto h-9 w-full rounded-md border border-ink-15 bg-white px-3 text-[12.5px] outline-none focus:border-iris/60 sm:w-60"
          />
          <input type="hidden" name="kind" value={kind} />
          <button
            type="submit"
            className="h-9 rounded-md bg-ink-100 px-3 font-display text-[12px] font-bold text-white hover:bg-ink-90"
          >
            검색
          </button>
        </form>
      </AdminCard>

      <AdminCard title="결과">
        {rows.length === 0 ? (
          <EmptyState
            title="조건에 맞는 자산이 없습니다"
            description="다른 필터로 조회하거나 새로 생성해보세요."
          />
        ) : (
          <ul className="divide-y divide-ink-15">
            {rows.map((a) => (
              <li key={a.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[11px] text-ink-50">
                    <span className="rounded-full bg-iris/10 px-2 py-0.5 font-display text-[10px] font-bold text-iris">
                      {aiAssetKindLabels[a.kind]}
                    </span>
                    <span>
                      {format(new Date(a.created_at), "yyyy-MM-dd HH:mm")}
                    </span>
                    {a.provider ? (
                      <span>
                        · {a.provider}
                        {a.model ? ` / ${a.model}` : ""}
                      </span>
                    ) : null}
                  </div>
                  <AIAssetCopyButton text={a.output} />
                </div>
                <pre className="mt-2 max-h-80 overflow-y-auto whitespace-pre-wrap rounded-md border border-ink-15 bg-ink-100/[0.02] px-3 py-2.5 font-mono text-[12px] leading-[1.65] text-ink-100">
                  {a.output}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}

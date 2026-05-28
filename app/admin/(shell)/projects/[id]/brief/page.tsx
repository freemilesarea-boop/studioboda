import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { AdminCard } from "@/components/admin/Card";
import type { AIAsset, Project } from "@/lib/types/db";
import { BriefClient } from "./BriefClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · AI 브리프",
  robots: { index: false, follow: false },
};

export default async function ProjectBriefPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = createAdminSupabase();
  const { data: project } = await admin
    .from("projects")
    .select("id,title,service_type,client_name,company")
    .eq("id", params.id)
    .maybeSingle();
  if (!project) notFound();
  const p = project as Pick<
    Project,
    "id" | "title" | "service_type" | "client_name" | "company"
  >;

  const { data: latestRow } = await admin
    .from("ai_assets")
    .select("*")
    .eq("project_id", p.id)
    .eq("kind", "brief")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const latest = latestRow as AIAsset | null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-[12px] text-ink-50">
        <Link href={`/admin/projects/${p.id}`} className="hover:text-iris">
          ← 프로젝트로
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-iris">
            AI 제작 브리프
          </p>
          <h2 className="mt-1 font-display text-[22px] font-extrabold tracking-[-0.4px] text-ink-100">
            {p.title}
          </h2>
          <p className="mt-1 text-[12px] text-ink-50">
            {p.client_name}
            {p.company ? ` · ${p.company}` : ""}
            {p.service_type ? ` · ${p.service_type}` : ""}
          </p>
        </div>
      </div>

      <AdminCard title="브리프">
        <BriefClient
          projectId={p.id}
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

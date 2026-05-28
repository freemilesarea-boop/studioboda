import { createAdminSupabase } from "@/lib/supabase/admin";
import type { AIAssetKind } from "@/lib/types/db";

// Minutes saved heuristic — director vs. AI draft. Conservative, used only
// as an internal indicator on the dashboard, never shown to customers.
const MINUTES_SAVED_BY_KIND: Record<AIAssetKind, number> = {
  brief: 45,
  copy: 12,
  headline: 8,
  cta: 6,
  description: 10,
  design_prompt: 15,
};

export type AIMetrics = {
  total: number;
  byKind: Record<AIAssetKind, number>;
  perProject: number;
  estimatedHoursSaved: number;
  topService: { service: string; count: number } | null;
  last30Days: number;
};

export async function aiMetrics(): Promise<AIMetrics> {
  const admin = createAdminSupabase();
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: assets }, { data: projects }] = await Promise.all([
    admin
      .from("ai_assets")
      .select("id,kind,project_id,created_at"),
    admin.from("projects").select("id,service_type"),
  ]);

  const rows = (assets ?? []) as Array<{
    id: string;
    kind: AIAssetKind;
    project_id: string | null;
    created_at: string;
  }>;
  const projectRows = (projects ?? []) as Array<{
    id: string;
    service_type: string | null;
  }>;

  const byKind: Record<AIAssetKind, number> = {
    brief: 0,
    copy: 0,
    headline: 0,
    cta: 0,
    description: 0,
    design_prompt: 0,
  };
  let minutesSaved = 0;
  let last30 = 0;
  for (const r of rows) {
    byKind[r.kind] = (byKind[r.kind] ?? 0) + 1;
    minutesSaved += MINUTES_SAVED_BY_KIND[r.kind] ?? 0;
    if (r.created_at >= since30) last30++;
  }

  const projectsWithAssets = new Set(
    rows.filter((r) => r.project_id).map((r) => r.project_id as string),
  );
  const perProject =
    projectsWithAssets.size === 0
      ? 0
      : Math.round((rows.length / projectsWithAssets.size) * 10) / 10;

  const serviceTally: Record<string, number> = {};
  const projectById = new Map(projectRows.map((p) => [p.id, p.service_type]));
  for (const r of rows) {
    if (!r.project_id) continue;
    const s = projectById.get(r.project_id) ?? "기타";
    if (!s) continue;
    serviceTally[s] = (serviceTally[s] ?? 0) + 1;
  }
  const topService = Object.entries(serviceTally)
    .sort((a, b) => b[1] - a[1])
    .map(([service, count]) => ({ service, count }))[0] ?? null;

  return {
    total: rows.length,
    byKind,
    perProject,
    estimatedHoursSaved: Math.round((minutesSaved / 60) * 10) / 10,
    topService,
    last30Days: last30,
  };
}

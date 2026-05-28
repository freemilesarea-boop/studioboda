import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { aiAssetKindLabels, type AIAsset } from "@/lib/types/db";
import { AIAssetCopyButton } from "./AIAssetCopyButton";

export async function AIAssetsList({ projectId }: { projectId: string }) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("ai_assets")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(20);
  const rows = (data ?? []) as AIAsset[];

  if (rows.length === 0) {
    return (
      <p className="text-[12.5px] text-ink-50">
        아직 생성된 AI 자산이 없습니다.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-ink-15">
      {rows.map((a) => (
        <li key={a.id} className="py-3 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px] text-ink-50">
              <span className="rounded-full bg-iris/10 px-2 py-0.5 font-display text-[10px] font-bold text-iris">
                {aiAssetKindLabels[a.kind]}
              </span>
              <span>
                {formatDistanceToNow(new Date(a.created_at), {
                  locale: ko,
                  addSuffix: true,
                })}
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
          <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-md border border-ink-15 bg-ink-100/[0.02] px-3 py-2 font-mono text-[12px] leading-[1.6] text-ink-100">
            {a.output}
          </pre>
        </li>
      ))}
    </ul>
  );
}

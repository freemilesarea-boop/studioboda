"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import type { ClauseCondition, ClauseScope } from "@/lib/contracts/blocks";
import type { ContractTemplateKind } from "@/lib/contracts/templates";

type Result = { ok: true } | { ok: false; error: string };

const SCOPES: ClauseScope[] = ["common", "service", "quote"];
const CONDITIONS: ClauseCondition[] = ["always", "recurring", "has_deliverables"];
const KINDS: ContractTemplateKind[] = ["website", "detail_page", "maintenance"];

// Upsert a clause block (by `key`). New keys = brand-new clauses, no code
// change required. Existing keys (built-in or custom) are overridden.
export async function upsertClauseBlockAction(
  formData: FormData,
): Promise<Result> {
  const me = await requireStaff();
  const admin = createAdminSupabase();

  const key = String(formData.get("key") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!key || !title || !body) {
    return { ok: false, error: "key · 제목 · 본문을 모두 입력해주세요" };
  }
  if (!/^[a-z0-9_]+$/.test(key)) {
    return { ok: false, error: "key는 영소문자·숫자·밑줄(_)만 사용하세요" };
  }

  const scopeRaw = String(formData.get("scope") ?? "common");
  const scope: ClauseScope = SCOPES.includes(scopeRaw as ClauseScope)
    ? (scopeRaw as ClauseScope)
    : "common";
  const conditionRaw = String(formData.get("condition") ?? "always");
  const condition: ClauseCondition = CONDITIONS.includes(
    conditionRaw as ClauseCondition,
  )
    ? (conditionRaw as ClauseCondition)
    : "always";

  const kinds = KINDS.filter((k) => formData.get(`kind_${k}`) === "on");
  const template_kinds =
    scope === "service" && kinds.length > 0 ? kinds : null;
  const sort_order = Number(formData.get("sort_order") ?? 100) || 100;
  const active = formData.get("active") !== "off";

  const payload = {
    key,
    scope,
    template_kinds,
    condition,
    title,
    body,
    sort_order,
    active,
  };

  const { error } = await admin
    .from("contract_clause_blocks")
    .upsert(payload, { onConflict: "key" });
  if (error) return { ok: false, error: error.message };

  await logActivity({
    actor_id: me.id,
    entity_type: "contract_clause",
    entity_id: null,
    action: "clause_block_upserted",
    metadata: { key, scope },
  });
  revalidatePath("/admin/contract-clauses");
  return { ok: true };
}

export async function deleteClauseBlockAction(key: string): Promise<Result> {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const { error } = await admin
    .from("contract_clause_blocks")
    .delete()
    .eq("key", key);
  if (error) return { ok: false, error: error.message };
  await logActivity({
    actor_id: me.id,
    entity_type: "contract_clause",
    entity_id: null,
    action: "clause_block_deleted",
    metadata: { key },
  });
  revalidatePath("/admin/contract-clauses");
  return { ok: true };
}

// Disable a built-in block by writing an inactive override row.
export async function disableBuiltinBlockAction(
  block: {
    key: string;
    scope: ClauseScope;
    template_kinds: ContractTemplateKind[] | null;
    condition: ClauseCondition;
    title: string;
    body: string;
    sort_order: number;
  },
): Promise<Result> {
  const me = await requireStaff();
  const admin = createAdminSupabase();
  const { error } = await admin
    .from("contract_clause_blocks")
    .upsert({ ...block, active: false }, { onConflict: "key" });
  if (error) return { ok: false, error: error.message };
  await logActivity({
    actor_id: me.id,
    entity_type: "contract_clause",
    entity_id: null,
    action: "clause_block_disabled",
    metadata: { key: block.key },
  });
  revalidatePath("/admin/contract-clauses");
  return { ok: true };
}

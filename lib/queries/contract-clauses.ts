import { createAdminSupabase } from "@/lib/supabase/admin";
import {
  BUILTIN_CLAUSE_BLOCKS,
  type ClauseCondition,
  type ClauseScope,
  type ContractClauseBlock,
} from "@/lib/contracts/blocks";
import type { ContractTemplateKind } from "@/lib/contracts/templates";

const safeAdmin = () => {
  try {
    return createAdminSupabase();
  } catch {
    return null;
  }
};

type DbRow = {
  id: string;
  key: string;
  scope: ClauseScope;
  template_kinds: ContractTemplateKind[] | null;
  condition: ClauseCondition;
  title: string;
  body: string;
  sort_order: number;
  active: boolean;
};

function dbToBlock(r: DbRow): ContractClauseBlock {
  return {
    id: r.id,
    key: r.key,
    scope: r.scope,
    template_kinds: r.template_kinds,
    condition: r.condition,
    title: r.title,
    body: r.body,
    sort_order: r.sort_order,
    active: r.active,
  };
}

async function fetchDbBlocks(): Promise<ContractClauseBlock[]> {
  const admin = safeAdmin();
  if (!admin) return [];
  const { data, error } = await admin
    .from("contract_clause_blocks")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) return []; // table not yet migrated → built-ins only
  return ((data ?? []) as DbRow[]).map(dbToBlock);
}

/**
 * The effective clause registry: built-in blocks, overridden/extended by DB
 * rows keyed by `key`. A DB row with the same key REPLACES the built-in
 * (including its `active` flag, so a built-in can be disabled). New keys ADD
 * new blocks — this is how a new service's clauses are added with no code change.
 */
export async function getEffectiveClauseBlocks(): Promise<
  ContractClauseBlock[]
> {
  const dbBlocks = await fetchDbBlocks();
  const map = new Map<string, ContractClauseBlock>();
  for (const b of BUILTIN_CLAUSE_BLOCKS) map.set(b.key, b);
  for (const b of dbBlocks) map.set(b.key, b); // override or add
  return [...map.values()].sort(
    (a, b) => a.sort_order - b.sort_order || a.key.localeCompare(b.key),
  );
}

/** Admin CMS view: built-in blocks + custom DB blocks (with source flag). */
export async function adminListClauseBlocks(): Promise<{
  builtin: ContractClauseBlock[];
  custom: ContractClauseBlock[];
  overriddenKeys: string[];
}> {
  const dbBlocks = await fetchDbBlocks();
  const dbKeys = new Set(dbBlocks.map((b) => b.key));
  const builtinKeys = new Set(BUILTIN_CLAUSE_BLOCKS.map((b) => b.key));
  return {
    builtin: [...BUILTIN_CLAUSE_BLOCKS].sort((a, b) => a.sort_order - b.sort_order),
    custom: dbBlocks.sort((a, b) => a.sort_order - b.sort_order),
    overriddenKeys: [...dbKeys].filter((k) => builtinKeys.has(k)),
  };
}

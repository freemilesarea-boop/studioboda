// ============================================================
// STUDIO BODA — Contract Template Engine
// ============================================================
// Assembles a contract body from clause blocks in 3 layers
// (common + service + quote) driven by quote/service/deliverable facts.
// Pure & synchronous: callers pass the effective block list (built-ins merged
// with DB overrides — see lib/queries/contract-clauses.ts).
// ============================================================

import { company } from "@/lib/company";
import {
  contractTemplateLabels,
  type ContractTemplateKind,
} from "./templates";
import type {
  ClauseCondition,
  ContractClauseBlock,
} from "./blocks";

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

export type ContractComposeFacts = {
  kind: ContractTemplateKind;
  customerName: string;
  projectTitle: string;
  serviceType: string | null;
  amount: number;
  depositRate: number;
  depositAmount: number;
  balanceAmount: number;
  monthlyAmount: number;
  deliveryDays: number | null;
  revisionCount: number;
  /** 견적항목/산출물 라벨 목록 (견적별 조항 입력) */
  deliverables: string[];
  recurring: boolean;
};

function tokenMap(f: ContractComposeFacts): Record<string, string> {
  const deliveryText = f.deliveryDays
    ? `예약금 입금일을 착수일로 하며, 산출물 1차 시안은 착수일로부터 ${f.deliveryDays}영업일 이내 제공한다.`
    : `착수일 및 납기는 예약금 입금 후 양 당사자가 서면(이메일·메신저 포함)으로 협의하여 정한다.`;
  const deliverables =
    f.deliverables.length > 0
      ? f.deliverables.map((d) => `· ${d}`).join("\n")
      : "· 협의된 산출물 일체";
  return {
    customerName: f.customerName,
    projectTitle: f.projectTitle,
    serviceType: f.serviceType ?? "제작 용역",
    amount: fmt(f.amount),
    depositRate: String(f.depositRate),
    depositAmount: fmt(f.depositAmount),
    balanceAmount: fmt(f.balanceAmount),
    monthlyAmount: fmt(f.monthlyAmount),
    revisionCount: String(f.revisionCount),
    deliveryText,
    deliverables,
  };
}

function interpolate(body: string, tokens: Record<string, string>): string {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) =>
    k in tokens ? tokens[k] : `{{${k}}}`,
  );
}

function conditionMet(
  condition: ClauseCondition,
  f: ContractComposeFacts,
): boolean {
  switch (condition) {
    case "recurring":
      return f.recurring;
    case "has_deliverables":
      return f.deliverables.length > 0;
    case "always":
    default:
      return true;
  }
}

/** Decide whether a block applies to the given facts (3-layer selection). */
export function blockApplies(
  block: ContractClauseBlock,
  f: ContractComposeFacts,
): boolean {
  if (!block.active) return false;
  if (!conditionMet(block.condition, f)) return false;
  if (block.scope === "service") {
    // service layer: must match the template kind (null = all kinds)
    if (block.template_kinds && block.template_kinds.length > 0) {
      return block.template_kinds.includes(f.kind);
    }
    return true;
  }
  // common + quote layers apply to all kinds (gated by condition above)
  return true;
}

export type ComposedContract = {
  title: string;
  body: string;
  usedBlockKeys: string[];
};

function header(f: ContractComposeFacts): string {
  const label = contractTemplateLabels[f.kind];
  if (f.recurring) {
    return [
      `「${label}」`,
      ``,
      `${company.name}(이하 "갑")와 ${f.customerName}(이하 "을")은 아래 유지보수·구독 서비스에 관하여 다음과 같이 계약을 체결한다.`,
      ``,
      `· 서비스명: ${f.projectTitle}`,
      f.serviceType ? `· 서비스 구분: ${f.serviceType}` : ``,
      `· 월 이용요금: ${fmt(f.monthlyAmount)}원 (VAT 별도)`,
    ]
      .filter(Boolean)
      .join("\n");
  }
  return [
    `「${label}」`,
    ``,
    `${company.name}(이하 "갑")와 ${f.customerName}(이하 "을")은 아래 프로젝트의 제작 용역에 관하여 다음과 같이 계약을 체결한다.`,
    ``,
    `· 프로젝트명: ${f.projectTitle}`,
    f.serviceType ? `· 서비스 구분: ${f.serviceType}` : ``,
    `· 총 계약금액: ${fmt(f.amount)}원 (VAT 별도)`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Compose the full contract body from the effective clause blocks + facts.
 * Selected blocks are ordered by sort_order and numbered 제1조 … 제N조.
 */
export function composeContract(
  blocks: ContractClauseBlock[],
  f: ContractComposeFacts,
): ComposedContract {
  const tokens = tokenMap(f);
  const selected = blocks
    .filter((b) => blockApplies(b, f))
    .sort((a, b) => a.sort_order - b.sort_order || a.key.localeCompare(b.key));

  const articles = selected.map((b, i) => {
    const n = i + 1;
    return `제${n}조 (${b.title})\n${interpolate(b.body, tokens)}`;
  });

  return {
    title: header(f),
    body: [header(f), "", articles.join("\n\n")].join("\n"),
    usedBlockKeys: selected.map((b) => b.key),
  };
}

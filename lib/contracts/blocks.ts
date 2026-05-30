// ============================================================
// STUDIO BODA — Contract clause blocks (built-in registry)
// ============================================================
// The contract body is assembled from independent CLAUSE BLOCKS in 3 layers:
//   1) common   — 모든 계약 공통 조항
//   2) service  — 서비스 유형(template_kind)별 조항
//   3) quote    — 견적/문의서 기반 조건부 조항 (산출물·정기결제 등)
//
// These built-ins are the zero-config default. The DB table
// `contract_clause_blocks` can OVERRIDE a block (same key) or ADD new ones,
// so a brand-new service only needs new rows — NO code change. (see engine.ts)
//
// Block bodies use {{token}} placeholders interpolated by the engine.
// Available tokens: customerName, projectTitle, serviceType, amount,
// depositRate, depositAmount, balanceAmount, monthlyAmount, revisionCount,
// deliveryText, deliverables.
// ============================================================

import type { ContractTemplateKind } from "./templates";

export type ClauseScope = "common" | "service" | "quote";
export type ClauseCondition = "always" | "recurring" | "has_deliverables";

export type ContractClauseBlock = {
  id?: string;
  key: string;
  scope: ClauseScope;
  /** For service-scope: which template kinds this applies to. null = all. */
  template_kinds: ContractTemplateKind[] | null;
  /** Extra gate evaluated against the facts. */
  condition: ClauseCondition;
  title: string;
  body: string;
  sort_order: number;
  active: boolean;
};

const PROJECT: ContractTemplateKind[] = ["website", "detail_page"];

export const BUILTIN_CLAUSE_BLOCKS: ContractClauseBlock[] = [
  // ---- 목적 (service) -----------------------------------------------------
  {
    key: "purpose_website",
    scope: "service",
    template_kinds: ["website"],
    condition: "always",
    title: "목적",
    body: "본 계약은 갑이 을에게 제공하는 웹사이트 제작 용역의 범위, 일정, 대금 및 권리·의무를 정함을 목적으로 한다.",
    sort_order: 10,
    active: true,
  },
  {
    key: "purpose_detail",
    scope: "service",
    template_kinds: ["detail_page"],
    condition: "always",
    title: "목적",
    body: "본 계약은 갑이 을에게 제공하는 상세페이지·콘텐츠 제작 용역의 범위, 일정, 대금 및 권리·의무를 정함을 목적으로 한다.",
    sort_order: 10,
    active: true,
  },
  {
    key: "purpose_maintenance",
    scope: "service",
    template_kinds: ["maintenance"],
    condition: "always",
    title: "목적",
    body: "본 계약은 갑이 을에게 정기적으로 제공하는 유지보수·운영 또는 구독형 콘텐츠 서비스의 범위, 요금, 기간 및 권리·의무를 정함을 목적으로 한다.",
    sort_order: 10,
    active: true,
  },

  // ---- 업무 범위 (service) ------------------------------------------------
  {
    key: "scope_website",
    scope: "service",
    template_kinds: ["website"],
    condition: "always",
    title: "업무 범위",
    body: "갑은 다음 업무를 수행한다. ① 기획 및 정보 구조 설계, ② 디자인 시안 제작, ③ 반응형 퍼블리싱 및 프론트엔드 구현, ④ 합의된 페이지·기능의 개발, ⑤ 배포 및 게시. 본 계약에 명시되지 않은 기능·페이지·외부 연동은 업무 범위에서 제외된다.",
    sort_order: 20,
    active: true,
  },
  {
    key: "scope_detail",
    scope: "service",
    template_kinds: ["detail_page"],
    condition: "always",
    title: "업무 범위",
    body: "갑은 다음 업무를 수행한다. ① 기획 및 구성안 작성, ② 카피라이팅, ③ 디자인 시안 제작, ④ 합의된 콘텐츠(상세페이지·SNS·배너 등)의 제작. 본 계약에 명시되지 않은 추가 콘텐츠·다른 규격의 변형물은 업무 범위에서 제외된다.",
    sort_order: 20,
    active: true,
  },
  {
    key: "scope_maintenance",
    scope: "service",
    template_kinds: ["maintenance"],
    condition: "always",
    title: "업무 범위 및 산출물",
    body: "갑은 매월 합의된 범위 내에서 ① 콘텐츠 제작·수정, ② 사이트·콘텐츠 운영 지원, ③ 정기 점검 및 경미한 오류 보정을 수행한다. 월 제공 범위(작업 건수·시간)를 초과하는 업무는 별도 비용이 발생한다. 신규 기획·대규모 개편은 본 계약에 포함되지 않는다.",
    sort_order: 20,
    active: true,
  },

  // ---- 산출물 (service, 단건만) ------------------------------------------
  {
    key: "deliverable_website",
    scope: "service",
    template_kinds: ["website"],
    condition: "always",
    title: "산출물",
    body: "갑은 ① 합의된 페이지로 구성된 반응형 웹사이트, ② 게시 가능한 형태의 결과물을 을에게 전달한다. 소스코드·디자인 원본 파일의 제공 여부는 별도 협의에 따른다.",
    sort_order: 30,
    active: true,
  },
  {
    key: "deliverable_detail",
    scope: "service",
    template_kinds: ["detail_page"],
    condition: "always",
    title: "산출물",
    body: "갑은 합의된 규격의 이미지 파일(JPG/PNG 등)을 을에게 전달한다. 작업 원본(PSD 등)의 제공 여부 및 비용은 별도 협의에 따른다.",
    sort_order: 30,
    active: true,
  },

  // ---- 산출물 상세 / 포함 내역 (quote, 견적항목 기반) ---------------------
  {
    key: "deliverable_itemized",
    scope: "quote",
    template_kinds: null,
    condition: "has_deliverables",
    title: "포함 내역",
    body: "본 계약의 포함 내역(산출물)은 다음과 같으며, 이를 초과하는 항목은 별도 견적으로 진행한다.\n{{deliverables}}",
    sort_order: 35,
    active: true,
  },

  // ---- 일정 / 계약 기간 (service 분기) ------------------------------------
  {
    key: "schedule_project",
    scope: "service",
    template_kinds: PROJECT,
    condition: "always",
    title: "일정 및 납기",
    body: "{{deliveryText}} 고객의 자료 미제공·회신 지연 기간은 납기에 산입하지 않는다.",
    sort_order: 40,
    active: true,
  },
  {
    key: "term_autorenew",
    scope: "service",
    template_kinds: ["maintenance"],
    condition: "always",
    title: "계약 기간 및 자동 갱신",
    body: "본 계약의 기간은 월 단위로 하며, 일방의 해지 통지가 없는 한 매월 자동 갱신된다.",
    sort_order: 40,
    active: true,
  },

  // ---- 대금 지급 (service 분기) ------------------------------------------
  {
    key: "payment_project",
    scope: "service",
    template_kinds: PROJECT,
    condition: "always",
    title: "계약금액 및 대금 지급",
    body: "총 계약금액은 {{amount}}원(부가가치세 별도)으로 한다. 을은 계약 체결 시 예약금 {{depositAmount}}원({{depositRate}}%)을 지급하고, 잔금 {{balanceAmount}}원은 최종 검수 완료 후 7일 이내에 지급한다. 갑은 예약금 입금이 확인된 시점에 작업을 착수한다.",
    sort_order: 50,
    active: true,
  },
  {
    key: "payment_monthly",
    scope: "service",
    template_kinds: ["maintenance"],
    condition: "always",
    title: "요금 및 결제",
    body: "을은 월 이용요금 {{monthlyAmount}}원(VAT 별도)을 매월 정해진 결제일에 자동결제 또는 갑이 지정한 방법으로 지급한다. 미납 시 갑은 서비스 제공을 보류할 수 있다.",
    sort_order: 50,
    active: true,
  },

  // ---- 유지보수 범위 (service) -------------------------------------------
  {
    key: "maint_website",
    scope: "service",
    template_kinds: ["website"],
    condition: "always",
    title: "유지보수 범위",
    body: "본 계약은 제작 용역에 한하며, 게시 이후의 콘텐츠 수정·기능 추가·서버 및 도메인 관리 등 운영 업무는 포함되지 않는다. 게시 후 7일 이내 발견된 명백한 제작상 하자는 무상 보정하며, 그 외 유지보수는 별도의 유지보수 계약으로 진행한다.",
    sort_order: 60,
    active: true,
  },
  {
    key: "maint_detail",
    scope: "service",
    template_kinds: ["detail_page"],
    condition: "always",
    title: "납품 후 수정",
    body: "납품 완료 후 콘텐츠의 텍스트·이미지 변경 등 수정 요청은 본 계약의 포함 수정 범위 내에서 처리하며, 이를 초과하는 변경은 별도 비용이 발생한다.",
    sort_order: 60,
    active: true,
  },
  {
    key: "maint_maintenance",
    scope: "service",
    template_kinds: ["maintenance"],
    condition: "always",
    title: "유지보수 범위",
    body: "월 제공 범위는 견적·협의 시 정한 작업 건수/시간을 기준으로 하며, 이월되지 않는다. 긴급 대응·야간 작업 등은 별도 협의에 따른다.",
    sort_order: 60,
    active: true,
  },

  // ---- 공통 조항 ----------------------------------------------------------
  {
    key: "common_materials",
    scope: "common",
    template_kinds: null,
    condition: "always",
    title: "고객의 자료 제공 의무",
    body: "을은 작업에 필요한 자료(텍스트, 이미지, 로고, 브랜드 가이드, 계정 정보 등)를 착수 시 갑에게 제공한다. 자료 제공 지연으로 발생하는 일정 지연 및 추가 비용에 대하여 갑은 책임지지 않는다. 을이 제공한 자료의 저작권·초상권·상표권 등 권리 적법성에 대한 책임은 을에게 있다.",
    sort_order: 70,
    active: true,
  },
  {
    key: "common_revision",
    scope: "common",
    template_kinds: null,
    condition: "always",
    title: "수정 범위",
    body: "본 계약에는 기본 {{revisionCount}}회의 시안 수정(디렉팅)이 포함된다. 포함 횟수를 초과하는 수정, 콘셉트의 전면 변경, 확정된 시안의 재작업은 별도 비용이 발생하며 사전 협의 후 진행한다.",
    sort_order: 80,
    active: true,
  },
  {
    key: "common_review",
    scope: "common",
    template_kinds: null,
    condition: "always",
    title: "검수 및 승인",
    body: "갑이 산출물을 전달한 날로부터 5영업일 이내에 을이 서면으로 수정 요청을 하지 않으면 해당 산출물은 검수 승인된 것으로 본다. 승인 이후 발견된 단순 오탈자 등 명백한 하자는 무상으로 보정한다.",
    sort_order: 90,
    active: true,
  },
  {
    key: "common_change",
    scope: "common",
    template_kinds: null,
    condition: "always",
    title: "지연 및 변경 요청",
    body: "을의 추가·변경 요청으로 작업 범위가 확대되는 경우, 갑은 추가 견적과 변경된 일정을 고지하고 을의 동의를 받아 진행한다. 천재지변, 통신장애 등 불가항력으로 인한 지연에 대하여 양 당사자는 책임을 지지 않는다.",
    sort_order: 100,
    active: true,
  },
  {
    key: "terminate_project",
    scope: "service",
    template_kinds: PROJECT,
    condition: "always",
    title: "계약 해지",
    body: "양 당사자는 상대방이 본 계약을 위반하고 7일 이내에 시정하지 않을 경우 계약을 해지할 수 있다. 을의 사정으로 계약을 중도 해지하는 경우, 해지 시점까지 진행된 작업 비율에 따라 기성 작업분의 대금을 정산하며 예약금은 반환하지 않는다.",
    sort_order: 110,
    active: true,
  },
  {
    key: "terminate_maintenance",
    scope: "service",
    template_kinds: ["maintenance"],
    condition: "always",
    title: "해지 및 환불",
    body: "을은 다음 결제일 7일 전까지 서면으로 해지를 통지할 수 있으며, 해지는 해당 결제 주기 종료일부터 효력이 발생한다. 이미 결제된 당월 이용요금 및 진행 완료된 작업분은 환불되지 않는다. 결제가 정해진 횟수 이상 실패하는 경우 갑은 계약을 자동 해지할 수 있다.",
    sort_order: 110,
    active: true,
  },
  {
    key: "refund_project",
    scope: "service",
    template_kinds: PROJECT,
    condition: "always",
    title: "환불 불가 조건",
    body: "다음의 경우 기지급 대금은 환불되지 않는다. ① 작업 착수 후 을의 단순 변심에 의한 해지, ② 을의 자료 미제공·연락 두절로 14일 이상 작업이 중단된 경우, ③ 검수 승인이 완료된 산출물, ④ 을이 제공한 자료의 권리 문제로 작업이 불가능해진 경우.",
    sort_order: 120,
    active: true,
  },
  {
    key: "common_ip",
    scope: "common",
    template_kinds: null,
    condition: "always",
    title: "지식재산권 귀속",
    body: "산출물의 저작재산권은 대금이 완납된 시점에 을에게 양도된다. 다만 갑이 보유한 폰트·스톡 이미지·플러그인·프레임워크 등 제3자 라이선스 자산과 갑 고유의 제작 노하우·소스 템플릿은 양도 대상에서 제외되며, 그 사용 범위는 해당 라이선스에 따른다. 대금 완납 전까지 산출물의 무단 사용을 금한다.",
    sort_order: 130,
    active: true,
  },
  {
    key: "common_portfolio",
    scope: "common",
    template_kinds: null,
    condition: "always",
    title: "포트폴리오 활용 동의",
    body: "갑은 완성된 산출물 및 프로젝트 결과를 갑의 포트폴리오·홈페이지·SNS·제안서 등 홍보 목적으로 활용할 수 있다. 을이 비공개를 원하는 경우 서면으로 통지하며, 이 경우 갑은 해당 자료를 홍보에 사용하지 않는다.",
    sort_order: 140,
    active: true,
  },
  {
    key: "common_liability",
    scope: "common",
    template_kinds: null,
    condition: "always",
    title: "면책",
    body: "갑의 손해배상 책임은 고의 또는 중대한 과실이 있는 경우에 한하며, 그 범위는 본 계약금액을 한도로 한다. 갑은 을의 영업 손실, 기대 수익 상실 등 간접·특별·결과적 손해에 대하여 책임지지 않는다. 산출물 운영 중 외부 플랫폼 정책 변경·서버·도메인 등 제3자 서비스로 인한 문제는 면책된다.",
    sort_order: 150,
    active: true,
  },
  {
    key: "common_confidential",
    scope: "common",
    template_kinds: null,
    condition: "always",
    title: "비밀유지",
    body: "양 당사자는 본 계약의 이행 과정에서 알게 된 상대방의 영업·기술·개인정보를 제3자에게 누설하거나 계약 목적 외로 사용하지 않으며, 이 의무는 계약 종료 후에도 유지된다.",
    sort_order: 160,
    active: true,
  },
  {
    key: "common_dispute",
    scope: "common",
    template_kinds: null,
    condition: "always",
    title: "분쟁 해결",
    body: "본 계약과 관련하여 분쟁이 발생한 경우 양 당사자는 상호 신의성실의 원칙에 따라 협의로 해결한다. 협의가 이루어지지 않을 경우, 갑의 주소지를 관할하는 법원을 제1심 관할 법원으로 하며 대한민국 법령을 준거법으로 한다.",
    sort_order: 170,
    active: true,
  },
  {
    key: "common_esign",
    scope: "common",
    template_kinds: null,
    condition: "always",
    title: "전자계약의 효력",
    body: "본 계약은 전자문서 및 전자거래 기본법에 따라 전자적 방식으로 체결되며, 양 당사자의 전자서명(서명 이미지 및 서명 일시 기록 포함)은 자필 서명과 동일한 효력을 가진다. 본 계약서는 전자적 형태로 보관되며 양 당사자는 그 진정성을 상호 인정한다.",
    sort_order: 180,
    active: true,
  },
];

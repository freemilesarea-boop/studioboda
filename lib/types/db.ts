export type Role = "admin" | "manager" | "designer" | "client";
export type AccountType = "individual" | "business";
export type InquiryStatus =
  | "new"
  | "contacted"
  | "quoted"
  | "converted"
  | "in_progress"
  | "completed"
  | "archived";
export type QuoteStatus =
  | "draft"
  | "sent"
  | "customer_review"
  | "accepted"
  | "rejected"
  | "expired";
export type ProjectStatus =
  | "queued"
  | "briefing"
  | "ai_draft"
  | "designing"
  | "review"
  | "revision"
  | "delivered"
  | "completed"
  | "cancelled";
export type Priority = "low" | "normal" | "high" | "urgent";
export type Visibility = "internal" | "client";

export type PaymentType = "deposit" | "balance" | "extra";
export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded";
export type QuotePaymentStatus = "unpaid" | "deposit_paid" | "fully_paid";
export type BillingStatus =
  | "waiting_deposit"
  | "in_progress"
  | "waiting_balance"
  | "completed";

export const paymentTypeLabels: Record<PaymentType, string> = {
  deposit: "예약금",
  balance: "본결제",
  extra: "추가결제",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: "결제 대기",
  paid: "결제 완료",
  failed: "결제 실패",
  cancelled: "취소",
  refunded: "환불",
};

export const billingStatusLabels: Record<BillingStatus, string> = {
  waiting_deposit: "예약금 대기",
  in_progress: "진행 중",
  waiting_balance: "본결제 대기",
  completed: "결제 완료",
};

export type Payment = {
  id: string;
  organization_id: string | null;
  quote_id: string | null;
  project_id: string | null;
  user_id: string | null;
  type: PaymentType;
  title: string;
  description: string | null;
  amount: number;
  status: PaymentStatus;
  payapp_mul_no: string | null;
  payapp_payurl: string | null;
  payapp_qrurl: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  refunded_at: string | null;
  cancel_reason: string | null;
  refund_reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type BrandProfile = {
  id: string;
  organization_id: string | null;
  user_id: string;
  brand_name: string | null;
  brand_colors: string | null;
  reference_sites: string | null;
  tone: string | null;
  forbidden_expressions: string | null;
  go_to_phrases: string | null;
  notes: string | null;
  logo_file_path: string | null;
  past_assets: unknown[];
  created_at: string;
  updated_at: string;
};

export type Service = {
  id: string;
  organization_id: string | null;
  key: string;
  name: string;
  name_en: string | null;
  description: string | null;
  category: string;
  base_price: number;
  default_delivery_days: number;
  active: boolean;
  featured: boolean;
  badge: string | null;
  icon: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ServiceOption = {
  id: string;
  service_id: string | null;
  key: string;
  label: string;
  price: number;
  active: boolean;
  sort_order: number;
  created_at: string;
};

export const PRIMARY_SERVICE_KEYS = [
  "detail",
  "sns",
  "ad",
  "thumb",
  "brand",
] as const;

export const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  content: "콘텐츠",
  ad: "광고",
  brand: "브랜드",
  package: "패키지",
  subscription: "정기 구독",
};

export type Profile = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  avatar_url: string | null;
  account_type: AccountType;
  username: string | null;
  phone: string | null;
  birth_date: string | null;
  address: string | null;
  company_name: string | null;
  representative_name: string | null;
  business_registration_number: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  business_address: string | null;
  industry: string | null;
  created_at: string;
  updated_at: string;
};

export type Inquiry = {
  id: string;
  organization_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  service_type: string | null;
  budget_range: string | null;
  message: string | null;
  source: string;
  status: InquiryStatus;
  created_at: string;
  updated_at: string;
};

export type QuoteOption = {
  key: string;
  label: string;
  price: number;
};

export type Quote = {
  id: string;
  organization_id: string | null;
  inquiry_id: string | null;
  user_id: string | null;
  title: string;
  service_id: string | null;
  service_type: string | null;
  base_price: number;
  options: QuoteOption[];
  delivery_days: number;
  subtotal: number;
  vat: number;
  total_price: number;
  deposit_rate: number;
  deposit_amount: number | null;
  balance_amount: number | null;
  payment_status: QuotePaymentStatus;
  notes: string | null;
  status: QuoteStatus;
  sent_at: string | null;
  customer_accepted_at: string | null;
  customer_rejected_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  organization_id: string | null;
  project_no: string;
  quote_id: string | null;
  inquiry_id: string | null;
  user_id: string | null;
  client_name: string;
  company: string | null;
  title: string;
  service_id: string | null;
  service_type: string | null;
  status: ProjectStatus;
  priority: Priority;
  progress: number;
  due_date: string | null;
  assigned_to: string | null;
  billing_status: BillingStatus;
  created_at: string;
  updated_at: string;
};

export type FileFolder = "draft" | "revision" | "final";

export const fileFolderLabels: Record<FileFolder, string> = {
  draft: "초안",
  revision: "수정안",
  final: "최종",
};

export type ProjectFile = {
  id: string;
  project_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  visibility: Visibility;
  folder: FileFolder;
  category: string | null;
  is_final: boolean;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export type Organization = {
  id: string;
  slug: string;
  name: string;
  display_name: string | null;
  brand_color: string | null;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type AIAssetKind =
  | "brief"
  | "copy"
  | "headline"
  | "cta"
  | "description"
  | "design_prompt";

export const aiAssetKindLabels: Record<AIAssetKind, string> = {
  brief: "제작 브리프",
  copy: "광고 카피",
  headline: "헤드라인",
  cta: "CTA",
  description: "상품 설명",
  design_prompt: "디자인 프롬프트",
};

export type AIAsset = {
  id: string;
  organization_id: string | null;
  project_id: string | null;
  quote_id: string | null;
  user_id: string | null;
  kind: AIAssetKind;
  prompt: string | null;
  output: string;
  provider: string | null;
  model: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type PortfolioStatus = "draft" | "published" | "archived";

export type PortfolioImage = {
  url: string;
  alt?: string;
  type?: "before" | "after" | "result" | "proof" | "gallery";
};

export type PortfolioProof = {
  url: string;
  name: string;
  type: "image" | "pdf";
  internal?: boolean;
};

export type PortfolioMetrics = Record<string, string>;

export type PortfolioItem = {
  id: string;
  organization_id: string | null;
  title: string;
  slug: string;
  client_name: string | null;
  brand_name: string | null;
  service_type: string | null;
  category: string | null;
  description: string | null;
  problem: string | null;
  solution: string | null;
  result_summary: string | null;
  metrics: PortfolioMetrics;
  thumbnail_url: string | null;
  images: PortfolioImage[];
  proof_files: PortfolioProof[];
  status: PortfolioStatus;
  is_featured: boolean;
  sort_order: number;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export const portfolioStatusLabels: Record<PortfolioStatus, string> = {
  draft: "초안",
  published: "공개",
  archived: "보관",
};

export type ProjectComment = {
  id: string;
  project_id: string;
  author_id: string | null;
  body: string;
  is_internal: boolean;
  attachments: unknown[];
  created_at: string;
};

export type ActivityLog = {
  id: string;
  actor_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type Setting = {
  id: string;
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
};

export const inquiryStatusLabels: Record<InquiryStatus, string> = {
  new: "신규",
  contacted: "응답 완료",
  quoted: "견적 발송",
  converted: "진행",
  in_progress: "진행",
  completed: "완료",
  archived: "보관",
};

export const quoteStatusLabels: Record<QuoteStatus, string> = {
  draft: "작성 중",
  sent: "발송됨",
  customer_review: "고객 검토",
  accepted: "수락",
  rejected: "거절",
  expired: "만료",
};

export const projectStatusLabels: Record<ProjectStatus, string> = {
  queued: "대기",
  briefing: "브리핑",
  ai_draft: "AI 초안",
  designing: "디자인",
  review: "검수",
  revision: "수정",
  delivered: "전달",
  completed: "완료",
  cancelled: "취소",
};

export const priorityLabels: Record<Priority, string> = {
  low: "낮음",
  normal: "보통",
  high: "높음",
  urgent: "긴급",
};

export const roleLabels: Record<Role, string> = {
  admin: "관리자",
  manager: "매니저",
  designer: "디자이너",
  client: "클라이언트",
};

export type SubscriptionStatus =
  | "pending_card"
  | "active"
  | "past_due"
  | "canceled"
  | "paused";

export type Subscription = {
  id: string;
  user_id: string | null;
  plan_key: string;
  plan_name: string;
  monthly_amount: number;
  description: string | null;
  status: SubscriptionStatus;
  payapp_billing_key: string | null;
  payapp_registration_url: string | null;
  payapp_registration_mul_no: string | null;
  started_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  next_charge_at: string | null;
  retry_count: number;
  last_failure_at: string | null;
  last_failure_reason: string | null;
  canceled_at: string | null;
  canceled_reason: string | null;
  canceled_by_actor: "customer" | "staff" | "system" | null;
  staff_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscriptionInvoiceStatus =
  | "pending"
  | "paid"
  | "failed"
  | "canceled";

export type SubscriptionInvoice = {
  id: string;
  subscription_id: string;
  amount: number;
  status: SubscriptionInvoiceStatus;
  period_start: string | null;
  period_end: string | null;
  attempt_number: number;
  charged_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  payapp_mul_no: string | null;
  created_at: string;
  updated_at: string;
};

export const subscriptionStatusLabels: Record<SubscriptionStatus, string> = {
  pending_card: "카드 등록 대기",
  active: "정상 결제 중",
  past_due: "결제 실패 (재시도 중)",
  canceled: "해지됨",
  paused: "일시 정지",
};

export const subscriptionInvoiceStatusLabels: Record<
  SubscriptionInvoiceStatus,
  string
> = {
  pending: "결제 대기",
  paid: "결제 완료",
  failed: "결제 실패",
  canceled: "취소됨",
};

// ============================================================
// Phase 2 — Sales / Contract / Operations
// ============================================================

export type LeadStatus =
  | "new"
  | "contacted"
  | "meeting"
  | "quoted"
  | "contract_sent"
  | "contract_signed"
  | "paid"
  | "in_progress"
  | "completed"
  | "lost";

export const leadStatusLabels: Record<LeadStatus, string> = {
  new: "신규",
  contacted: "상담 접촉",
  meeting: "미팅",
  quoted: "견적 발송",
  contract_sent: "계약 발송",
  contract_signed: "계약 완료",
  paid: "결제 완료",
  in_progress: "진행 중",
  completed: "완료",
  lost: "실패",
};

// Ordered pipeline columns for the CRM kanban board.
export const LEAD_PIPELINE: LeadStatus[] = [
  "new",
  "contacted",
  "meeting",
  "quoted",
  "contract_sent",
  "contract_signed",
  "paid",
  "in_progress",
  "completed",
  "lost",
];

export type CrmActivityType =
  | "note"
  | "status_change"
  | "call"
  | "meeting"
  | "email"
  | "quote"
  | "contract"
  | "payment"
  | "system";

export type CrmActivity = {
  id: string;
  inquiry_id: string;
  actor_id: string | null;
  type: CrmActivityType;
  from_status: string | null;
  to_status: string | null;
  body: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ContractStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "signed"
  | "expired"
  | "cancelled";

export const contractStatusLabels: Record<ContractStatus, string> = {
  draft: "작성 중",
  sent: "발송됨",
  viewed: "열람함",
  signed: "서명 완료",
  expired: "만료",
  cancelled: "취소",
};

export type Contract = {
  id: string;
  contract_number: string;
  quote_id: string | null;
  project_id: string | null;
  client_id: string | null;
  title: string;
  body: string | null;
  amount: number;
  template_kind: "website" | "detail_page" | "maintenance";
  status: ContractStatus;
  pdf_url: string | null;
  client_signature: string | null;
  admin_signature: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  signed_at: string | null;
  admin_signed_at: string | null;
  expires_at: string | null;
  current_version: number;
  metadata: Record<string, unknown>;
  created_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ContractVersion = {
  id: string;
  contract_id: string;
  version: number;
  title: string | null;
  body: string | null;
  amount: number | null;
  pdf_url: string | null;
  snapshot: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
};

export type CaseStudyStatus = "draft" | "published" | "archived";

export type CaseStudyMetric = {
  label: string;
  value: string;
  delta?: string;
};

export type CaseStudy = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  client_name: string | null;
  service_type: string | null;
  category: string | null;
  summary: string | null;
  problem: string | null;
  solution: string | null;
  result_summary: string | null;
  tech_stack: string[];
  metrics: CaseStudyMetric[];
  thumbnail_url: string | null;
  cover_url: string | null;
  portfolio_item_id: string | null;
  status: CaseStudyStatus;
  is_featured: boolean;
  sort_order: number;
  published_at: string | null;
  created_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CaseStudySectionKind =
  | "overview"
  | "problem"
  | "solution"
  | "process"
  | "result"
  | "tech"
  | "custom";

export type CaseStudySection = {
  id: string;
  case_study_id: string;
  kind: CaseStudySectionKind;
  heading: string | null;
  body: string | null;
  media: unknown[];
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ReviewStatus = "pending" | "approved" | "rejected" | "hidden";

export const reviewStatusLabels: Record<ReviewStatus, string> = {
  pending: "승인 대기",
  approved: "공개",
  rejected: "거절",
  hidden: "숨김",
};

export type Review = {
  id: string;
  author_id: string | null;
  project_id: string | null;
  author_name: string | null;
  company: string | null;
  rating: number;
  title: string | null;
  body: string;
  status: ReviewStatus;
  is_featured: boolean;
  approved_by: string | null;
  approved_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type FaqCategory = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type FaqItem = {
  id: string;
  category_id: string | null;
  question: string;
  answer: string;
  sort_order: number;
  active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

// ============================================================
// Phase 4 — Project Workspace (project management system)
// ============================================================

export type BriefStatus = "draft" | "submitted";

export type ProjectBrief = {
  id: string;
  project_id: string;
  organization_id: string | null;
  company_name: string | null;
  manager_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  production_type: string | null;
  purpose: string | null;
  target_audience: string | null;
  desired_mood: string | null;
  reference_urls: string | null;
  competitor_urls: string | null;
  must_requirements: string | null;
  status: BriefStatus;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

export const PRODUCTION_TYPES = [
  "상세페이지",
  "SNS콘텐츠",
  "홈페이지",
  "브랜딩",
  "기타",
] as const;
export type ProductionType = (typeof PRODUCTION_TYPES)[number];

export type RevisionPriority = "low" | "normal" | "high";
export type RevisionStatus =
  | "requested"
  | "reviewing"
  | "in_progress"
  | "done";

export const revisionPriorityLabels: Record<RevisionPriority, string> = {
  low: "낮음",
  normal: "보통",
  high: "높음",
};

export const revisionStatusLabels: Record<RevisionStatus, string> = {
  requested: "요청",
  reviewing: "검토중",
  in_progress: "작업중",
  done: "완료",
};

export type RevisionAttachment = {
  name: string;
  path: string;
  size: number | null;
  type: string | null;
};

export type RevisionRequest = {
  id: string;
  project_id: string;
  requester_id: string | null;
  title: string;
  content: string;
  priority: RevisionPriority;
  status: RevisionStatus;
  attachments: RevisionAttachment[];
  admin_note: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectDeliverable = {
  id: string;
  project_id: string;
  version: number;
  title: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  notes: string | null;
  is_latest: boolean;
  uploaded_by: string | null;
  created_at: string;
};

// 자료실 categories for customer-uploaded materials.
export const FILE_CATEGORIES = [
  "logo",
  "product",
  "reference",
  "document",
  "etc",
] as const;
export type FileCategory = (typeof FILE_CATEGORIES)[number];

export const fileCategoryLabels: Record<FileCategory, string> = {
  logo: "로고",
  product: "제품사진",
  reference: "레퍼런스",
  document: "문서",
  etc: "기타",
};

// ── 문의 첨부 (견적 산정용 레퍼런스) ──
export const INQUIRY_FILE_CATEGORIES = [
  "reference",
  "product",
  "logo",
  "document",
  "etc",
] as const;
export type InquiryFileCategory = (typeof INQUIRY_FILE_CATEGORIES)[number];

export const inquiryFileCategoryLabels: Record<InquiryFileCategory, string> = {
  reference: "레퍼런스 이미지",
  product: "제품 사진",
  logo: "로고",
  document: "기획 문서",
  etc: "기타",
};

export type InquiryFile = {
  id: string;
  inquiry_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  category: string | null;
  created_at: string;
};

export type Role = "admin" | "manager" | "designer" | "client";
export type AccountType = "individual" | "business";
export type InquiryStatus =
  | "new"
  | "contacted"
  | "quoted"
  | "converted"
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
  converted: "전환 완료",
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

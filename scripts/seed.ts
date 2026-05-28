/**
 * Dev seed — inserts demo inquiries, quotes, projects, activity into the boda schema.
 *
 * Refuses to run when NODE_ENV=production.
 *   npm run seed
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "path";

config({ path: path.join(process.cwd(), ".env.local") });

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed in production");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  db: { schema: "boda" },
  auth: { autoRefreshToken: false, persistSession: false },
});

const INQUIRIES = [
  { name: "박서연", email: "seo@aurabeauty.kr", phone: "010-1234-5678", company: "AURA", service_type: "상세페이지", budget_range: "300~700만", message: "신제품 비건 세럼 런칭용 상세페이지 + 광고 배너 패키지 견적 부탁드립니다.", status: "new" as const },
  { name: "이재훈", email: "jh@daily-brew.co", company: "DAILY BREW", service_type: "광고 배너", budget_range: "150~300만", message: "SS 캠페인 광고 배너 A/B 변형 12종 제작 의뢰합니다.", status: "contacted" as const },
  { name: "정민아", email: "mina@still.studio", company: "STILL", service_type: "브랜드 패키지", budget_range: "700만+", message: "라이프스타일 브랜드 비주얼 시스템 + 운영 가이드 의뢰", status: "quoted" as const },
  { name: "K Studio", email: "ops@kstudio.kr", company: "K Studio", service_type: "정기 구독", budget_range: "협의", message: "에이전시 화이트라벨, 월 5건 운영 가능 여부 문의", status: "converted" as const },
  { name: "최우진", email: "woo@pivot.kr", company: "PIVOT", service_type: "쇼츠·릴스", budget_range: "50~150만", message: "월 단위 인스타 릴스 시리즈 운영", status: "new" as const },
  { name: "장하늘", email: "haneul@tonecolab.kr", company: "TONE", service_type: "회사소개서", budget_range: "150~300만", message: "투자유치용 IR 슬라이드 제작", status: "new" as const },
  { name: "임지수", email: "ji@halocare.kr", company: "HALO", service_type: "상세페이지", budget_range: "50~150만", message: "신규 SKU 1종 상세페이지", status: "archived" as const },
  { name: "오현준", email: "hj@northup.co", company: "NORTH↑", service_type: "기타", budget_range: "협의", message: "전체 콘텐츠 운영 컨설팅 가능 여부", status: "new" as const },
];

async function main() {
  console.log("Seeding inquiries…");
  const { data: inqs, error: iErr } = await db
    .from("inquiries")
    .insert(INQUIRIES)
    .select("*");
  if (iErr) throw iErr;

  console.log(`✔ ${inqs?.length ?? 0} inquiries`);

  // Quotes for some inquiries
  const quoteSources = [inqs![1], inqs![2], inqs![3], inqs![5]];
  const { data: quotes, error: qErr } = await db
    .from("quotes")
    .insert([
      { inquiry_id: quoteSources[0].id, title: "DAILY BREW SS 캠페인 배너 12종", service_type: "광고 배너", base_price: 1490000, options: [{ key: "multi", label: "멀티포맷 변환", price: 500000 }], delivery_days: 5, total_price: 1990000, status: "sent" },
      { inquiry_id: quoteSources[1].id, title: "STILL 브랜드 비주얼 시스템", service_type: "브랜드 패키지", base_price: 2800000, options: [{ key: "guide", label: "운영 가이드 48p", price: 400000 }], delivery_days: 14, total_price: 3200000, status: "accepted" },
      { inquiry_id: quoteSources[2].id, title: "K Studio 월간 운영", service_type: "정기 구독", base_price: 3900000, options: [], delivery_days: 30, total_price: 3900000, status: "accepted" },
      { inquiry_id: quoteSources[3].id, title: "TONE 회사소개서", service_type: "회사소개서", base_price: 1490000, options: [{ key: "english", label: "영문 버전", price: 300000 }], delivery_days: 5, total_price: 1790000, status: "draft" },
      { inquiry_id: null, title: "AURA 비건 세럼 상세페이지", service_type: "상세페이지", base_price: 990000, options: [], delivery_days: 3, total_price: 990000, status: "sent" },
    ])
    .select("*");
  if (qErr) throw qErr;
  console.log(`✔ ${quotes?.length ?? 0} quotes`);

  // Projects
  const accepted = quotes!.filter((q) => q.status === "accepted");
  const { data: projects, error: pErr } = await db
    .from("projects")
    .insert([
      { quote_id: accepted[0]?.id ?? null, inquiry_id: quoteSources[1].id, client_name: "정민아", company: "STILL", title: "STILL 브랜드 비주얼 시스템", service_type: "브랜드 패키지", status: "designing", priority: "high", progress: 65 },
      { quote_id: accepted[1]?.id ?? null, inquiry_id: quoteSources[2].id, client_name: "K Studio", company: "K Studio", title: "K Studio 월간 운영 · 4월", service_type: "정기 구독", status: "review", priority: "normal", progress: 90 },
      { quote_id: null, inquiry_id: null, client_name: "AURA", company: "AURA", title: "비건 세럼 상세페이지", service_type: "상세페이지", status: "ai_draft", priority: "high", progress: 40 },
      { quote_id: null, inquiry_id: null, client_name: "MOEL", company: "MOEL", title: "SS 시즌 광고 배너 12종", service_type: "광고 배너", status: "revision", priority: "urgent", progress: 80 },
      { quote_id: null, inquiry_id: null, client_name: "PIVOT", company: "PIVOT", title: "인스타 카드뉴스 8컷", service_type: "SNS", status: "delivered", priority: "low", progress: 100 },
      { quote_id: null, inquiry_id: null, client_name: "TONE", company: "TONE", title: "리빙 브랜드 운영 가이드", service_type: "브랜드 패키지", status: "completed", priority: "normal", progress: 100 },
    ])
    .select("*");
  if (pErr) throw pErr;
  console.log(`✔ ${projects?.length ?? 0} projects`);

  // Activity
  const events = [
    { entity_type: "inquiry", entity_id: inqs![0].id, action: "created", metadata: { source: "website" } },
    { entity_type: "inquiry", entity_id: inqs![1].id, action: "status_changed", metadata: { status: "contacted" } },
    { entity_type: "quote", entity_id: quotes![0].id, action: "sent", metadata: { total_price: quotes![0].total_price } },
    { entity_type: "quote", entity_id: quotes![1].id, action: "accepted", metadata: { total_price: quotes![1].total_price } },
    { entity_type: "project", entity_id: projects![0].id, action: "created", metadata: { from_quote: accepted[0]?.id } },
    { entity_type: "project", entity_id: projects![0].id, action: "progress_changed", metadata: { progress: 65 } },
    { entity_type: "project", entity_id: projects![3].id, action: "priority_changed", metadata: { priority: "urgent" } },
    { entity_type: "project", entity_id: projects![1].id, action: "status_changed", metadata: { status: "review" } },
    { entity_type: "project", entity_id: projects![2].id, action: "status_changed", metadata: { status: "ai_draft" } },
    { entity_type: "inquiry", entity_id: inqs![2].id, action: "status_changed", metadata: { status: "quoted" } },
  ];
  const { error: aErr } = await db.from("activity_logs").insert(events);
  if (aErr) throw aErr;
  console.log(`✔ ${events.length} activity logs`);

  console.log("\nDone. Refresh /admin to see the seed data.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

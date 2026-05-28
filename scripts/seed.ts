/**
 * Dev seed — inserts demo inquiries/quotes/orders/projects on the STUDIOBODA
 * Supabase project. Refuses to run when NODE_ENV=production.
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
  auth: { autoRefreshToken: false, persistSession: false },
});

const INQUIRIES = [
  { name: "박서연",  email: "seo@aurabeauty.kr",  phone: "010-1234-5678", company: "AURA",       service_type: "상세페이지",  budget_range: "300~700만", message: "신제품 비건 세럼 런칭용 상세페이지 + 광고 배너 패키지 견적 부탁드립니다.", status: "new" as const },
  { name: "이재훈",  email: "jh@daily-brew.co",   company: "DAILY BREW", service_type: "광고 배너",    budget_range: "150~300만", message: "SS 캠페인 광고 배너 A/B 변형 12종 제작 의뢰합니다.",                       status: "contacted" as const },
  { name: "정민아",  email: "mina@still.studio",  company: "STILL",      service_type: "브랜드 패키지", budget_range: "700만+",     message: "라이프스타일 브랜드 비주얼 시스템 + 운영 가이드 의뢰",                       status: "quoted" as const },
  { name: "K Studio", email: "ops@kstudio.kr",    company: "K Studio",   service_type: "정기 구독",     budget_range: "협의",       message: "에이전시 화이트라벨, 월 5건 운영 가능 여부 문의",                            status: "converted" as const },
  { name: "최우진",  email: "woo@pivot.kr",        company: "PIVOT",      service_type: "쇼츠·릴스",    budget_range: "50~150만",   message: "월 단위 인스타 릴스 시리즈 운영",                                              status: "new" as const },
  { name: "장하늘",  email: "haneul@tonecolab.kr", company: "TONE",       service_type: "회사소개서",    budget_range: "150~300만", message: "투자유치용 IR 슬라이드 제작",                                                  status: "new" as const },
];

async function main() {
  console.log("Seeding inquiries…");
  const { data: inqs, error: iErr } = await db.from("inquiries").insert(INQUIRIES).select("*");
  if (iErr) throw iErr;
  console.log(`✔ ${inqs?.length ?? 0} inquiries`);

  console.log("\nDone. Refresh /admin to see the seed data.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileCTA } from "@/components/MobileCTA";
import { InquiryForm } from "@/components/InquiryForm";
import {
  getServiceByKey,
  listPrimaryServices,
  listServiceOptions,
} from "@/lib/queries/services";
import { SERVICE_CATEGORY_LABELS, type ServiceOption } from "@/lib/types/db";

export const revalidate = 60;

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

function buildPrefillMessage(
  name: string,
  basePrice: number,
  key: string,
  options: ServiceOption[],
) {
  const lines = [
    `[서비스 문의] ${name}`,
    `시작가: ${fmt(basePrice)}원`,
    `선택 페이지: /services/${key}`,
  ];
  if (options.length > 0) {
    lines.push(
      `추가 옵션 후보: ${options.map((o) => o.label).join(", ")}`,
    );
  }
  lines.push("", "프로젝트 목표·예산·납기·레퍼런스를 자유롭게 적어주세요.");
  return lines.join("\n");
}

// ---- per-service editorial copy (kept in code; admin-editable later) ----
const SERVICE_DETAILS: Record<
  string,
  {
    includes: string[];
    audience: string[];
    process: { step: string; label: string; desc: string }[];
  }
> = {
  detail: {
    includes: [
      "상품 분석 + 후킹 카피 5종",
      "키비주얼·USP·CTA 모듈 구성",
      "모바일 우선 그리드 + 데스크탑 변형",
      "스마트스토어 / 쿠팡 / 자사몰 호환",
      "1차 시안 24시간 · 디렉팅 수정 2회 포함",
    ],
    audience: [
      "신제품 런칭하는 D2C 브랜드",
      "전환율 개선이 필요한 스마트스토어 셀러",
      "리뉴얼이 필요한 단일 SKU",
    ],
    process: [
      { step: "01", label: "Brief", desc: "상품·USP·레퍼런스 수집" },
      { step: "02", label: "AI Direction", desc: "카피·무드보드 5종 생성" },
      { step: "03", label: "Curation", desc: "디렉터가 톤 정제, 그리드 재구성" },
      { step: "04", label: "Delivery", desc: "24시간 안에 1차 산출물 전달" },
    ],
  },
  sns: {
    includes: [
      "톤앤매너 일관성 시리즈 8컷",
      "릴스 스크립트 + 카드뉴스 템플릿",
      "Instagram / Reels / TikTok 최적화",
      "저장률 후킹 요소 (제목·CTA·해시태그)",
    ],
    audience: [
      "월 단위 SNS 운영 효율을 높이고 싶은 브랜드",
      "F&B, 뷰티, 라이프스타일 카테고리",
    ],
    process: [
      { step: "01", label: "Brief", desc: "기존 피드 톤 회수, 운영 방향 정의" },
      { step: "02", label: "AI Direction", desc: "시리즈 시안 12종 생성" },
      { step: "03", label: "Curation", desc: "디렉터 8컷 + 릴스 스크립트 큐레이션" },
      { step: "04", label: "Delivery", desc: "포맷별 export, 운영 가이드 포함" },
    ],
  },
  ad: {
    includes: [
      "Meta · GDN · Naver 채널별 사이즈",
      "A/B 변형 최대 12종",
      "CTR·CPA 데이터 기반 카피 변형",
      "런칭 48시간 후 데이터 미세 조정",
    ],
    audience: [
      "CPA 최적화가 절실한 퍼포먼스 마케터",
      "시즌 캠페인 단기 운영",
    ],
    process: [
      { step: "01", label: "Analysis", desc: "이전 캠페인 패턴 추출" },
      { step: "02", label: "AI Variations", desc: "카피·비주얼 12종 생성" },
      { step: "03", label: "Channel Tune", desc: "채널별 best 변형 선별" },
      { step: "04", label: "Live", desc: "런칭 + 48시간 데이터 분석" },
    ],
  },
  thumb: {
    includes: [
      "유튜브 16:9 + 쇼츠 9:16",
      "시리즈 톤 일관성 8종",
      "CTR 후킹 컬러·타이포 조합",
      "썸네일 운영 가이드 포함",
    ],
    audience: [
      "채널 일관성을 잡고 싶은 유튜버",
      "쇼츠 시리즈 운영자",
    ],
    process: [
      { step: "01", label: "Channel", desc: "경쟁 채널 CTR 패턴 분석" },
      { step: "02", label: "AI", desc: "시리즈 8종 시안 생성" },
      { step: "03", label: "Curation", desc: "디렉터 후킹 요소만 남기고 정제" },
      { step: "04", label: "Iterate", desc: "발행 후 CTR 기반 시리즈 수정" },
    ],
  },
  brand: {
    includes: [
      "로고 변형 + 컬러 팔레트 + 타이포 시스템",
      "운영 가이드 48p 페이지",
      "키비주얼 + 채널별 적용 템플릿",
      "시즌 콘텐츠 로드맵 1식",
    ],
    audience: [
      "신규 런칭 또는 리브랜딩 브랜드",
      "비주얼 일관성이 필요한 D2C 브랜드",
    ],
    process: [
      { step: "01", label: "Discovery", desc: "브랜드 인터뷰, 톤 키워드 정의" },
      { step: "02", label: "AI", desc: "로고·팔레트·타이포 18종 생성" },
      { step: "03", label: "System", desc: "디렉터 3안 선별 + 시스템화" },
      { step: "04", label: "Guide", desc: "48p 운영 가이드 + 템플릿 패키지" },
    ],
  },
  deck: {
    includes: [
      "기업 강점·수치 정리",
      "PPT / PDF / 웹슬라이드 포맷",
      "투자자·파트너·고객 버전 분리",
      "20–30p 표준 구성",
    ],
    audience: ["IR / 사업 제안 / 파트너십 단계"],
    process: [
      { step: "01", label: "Brief", desc: "강점·KPI·메시지 정리" },
      { step: "02", label: "Outline", desc: "AI 초안 + 데이터 시각화" },
      { step: "03", label: "Refine", desc: "디렉터 톤 정제" },
      { step: "04", label: "Export", desc: "PPT/PDF/웹 동시 발행" },
    ],
  },
  package: {
    includes: [
      "상세페이지 + 광고 + SNS 풀세트",
      "키비주얼 시스템 정렬",
      "시즌 콘텐츠 로드맵",
      "디렉터 전담 운영",
    ],
    audience: [
      "신규 런칭 / 리브랜딩 단위",
      "여러 채널 동시 정비가 필요한 브랜드",
    ],
    process: [
      { step: "01", label: "Discovery", desc: "전 채널 진단" },
      { step: "02", label: "System", desc: "통합 비주얼 시스템 설계" },
      { step: "03", label: "Production", desc: "채널별 산출물 동시 제작" },
      { step: "04", label: "Handover", desc: "운영 가이드 + 후속 지원" },
    ],
  },
  subscription: {
    includes: [
      "월 정해진 수량 콘텐츠 제작",
      "전담 디렉터 1인",
      "월간 퍼포먼스 리포트",
      "긴급 작업 우선 큐 (선택)",
    ],
    audience: [
      "지속적인 콘텐츠 운영이 필요한 브랜드",
      "월 5건+ 콘텐츠 운영팀",
    ],
    process: [
      { step: "01", label: "Onboard", desc: "브랜드 톤 + 운영 가이드 학습" },
      { step: "02", label: "Monthly", desc: "월 단위 일정 협의" },
      { step: "03", label: "Production", desc: "정기 제작 + 검수" },
      { step: "04", label: "Report", desc: "월간 데이터 + 차월 계획" },
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: { key: string };
}): Promise<Metadata> {
  const s = await getServiceByKey(params.key);
  if (!s) return { title: "서비스를 찾을 수 없습니다" };
  return {
    title: `${s.name} · STUDIO BODA`,
    description:
      s.description ??
      `${s.name} (${s.name_en ?? ""}) — STUDIO BODA가 AI 자동화 + 디렉터 큐레이션으로 제작합니다.`,
    openGraph: {
      title: `STUDIO BODA · ${s.name}`,
      description: s.description ?? undefined,
      type: "article",
    },
  };
}

export async function generateStaticParams() {
  const primary = await listPrimaryServices();
  return primary.map((s) => ({ key: s.key }));
}

export default async function ServiceDetailPage({
  params,
}: {
  params: { key: string };
}) {
  const service = await getServiceByKey(params.key);
  if (!service) notFound();

  const options = await listServiceOptions(service.id);
  const detail = SERVICE_DETAILS[service.key];
  const categoryLabel =
    SERVICE_CATEGORY_LABELS[service.category] ?? service.category;

  return (
    <>
      <Header />
      <main className="pt-24">
        <section className="px-5 pb-12 pt-8 sm:px-8 lg:px-12 lg:pb-16 lg:pt-12">
          <nav className="mb-6 text-[12px] text-ink-50">
            <Link href="/services" className="hover:text-iris">
              서비스
            </Link>
            <span className="mx-2 text-ink-30">/</span>
            <span className="text-ink-100">{service.name}</span>
          </nav>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-ink-5 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-caption text-ink-70">
                  {categoryLabel}
                </span>
                {service.badge ? (
                  <span className="rounded-full bg-iris-light px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-caption text-iris">
                    {service.badge}
                  </span>
                ) : null}
                {service.name_en ? (
                  <span className="font-mono text-[11px] uppercase tracking-caption text-ink-50">
                    {service.name_en}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-4 font-display text-[36px] font-extrabold leading-[1.1] tracking-display text-ink-100 sm:text-[44px] lg:text-[52px]">
                {service.name}
              </h1>
              <p className="mt-5 max-w-[560px] text-[15px] leading-body text-ink-70">
                {service.description}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="#inquiry"
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-iris px-7 font-display text-[14px] font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iris/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  견적 요청하기
                  <span className="transition-transform duration-150 group-hover:translate-x-0.5">
                    →
                  </span>
                </a>
                <Link
                  href="/services"
                  className="inline-flex h-12 items-center rounded-xl border border-ink-15 bg-white px-6 text-[14px] font-bold text-ink-70 transition-colors hover:border-ink-30 hover:text-ink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iris/40 focus-visible:ring-offset-2"
                >
                  전체 서비스 보기
                </Link>
              </div>
            </div>

            <aside className="rounded-2xl border border-ink-15 bg-white p-6 lg:sticky lg:top-24">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Meta label="시작가" value={`${fmt(service.base_price)}원~`} accent />
                <Meta label="기본 납기" value={`${service.default_delivery_days}일`} />
                <Meta label="카테고리" value={categoryLabel} />
                <Meta
                  label="포맷"
                  value={service.name_en ?? "All channels"}
                />
              </div>
              {options.length > 0 ? (
                <div className="mt-5 border-t border-ink-15 pt-4">
                  <p className="font-display text-[10px] font-bold uppercase tracking-caption text-ink-50">
                    추가 옵션
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {options.map((o) => (
                      <li
                        key={o.id}
                        className="flex items-center justify-between text-[12.5px]"
                      >
                        <span className="text-ink-70">{o.label}</span>
                        <span className="num font-display font-bold text-ink-100">
                          +{fmt(o.price)}원
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </aside>
          </div>
        </section>

        {detail ? (
          <>
            <section className="border-t border-ink-15 bg-ink-5 px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
                <article>
                  <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-iris">
                    Includes
                  </p>
                  <h2 className="mt-2 font-display text-[20px] font-extrabold tracking-tightish text-ink-100 sm:text-[24px]">
                    이런 산출물이 포함됩니다
                  </h2>
                  <ul className="mt-5 space-y-2.5">
                    {detail.includes.map((it) => (
                      <li key={it} className="flex items-start gap-3">
                        <i
                          className="ti ti-check mt-0.5 text-[16px] text-iris"
                          aria-hidden
                        />
                        <span className="text-[14px] leading-body text-ink-70">
                          {it}
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>

                <article>
                  <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-iris">
                    Audience
                  </p>
                  <h2 className="mt-2 font-display text-[20px] font-extrabold tracking-tightish text-ink-100 sm:text-[24px]">
                    이런 브랜드에 잘 맞습니다
                  </h2>
                  <ul className="mt-5 space-y-2.5">
                    {detail.audience.map((it) => (
                      <li key={it} className="flex items-start gap-3">
                        <i
                          className="ti ti-target text-[16px] text-iris mt-0.5"
                          aria-hidden
                        />
                        <span className="text-[14px] leading-body text-ink-70">
                          {it}
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            </section>

            <section className="border-t border-ink-15 bg-white px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
              <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-iris">
                Process
              </p>
              <h2 className="mt-2 font-display text-[20px] font-extrabold tracking-tightish text-ink-100 sm:text-[24px]">
                어떻게 진행되나요
              </h2>
              <ol className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {detail.process.map((p) => (
                  <li
                    key={p.step}
                    className="rounded-2xl border border-ink-15 bg-white p-5"
                  >
                    <span className="num font-mono text-[11px] uppercase tracking-caption text-ink-50">
                      {p.step}
                    </span>
                    <p className="mt-2 font-display text-[14px] font-extrabold tracking-tightish text-ink-100">
                      {p.label}
                    </p>
                    <p className="mt-1.5 text-[12.5px] leading-body text-ink-70">
                      {p.desc}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          </>
        ) : null}

        <section
          id="inquiry"
          className="relative overflow-hidden border-t border-ink-15 bg-ink-100 px-5 py-14 text-white sm:px-8 lg:px-12 lg:py-20"
        >
          <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-iris-grad opacity-25 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-iris-grad opacity-15 blur-3xl" />

          <div className="relative mx-auto grid w-full max-w-[1080px] grid-cols-1 items-start gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="font-display text-[11px] font-bold uppercase tracking-eyebrow text-iris-glow">
                Get started
              </p>
              <h2 className="mt-3 font-display text-[28px] font-extrabold leading-[1.15] tracking-display sm:text-[34px]">
                이 서비스로 견적을
                <br />
                받아보세요
              </h2>
              <p className="mt-3 max-w-[440px] text-[14px] leading-body text-ink-30">
                <b className="text-white">{service.name}</b>{" "}
                {service.name_en ? (
                  <span className="font-mono text-[11px] text-ink-50">
                    ({service.name_en})
                  </span>
                ) : null}{" "}
                · 시작가 {fmt(service.base_price)}원, 기본 납기{" "}
                {service.default_delivery_days}일. 브리프만 보내주시면 24시간 안에
                회신드립니다.
              </p>

              <ul className="mt-6 hidden flex-col gap-2 sm:flex">
                <Step
                  n="01"
                  label="브리프 작성"
                  desc="이 폼에 목표·예산·일정을 적어주세요"
                />
                <Step
                  n="02"
                  label="견적 발행"
                  desc="평균 24시간 이내 견적서 발송"
                />
                <Step
                  n="03"
                  label="작업 시작"
                  desc="수락 + 결제 후 제작 자동 시작"
                />
              </ul>

              <p className="mt-6 text-[11.5px] text-ink-30">
                회원이라면{" "}
                <Link
                  href={`/login?next=/services/${service.key}`}
                  className="font-bold text-iris-glow hover:text-white"
                >
                  로그인
                </Link>
                해서 더 빠르게, 처음이라면{" "}
                <Link
                  href="/signup"
                  className="font-bold text-iris-glow hover:text-white"
                >
                  회원가입
                </Link>
                도 가능합니다. 비회원도 이 폼으로 문의 가능합니다.
              </p>
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-[20px] border border-ink-90 bg-ink-90/40 p-5 backdrop-blur-sm sm:p-6">
                <div className="flex items-center justify-between border-b border-ink-90 pb-3.5">
                  <p className="font-display text-[10px] font-bold uppercase tracking-eyebrow text-ink-30">
                    {service.name} · Inquiry
                  </p>
                  <span className="num font-mono text-[10px] text-ink-50">
                    AVG · 24H
                  </span>
                </div>
                <div className="mt-4">
                  <InquiryForm
                    variant="dark"
                    defaults={{
                      service_type: service.name,
                      message: buildPrefillMessage(service.name, service.base_price, service.key, options),
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Link
                  href="/services"
                  className="text-[12px] font-bold text-ink-30 hover:text-white"
                >
                  ← 다른 서비스 보기
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <MobileCTA />
    </>
  );
}

function Meta({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="font-display text-[10px] font-bold uppercase tracking-caption text-ink-50">
        {label}
      </p>
      <p
        className={`num mt-0.5 font-display text-[16px] font-extrabold tracking-tightish ${
          accent ? "text-iris" : "text-ink-100"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Step({
  n,
  label,
  desc,
}: {
  n: string;
  label: string;
  desc: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-ink-90 bg-ink-100/60 px-3.5 py-2.5">
      <span className="num grid h-7 w-7 shrink-0 place-items-center rounded-md bg-iris/20 font-display text-[11px] font-bold text-iris-glow">
        {n}
      </span>
      <div className="min-w-0">
        <p className="font-display text-[13px] font-bold text-white">{label}</p>
        <p className="mt-0.5 text-[11px] text-ink-30">{desc}</p>
      </div>
    </li>
  );
}

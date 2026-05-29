import { brand, contactInfo } from "@/lib/site-data";
import { InquiryForm } from "./InquiryForm";

export function CTASection() {
  return (
    <section
      className="relative overflow-hidden bg-white px-5 py-20 sm:px-8 lg:px-12 lg:py-24"
      id="contact"
    >
      {/* Very soft iris tint matching the Hero — keeps the page tone calm. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px]"
        aria-hidden
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(110,91,255,0.06) 0%, rgba(110,91,255,0) 70%)",
        }}
      />

      <div className="relative mx-auto grid max-w-[1100px] grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/[0.08] px-3 py-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
            <span className="text-[11.5px] font-semibold text-success">
              {contactInfo.newProjectStatus}
            </span>
          </div>

          <h2 className="mt-5 font-display text-[28px] font-extrabold leading-[1.18] tracking-[-0.8px] text-ink-100 sm:text-[34px] lg:text-[40px]">
            {brand.slogan}
            <br />
            <span className="text-iris">24시간 안에</span> 회신드립니다.
          </h2>

          <p className="mt-4 max-w-[480px] text-[14.5px] leading-[1.7] text-ink-70 sm:text-[15.5px]">
            브랜드 · 상품 · 목표만 알려주세요. NDA가 필요한 프로젝트도 사전 검토 후 진행합니다.
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-ink-50">
            <li className="inline-flex items-center gap-1.5">
              <i className="ti ti-clock text-[14px] text-iris" aria-hidden />
              {contactInfo.responseTime}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <i className="ti ti-calendar text-[14px] text-iris" aria-hidden />
              {contactInfo.workHours}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <i className="ti ti-shield-check text-[14px] text-iris" aria-hidden />
              {contactInfo.nda}
            </li>
          </ul>
        </div>

        <div id="inquiry">
          <div className="rounded-2xl border border-ink-15 bg-white p-5 shadow-[0_2px_10px_-4px_rgba(20,20,40,0.06)] sm:p-6">
            <InquiryForm variant="light" />
          </div>
        </div>
      </div>
    </section>
  );
}

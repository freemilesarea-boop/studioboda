import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./ui/Reveal";
import { services } from "@/lib/site-data";

type ServiceCode = (typeof services)[number]["code"];

export function ServiceLineup() {
  return (
    <section className="section bg-ink-05" id="services">
      <div className="container">
        <SectionHeader
          eyebrow="SERVICES · LINEUP"
          title={
            <>
              한 채널이 아닌,
              <br />
              브랜드 전 영역을 다룹니다.
            </>
          }
          desc="상세페이지부터 광고, SNS, 썸네일, 브랜드 아이덴티티까지. 채널별로 따로 만들지 않고 일관된 톤으로 제작합니다."
        />

        <div className="mt-14 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Reveal key={s.code} delay={i * 0.04}>
              <article className="group relative h-full overflow-hidden rounded-3xl border border-ink-15 bg-white p-6 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-ink-30 hover:shadow-soft">
                <div className="flex items-start justify-between">
                  <ServiceIcon code={s.code} />
                  <div className="text-right">
                    <span className="meta">{s.code}</span>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="meta">{s.en}</div>
                  <h3 className="mt-2 font-sans text-2xl font-semibold tracking-tightest text-ink-100">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-[1.65] text-ink-70">
                    {s.desc}
                  </p>
                </div>

                <ul className="mt-6 space-y-1.5 border-t border-ink-15 pt-4">
                  {s.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex items-center gap-2 text-sm text-ink-70"
                    >
                      <span className="inline-block h-1 w-1 rounded-full bg-ink-30 transition-colors duration-300 group-hover:bg-iris" />
                      {b}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}

          <Reveal delay={services.length * 0.04}>
            <article className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-ink-100 bg-ink-100 p-6 text-white">
              <div>
                <div className="meta-dark">CUSTOM</div>
                <h3 className="mt-2 font-sans text-2xl font-semibold tracking-tightest">
                  필요한 조합을 직접 설계합니다.
                </h3>
                <p className="mt-3 text-[15px] leading-[1.65] text-white/70">
                  단일 서비스부터 패키지, 시즌 단위 운영까지. 브랜드 상황에 맞춰
                  최적의 구성으로 제안드립니다.
                </p>
              </div>
              <a
                href="#contact"
                className="mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white transition-colors hover:border-white/40 hover:bg-white/10"
              >
                커스텀 견적 요청 →
              </a>
              <div className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-iris-grad opacity-40 blur-3xl" />
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function ServiceIcon({ code }: { code: ServiceCode }) {
  const common =
    "h-11 w-11 rounded-2xl border border-ink-15 bg-ink-05 text-ink-100 grid place-items-center transition-colors duration-300 group-hover:border-iris/30 group-hover:bg-iris/5 group-hover:text-iris";
  if (code === "S01")
    return (
      <div className={common}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
          <rect x="3.5" y="2.5" width="13" height="15" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M6.5 6.5h7M6.5 9.5h7M6.5 12.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
    );
  if (code === "S02")
    return (
      <div className={common}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
          <rect x="3" y="3" width="14" height="14" rx="4" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="10" cy="10" r="3.2" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="14" cy="6" r="1" fill="currentColor" />
        </svg>
      </div>
    );
  if (code === "S03")
    return (
      <div className={common}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
          <rect x="2.5" y="5" width="15" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M2.5 10h15" stroke="currentColor" strokeWidth="1.4" />
          <path d="M6 13l1.5-3 1.5 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  if (code === "S04")
    return (
      <div className={common}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
          <rect x="2.5" y="4" width="15" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8.5 8.2v3.6L12 10z" fill="currentColor" />
        </svg>
      </div>
    );
  return (
    <div className={common}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="10" cy="10" r="3.2" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="10" cy="3" r="0.9" fill="#5B47FF" />
      </svg>
    </div>
  );
}

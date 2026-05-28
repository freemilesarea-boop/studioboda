import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./ui/Reveal";
import { ArrowIcon, LinkButton } from "./ui/Button";
import { packages } from "@/lib/site-data";

export function Packages() {
  return (
    <section className="section" id="packages">
      <div className="container">
        <SectionHeader
          eyebrow="PACKAGES · BY GOAL"
          title={
            <>
              규모가 아닌
              <br />
              목표로 시작하세요.
            </>
          }
          desc="콘텐츠 단발 운영부터 브랜드 전체 정비까지. 상황에 맞는 패키지로 시작하고, 필요한 만큼 확장합니다."
        />

        <div className="mt-14 grid grid-cols-1 gap-3 lg:grid-cols-3">
          {packages.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.05}>
              <article
                className={`relative flex h-full flex-col overflow-hidden rounded-3xl p-7 sm:p-8 ${
                  p.featured
                    ? "border border-ink-100 bg-ink-100 text-white"
                    : "border border-ink-15 bg-white text-ink-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={p.featured ? "meta-dark" : "meta"}>
                    {p.en}
                  </span>
                  {p.featured && (
                    <span className="rounded-full bg-iris px-2.5 py-1 font-mono text-[10px] uppercase tracking-meta text-white">
                      RECOMMENDED
                    </span>
                  )}
                </div>

                <h3
                  className={`mt-8 font-sans text-3xl font-semibold tracking-tightest ${
                    p.featured ? "text-white" : "text-ink-100"
                  }`}
                >
                  {p.name}
                </h3>
                <p
                  className={`mt-2 text-[15px] ${
                    p.featured ? "text-white/70" : "text-ink-70"
                  }`}
                >
                  {p.summary}
                </p>

                <ul
                  className={`mt-7 space-y-2 border-t pt-5 ${
                    p.featured ? "border-white/10" : "border-ink-15"
                  }`}
                >
                  {p.items.map((it) => (
                    <li
                      key={it}
                      className={`flex items-start gap-2.5 text-sm ${
                        p.featured ? "text-white/85" : "text-ink-70"
                      }`}
                    >
                      <span
                        className={`mt-2 inline-block h-1 w-1 shrink-0 rounded-full ${
                          p.featured ? "bg-white/50" : "bg-ink-30"
                        }`}
                      />
                      {it}
                    </li>
                  ))}
                </ul>

                <p
                  className={`mt-7 text-xs leading-[1.6] ${
                    p.featured ? "text-white/55" : "text-ink-50"
                  }`}
                >
                  {p.note}
                </p>

                <div className="mt-8">
                  {p.featured ? (
                    <a
                      href="#contact"
                      className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-[15px] font-medium text-ink-100 transition-colors hover:bg-ink-05"
                    >
                      {p.cta} <ArrowIcon />
                    </a>
                  ) : (
                    <LinkButton
                      href="#contact"
                      size="md"
                      variant="secondary"
                      className="w-full"
                    >
                      {p.cta} <ArrowIcon />
                    </LinkButton>
                  )}
                </div>

                {p.featured && (
                  <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-iris-grad opacity-30 blur-3xl" />
                )}
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="mt-8 text-center text-xs text-ink-50">
            모든 패키지의 정확한 견적은 브랜드, 카테고리, 운영 채널, 산출물 수량에 따라 산정됩니다. 부담 없이 문의 주세요.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

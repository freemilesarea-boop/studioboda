import { ArrowIcon, LinkButton } from "./ui/Button";
import { Reveal } from "./ui/Reveal";
import { brand } from "@/lib/site-data";

export function FinalCTA() {
  return (
    <section className="section relative overflow-hidden" id="contact">
      <div className="container">
        <div className="relative overflow-hidden rounded-[2rem] border border-ink-100 bg-ink-100 px-6 py-16 text-white sm:rounded-[2.5rem] sm:px-12 sm:py-20 lg:px-16 lg:py-24">
          <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-iris-grad opacity-30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-iris-grad opacity-20 blur-3xl" />
          <div className="noise" />

          <div className="relative grid grid-cols-1 items-end gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Reveal>
                <div className="meta-dark">CONTACT · NEXT MOVE</div>
              </Reveal>
              <Reveal delay={0.06}>
                <h2 className="mt-5 text-balance font-sans text-[40px] font-semibold leading-[1.05] tracking-tightest sm:text-[56px] lg:text-[64px]">
                  브랜드가 보이는
                  <br />
                  방식을 바꾸세요.
                </h2>
              </Reveal>
              <Reveal delay={0.12}>
                <p className="mt-5 max-w-xl text-balance text-base leading-[1.65] text-white/70 sm:text-lg">
                  STUDIO BODA가 내일 바로 쓸 수 있는 크리에이티브를 만듭니다.
                  메일로 브랜드와 목표를 알려주시면 24시간 안에 회신드립니다.
                </p>
              </Reveal>
            </div>

            <div className="lg:col-span-5">
              <Reveal delay={0.18}>
                <div className="flex flex-col gap-4">
                  <LinkButton
                    href={`mailto:${brand.email}?subject=STUDIO%20BODA%20프로젝트%20문의`}
                    size="lg"
                    className="w-full bg-white text-ink-100 hover:bg-ink-05"
                  >
                    프로젝트 문의하기 <ArrowIcon />
                  </LinkButton>

                  <a
                    href={`mailto:${brand.email}`}
                    className="group flex items-center justify-between rounded-3xl border border-white/15 bg-white/[0.04] px-5 py-5 transition-colors hover:border-white/30 hover:bg-white/[0.08]"
                  >
                    <div>
                      <div className="meta-dark">EMAIL</div>
                      <div className="mt-2 font-mono text-base text-white sm:text-lg">
                        {brand.email}
                      </div>
                    </div>
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-transform duration-200 group-hover:translate-x-0.5">
                      <ArrowIcon />
                    </span>
                  </a>

                  <div className="grid grid-cols-2 gap-3">
                    <Stat label="평균 회신" value="24H" />
                    <Stat label="기준 납기" value="24H" />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4">
      <div className="meta-dark">{label}</div>
      <div className="mt-2 font-sans text-2xl font-semibold tracking-tightest text-white">
        {value}
      </div>
    </div>
  );
}

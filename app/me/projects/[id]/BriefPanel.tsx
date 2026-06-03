"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveBriefAction, type BriefInput } from "@/lib/actions/project-workspace";
import { useToast } from "@/components/admin/Toast";
import { PRODUCTION_TYPES, type ProjectBrief } from "@/lib/types/db";

const EMPTY: BriefInput = {
  company_name: "",
  manager_name: "",
  contact_phone: "",
  contact_email: "",
  production_type: "상세페이지",
  purpose: "",
  target_audience: "",
  desired_mood: "",
  reference_urls: "",
  competitor_urls: "",
  must_requirements: "",
};

export function BriefPanel({
  projectId,
  brief,
}: {
  projectId: string;
  brief: ProjectBrief | null;
}) {
  const [form, setForm] = useState<BriefInput>(() =>
    brief
      ? {
          company_name: brief.company_name ?? "",
          manager_name: brief.manager_name ?? "",
          contact_phone: brief.contact_phone ?? "",
          contact_email: brief.contact_email ?? "",
          production_type: brief.production_type ?? "상세페이지",
          purpose: brief.purpose ?? "",
          target_audience: brief.target_audience ?? "",
          desired_mood: brief.desired_mood ?? "",
          reference_urls: brief.reference_urls ?? "",
          competitor_urls: brief.competitor_urls ?? "",
          must_requirements: brief.must_requirements ?? "",
        }
      : EMPTY,
  );
  const [pending, startTransition] = useTransition();
  const { push } = useToast();
  const router = useRouter();
  const submitted = brief?.status === "submitted";

  const set = (k: keyof BriefInput) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  function save(submit: boolean) {
    startTransition(async () => {
      const r = await saveBriefAction(projectId, form, submit);
      if (r.ok) {
        push(submit ? "브리프를 제출했습니다" : "임시 저장되었습니다", "success");
        router.refresh();
      } else {
        push(r.error ?? "저장 실패", "error");
      }
    });
  }

  return (
    <div className="space-y-5">
      {submitted ? (
        <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-[12.5px] text-success">
          <i className="ti ti-circle-check text-[16px]" aria-hidden />
          <span className="font-display font-bold">
            브리프가 제출되었습니다.
          </span>
          <span className="text-success/80">
            내용은 언제든 다시 수정해 저장할 수 있습니다.
          </span>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-[12.5px] text-warning">
          <i className="ti ti-alert-circle mt-0.5 text-[16px]" aria-hidden />
          <span>
            <strong className="font-display font-bold">브리프 제출은 필수입니다.</strong>{" "}
            정확한 제작을 위해 아래 내용을 작성하고 제출해주세요. 제출 전까지
            제작이 시작되지 않습니다.
          </span>
        </div>
      )}

      <Section title="기본 정보">
        <Grid>
          <Field label="회사명 *">
            <Input value={form.company_name} onChange={set("company_name")} placeholder="(주)보다" />
          </Field>
          <Field label="담당자명 *">
            <Input value={form.manager_name} onChange={set("manager_name")} placeholder="홍길동" />
          </Field>
          <Field label="연락처 *">
            <Input value={form.contact_phone} onChange={set("contact_phone")} placeholder="010-1234-5678" />
          </Field>
          <Field label="이메일">
            <Input value={form.contact_email} onChange={set("contact_email")} placeholder="name@company.com" />
          </Field>
        </Grid>
      </Section>

      <Section title="제작 정보">
        <Field label="제작 유형">
          <div className="flex flex-wrap gap-1.5">
            {PRODUCTION_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("production_type")(t)}
                className={`rounded-lg border px-3 py-1.5 font-display text-[12px] font-bold transition-colors ${
                  form.production_type === t
                    ? "border-iris bg-iris text-white"
                    : "border-ink-15 bg-white text-ink-70 hover:border-ink-30"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>
        <Field label="제작 목적 *">
          <Textarea value={form.purpose} onChange={set("purpose")} placeholder="예: 신제품 출시에 맞춰 전환율 높은 상세페이지가 필요합니다." />
        </Field>
        <Field label="목표 고객층">
          <Textarea value={form.target_audience} onChange={set("target_audience")} rows={2} placeholder="예: 30~40대 직장인 여성, 건강에 관심 많은 1인 가구" />
        </Field>
        <Field label="원하는 분위기 / 톤">
          <Textarea value={form.desired_mood} onChange={set("desired_mood")} rows={2} placeholder="예: 미니멀하고 신뢰감 있는, 파스텔 톤" />
        </Field>
      </Section>

      <Section title="참고 자료">
        <Field label="참고 사이트 URL">
          <Textarea value={form.reference_urls} onChange={set("reference_urls")} rows={2} placeholder="마음에 드는 사이트 주소를 줄바꿈으로 여러 개 입력하세요." />
        </Field>
        <Field label="경쟁사 URL">
          <Textarea value={form.competitor_urls} onChange={set("competitor_urls")} rows={2} placeholder="경쟁사·벤치마크 주소" />
        </Field>
        <Field label="필수 요청사항 *">
          <Textarea value={form.must_requirements} onChange={set("must_requirements")} rows={4} placeholder="꼭 반영되어야 하는 내용, 피해야 할 표현, 필수 문구 등을 적어주세요." />
        </Field>
      </Section>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-ink-15 pt-4">
        <button
          type="button"
          onClick={() => save(false)}
          disabled={pending}
          className="inline-flex h-10 items-center rounded-lg border border-ink-15 bg-white px-4 font-display text-[12.5px] font-bold text-ink-70 hover:border-ink-30 hover:text-ink-100 disabled:opacity-60"
        >
          임시 저장
        </button>
        <button
          type="button"
          onClick={() => save(true)}
          disabled={pending}
          className="inline-flex h-10 items-center rounded-lg bg-iris px-5 font-display text-[12.5px] font-bold text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "저장 중…" : submitted ? "수정 후 다시 제출 →" : "브리프 제출 →"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="font-display text-[12px] font-bold uppercase tracking-caption text-ink-50">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11.5px] font-display font-bold text-ink-70">{label}</span>
      {children}
    </label>
  );
}
function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-10 w-full rounded-md border border-ink-15 bg-white px-3 text-[13px] outline-none focus:border-iris/60"
    />
  );
}
function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full resize-y rounded-md border border-ink-15 bg-white px-3 py-2.5 text-[13px] leading-body outline-none focus:border-iris/60"
    />
  );
}

"use client";

import { useState } from "react";
import { IndividualForm } from "./IndividualForm";
import { BusinessForm } from "./BusinessForm";

type Tab = "individual" | "business";

export function SignupTabs() {
  const [tab, setTab] = useState<Tab>("individual");

  return (
    <div>
      <div className="flex items-center justify-between border-b border-ink-90 pb-3.5">
        <p className="font-display text-[10px] font-bold uppercase tracking-eyebrow text-ink-30">
          Sign up
        </p>
        <span className="num font-mono text-[10px] text-ink-50">
          {tab === "individual" ? "INDIVIDUAL" : "BUSINESS"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-1.5">
        <TabButton
          active={tab === "individual"}
          icon="ti-user"
          label="일반 회원"
          onClick={() => setTab("individual")}
        />
        <TabButton
          active={tab === "business"}
          icon="ti-building"
          label="사업자 회원"
          onClick={() => setTab("business")}
        />
      </div>

      <div className="mt-5">
        {tab === "individual" ? <IndividualForm /> : <BusinessForm />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 font-display text-[12.5px] font-bold transition-colors ${
        active
          ? "border-iris-glow/60 bg-iris/20 text-white"
          : "border-white/10 bg-white/[0.02] text-ink-30 hover:border-white/20 hover:text-white"
      }`}
    >
      <i
        className={`ti ${icon} text-[14px] ${active ? "text-iris-glow" : "text-ink-50"}`}
        aria-hidden
      />
      {label}
    </button>
  );
}

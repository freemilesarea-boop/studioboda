"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// ============================================================
// STUDIO BODA — Admin sidebar (grouped, Korean IA)
// ============================================================
// Every existing /admin route is preserved — only the sidebar *grouping* and
// labels changed. Routes are organised into 8 operator-centric groups. Groups
// with a single destination render as a direct link; multi-destination groups
// are collapsible and auto-expand when they contain the active route. No route
// is removed, so any hidden page remains reachable by direct URL.
// ============================================================

type NavChild = { href: string; label: string; icon: string };
type NavGroup = {
  id: string;
  label: string;
  icon: string;
  children: NavChild[];
};

const GROUPS: NavGroup[] = [
  {
    id: "dashboard",
    label: "대시보드",
    icon: "ti-layout-dashboard",
    children: [
      { href: "/admin", label: "대시보드", icon: "ti-layout-dashboard" },
      { href: "/admin/dashboard", label: "대표 현황", icon: "ti-chart-arcs" },
    ],
  },
  {
    id: "customers",
    label: "고객/문의 관리",
    icon: "ti-users",
    children: [
      { href: "/admin/crm", label: "고객 보드", icon: "ti-layout-kanban" },
      { href: "/admin/inquiries", label: "문의 내역", icon: "ti-mail" },
      { href: "/admin/members", label: "고객 계정", icon: "ti-user-circle" },
    ],
  },
  {
    id: "sales",
    label: "견적/계약 관리",
    icon: "ti-file-invoice",
    children: [
      { href: "/admin/quotes", label: "견적서", icon: "ti-file-invoice" },
      { href: "/admin/contracts", label: "계약서", icon: "ti-file-text" },
      { href: "/admin/contract-clauses", label: "계약 조항", icon: "ti-list-details" },
    ],
  },
  {
    id: "billing",
    label: "결제/정산 관리",
    icon: "ti-credit-card",
    children: [
      { href: "/admin/payments", label: "결제 내역", icon: "ti-credit-card" },
      { href: "/admin/subscriptions", label: "정기결제", icon: "ti-repeat" },
    ],
  },
  {
    id: "projects",
    label: "프로젝트 관리",
    icon: "ti-folders",
    children: [{ href: "/admin/projects", label: "프로젝트", icon: "ti-folders" }],
  },
  {
    id: "content",
    label: "콘텐츠 관리",
    icon: "ti-photo",
    children: [
      { href: "/admin/portfolio", label: "포트폴리오", icon: "ti-photo" },
      { href: "/admin/case-studies", label: "사례관리", icon: "ti-award" },
      { href: "/admin/reviews", label: "리뷰관리", icon: "ti-star" },
      { href: "/admin/faq", label: "자주 묻는 질문", icon: "ti-help-circle" },
    ],
  },
  {
    id: "notifications",
    label: "알림/메일 설정",
    icon: "ti-bell-cog",
    children: [
      {
        href: "/admin/notifications/settings",
        label: "알림/메일 설정",
        icon: "ti-bell-cog",
      },
    ],
  },
  {
    id: "system",
    label: "시스템 설정",
    icon: "ti-settings",
    children: [{ href: "/admin/settings", label: "시스템 설정", icon: "ti-settings" }],
  },
];

function isChildActive(href: string, pathname: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname();
  const activeGroupId =
    GROUPS.find((g) => g.children.some((c) => isChildActive(c.href, pathname)))
      ?.id ?? null;

  // Manual open/close overrides. When unset, a group defaults to open iff it
  // holds the active route — so the current section is always visible.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const isOpen = (id: string) => overrides[id] ?? id === activeGroupId;
  const toggle = (id: string) =>
    setOverrides((prev) => ({ ...prev, [id]: !(prev[id] ?? id === activeGroupId) }));

  return (
    <aside className="hidden lg:flex lg:w-[232px] lg:shrink-0 lg:flex-col lg:border-r lg:border-ink-90 lg:bg-ink-100">
      <div className="flex h-[60px] items-center gap-2.5 border-b border-ink-90 px-5">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-iris">
          <span className="font-display text-[11px] font-bold text-white">B</span>
        </span>
        <span className="font-display text-[14px] font-bold text-white">
          STUDIO BODA <span className="text-ink-30">관리자</span>
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {GROUPS.map((group) => {
          // Single-destination group → render as a plain link (no accordion).
          if (group.children.length === 1) {
            const child = group.children[0];
            const active = isChildActive(child.href, pathname);
            return (
              <Link
                key={group.id}
                href={child.href}
                className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors duration-150 ${
                  active
                    ? "bg-iris/15 text-white"
                    : "text-ink-30 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <i
                  className={`ti ${group.icon} text-[16px] ${active ? "text-iris-glow" : "text-ink-50 group-hover:text-ink-30"}`}
                  aria-hidden
                />
                {group.label}
              </Link>
            );
          }

          const open = isOpen(group.id);
          const groupActive = group.id === activeGroupId;
          return (
            <div key={group.id}>
              <button
                type="button"
                onClick={() => toggle(group.id)}
                aria-expanded={open}
                className={`group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors duration-150 ${
                  groupActive
                    ? "text-white"
                    : "text-ink-30 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <i
                  className={`ti ${group.icon} text-[16px] ${groupActive ? "text-iris-glow" : "text-ink-50 group-hover:text-ink-30"}`}
                  aria-hidden
                />
                <span className="flex-1 text-left">{group.label}</span>
                <i
                  className={`ti ti-chevron-down text-[14px] text-ink-50 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>

              {open ? (
                <div className="mt-1 space-y-0.5 pl-3">
                  {group.children.map((child) => {
                    const active = isChildActive(child.href, pathname);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`group flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors duration-150 ${
                          active
                            ? "bg-iris/15 text-white"
                            : "text-ink-40 hover:bg-white/[0.04] hover:text-white"
                        }`}
                      >
                        <i
                          className={`ti ${child.icon} text-[15px] ${active ? "text-iris-glow" : "text-ink-50 group-hover:text-ink-30"}`}
                          aria-hidden
                        />
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-ink-90 p-4 text-[11px] text-ink-50">
        Studio OS · v1.0
      </div>
    </aside>
  );
}

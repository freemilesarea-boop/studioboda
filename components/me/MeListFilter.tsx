import Link from "next/link";

/**
 * Server-rendered status chips + search box for the /me list pages.
 * Pure GET (no client JS): status via Links, search via a native form.
 */
export function MeListFilter({
  basePath,
  statuses,
  current,
  placeholder,
  total,
}: {
  basePath: string;
  /** Include an "all" entry as the first item. */
  statuses: { key: string; label: string; count?: number }[];
  current: { status: string; q: string };
  placeholder: string;
  total: number;
}) {
  const link = (status: string, q = current.q) => {
    const sp = new URLSearchParams();
    if (status && status !== "all") sp.set("status", status);
    if (q) sp.set("q", q);
    const s = sp.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {statuses.map((s) => (
          <Link
            key={s.key}
            href={link(s.key)}
            className={`rounded-full border px-3 py-1.5 font-display text-[11.5px] font-semibold ${
              current.status === s.key
                ? "border-ink-100 bg-ink-100 text-white"
                : "border-ink-15 bg-white text-ink-70 hover:border-ink-30"
            }`}
          >
            {s.label}
            {typeof s.count === "number" && s.count > 0 ? (
              <span
                className={`num ml-1.5 ${current.status === s.key ? "text-white/70" : "text-ink-50"}`}
              >
                {s.count}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
      <form method="get" action={basePath} className="flex flex-wrap items-center gap-2">
        {current.status !== "all" ? (
          <input type="hidden" name="status" value={current.status} />
        ) : null}
        <input
          type="search"
          name="q"
          defaultValue={current.q}
          placeholder={placeholder}
          className="h-9 min-w-[180px] flex-1 rounded-lg border border-ink-15 bg-white px-3 text-[12.5px] outline-none focus:border-iris/60"
        />
        <button
          type="submit"
          className="h-9 rounded-lg bg-ink-100 px-3.5 font-display text-[12px] font-bold text-white hover:bg-ink-90"
        >
          검색
        </button>
        {current.q ? (
          <Link
            href={link(current.status, "")}
            className="h-9 inline-flex items-center rounded-lg border border-ink-15 px-3 font-display text-[12px] font-bold text-ink-70 hover:border-ink-30"
          >
            초기화
          </Link>
        ) : null}
        <span className="num ml-auto text-[11px] text-ink-50">{total}건</span>
      </form>
    </div>
  );
}

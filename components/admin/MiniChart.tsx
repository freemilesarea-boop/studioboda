// Minimal inline-SVG charts — no Recharts dependency. Render only when there
// is meaningful data; otherwise the parent should show an empty state.

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

export function LineSparkline({
  data,
  height = 80,
  color = "#5B47FF",
  label,
  trailingValue,
}: {
  data: { day: string; amount: number }[];
  height?: number;
  color?: string;
  label?: string;
  trailingValue?: string;
}) {
  if (!data.length) return null;
  const max = Math.max(1, ...data.map((d) => d.amount));
  const w = 320;
  const h = height;
  const pad = 8;
  const stepX = (w - pad * 2) / Math.max(1, data.length - 1);
  const points = data
    .map(
      (d, i) =>
        `${pad + i * stepX},${
          h - pad - ((d.amount / max) * (h - pad * 2))
        }`,
    )
    .join(" ");
  const lastX = pad + (data.length - 1) * stepX;
  const lastY = h - pad - (data[data.length - 1].amount / max) * (h - pad * 2);

  return (
    <div className="rounded-2xl border border-ink-15 bg-white p-5">
      <header className="mb-3 flex items-baseline justify-between">
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-ink-50">
          {label}
        </p>
        {trailingValue ? (
          <p className="num font-display text-[16px] font-extrabold tracking-tightish text-ink-100">
            {trailingValue}
          </p>
        ) : null}
      </header>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
      >
        <defs>
          <linearGradient id="ms-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.18" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`${pad},${h - pad} ${points} ${lastX},${h - pad}`}
          fill="url(#ms-fill)"
        />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          points={points}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={lastX} cy={lastY} r="3" fill={color} />
      </svg>
      <p className="mt-2 text-[10px] text-ink-50">
        {data[0]?.day} → {data[data.length - 1]?.day}
      </p>
    </div>
  );
}

export function BarChart({
  rows,
  label,
  formatValue = (n) => fmt(n),
  height = 6,
}: {
  rows: { key: string; value: number; tone?: string }[];
  label?: string;
  formatValue?: (n: number) => string;
  height?: number;
}) {
  if (!rows.length) return null;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="rounded-2xl border border-ink-15 bg-white p-5">
      {label ? (
        <p className="mb-3 font-display text-[11px] font-bold uppercase tracking-[0.08em] text-ink-50">
          {label}
        </p>
      ) : null}
      <ul className="space-y-2">
        {rows.map((r) => (
          <li
            key={r.key}
            className="grid grid-cols-[1fr_3fr_auto] items-center gap-3 text-[12px]"
          >
            <span className="truncate text-ink-70">{r.key}</span>
            <div className={`relative overflow-hidden rounded-full bg-ink-5`} style={{ height }}>
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${(r.value / max) * 100}%`,
                  background: r.tone ?? "#5B47FF",
                }}
              />
            </div>
            <span className="num font-display text-[12px] font-bold text-ink-100">
              {formatValue(r.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FunnelTile({
  inquiries,
  quotes,
  converted,
  i2q,
  q2p,
}: {
  inquiries: number;
  quotes: number;
  converted: number;
  i2q: number;
  q2p: number;
}) {
  const max = Math.max(1, inquiries, quotes, converted);
  const Bar = ({ label, value, tone }: { label: string; value: number; tone: string }) => (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="font-display text-[10px] font-bold uppercase tracking-[0.08em] text-ink-50">
          {label}
        </p>
        <p className="num font-display text-[14px] font-extrabold text-ink-100">
          {value}
        </p>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink-5">
        <div
          className="h-full rounded-full"
          style={{ width: `${(value / max) * 100}%`, background: tone }}
        />
      </div>
    </div>
  );
  return (
    <div className="rounded-2xl border border-ink-15 bg-white p-5">
      <p className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-ink-50">
        Funnel · 문의 → 견적 → 결제
      </p>
      <div className="mt-3 space-y-2.5">
        <Bar label="문의" value={inquiries} tone="#C7C7D0" />
        <Bar label="견적" value={quotes} tone="#7C9CFF" />
        <Bar label="결제 (예약금 paid)" value={converted} tone="#5B47FF" />
      </div>
      <p className="mt-3 text-[11px] text-ink-50">
        전환율 · 문의→견적 <b className="text-ink-100">{i2q}%</b> · 견적→결제{" "}
        <b className="text-ink-100">{q2p}%</b>
      </p>
    </div>
  );
}

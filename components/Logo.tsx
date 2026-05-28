type LogoProps = {
  size?: number;
  className?: string;
  variant?: "mark" | "lockup" | "stacked";
  tone?: "light" | "dark";
};

export function Logo({
  size = 24,
  className = "",
  variant = "lockup",
  tone = "dark",
}: LogoProps) {
  const fg = tone === "dark" ? "#0A0A12" : "#FFFFFF";
  const muted = tone === "dark" ? "#7E7E8C" : "rgba(255,255,255,0.6)";

  if (variant === "mark") {
    return <LogoMark size={size} className={className} fg={fg} />;
  }

  if (variant === "stacked") {
    return (
      <div className={`flex flex-col items-start gap-2 ${className}`}>
        <LogoMark size={size + 8} fg={fg} />
        <div className="leading-none">
          <div
            className="font-sans font-semibold tracking-tightest"
            style={{ color: fg, fontSize: size * 0.62 }}
          >
            STUDIO BODA
          </div>
          <div
            className="mt-1 font-mono uppercase tracking-meta"
            style={{ color: muted, fontSize: size * 0.32 }}
          >
            AI · CREATIVE · STUDIO
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} fg={fg} />
      <span
        className="font-sans font-semibold tracking-tightest leading-none"
        style={{ color: fg, fontSize: size * 0.74 }}
      >
        STUDIO BODA
      </span>
    </div>
  );
}

function LogoMark({
  size,
  fg,
  className = "",
}: {
  size: number;
  fg: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-label="STUDIO BODA"
      role="img"
    >
      <circle cx="16" cy="16" r="14.25" stroke={fg} strokeWidth="1.5" />
      <circle cx="16" cy="16" r="7.5" stroke={fg} strokeWidth="1.5" />
      <circle cx="16" cy="2.5" r="1.6" fill="#5B47FF" />
      <path
        d="M16 8.5 A7.5 7.5 0 0 1 23.5 16"
        stroke="#5B47FF"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

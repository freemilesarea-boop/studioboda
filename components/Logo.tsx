type LogoProps = {
  size?: number;
  className?: string;
};

export function LogoSymbol({ size = 34, className = "" }: LogoProps) {
  const stroke = size >= 60 ? 4 : size >= 30 ? 3 : 2.5;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 34 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="STUDIO BODA"
    >
      <circle cx="17" cy="17" r="14.5" stroke="#5B47FF" strokeWidth={stroke} />
      <rect x="15.5" y="1.5" width="3" height="5" rx="1.5" fill="#5B47FF" />
      <circle cx="17" cy="17" r="8" fill="#5B47FF" />
      <circle cx="17" cy="17" r="3.2" fill="#ffffff" />
    </svg>
  );
}

type LockupProps = {
  size?: number;
  className?: string;
  tone?: "light" | "dark";
};

export function Logo({ size = 24, className = "", tone = "dark" }: LockupProps) {
  const fg = tone === "dark" ? "#0A0A12" : "#FFFFFF";
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoSymbol size={size + 8} />
      <span
        className="font-display font-extrabold tracking-tight leading-none"
        style={{ color: fg, fontSize: size * 0.74 }}
      >
        STUDIO BODA
      </span>
    </div>
  );
}

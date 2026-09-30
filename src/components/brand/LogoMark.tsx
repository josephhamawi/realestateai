interface LogoMarkProps {
  className?: string;
  /** Render the mark in solid white (for use on a colored background). */
  white?: boolean;
}

/**
 * RealEstateAI logo mark: a flow of lead nodes funneling into one qualified node.
 * Renders inline as SVG so it stays crisp at any size. Use `white` on brand-colored
 * backgrounds (for example inside a brand-600 square), otherwise it uses brand colors.
 */
export function LogoMark({ className = "h-6 w-6", white = false }: LogoMarkProps) {
  const nodeColor = white ? "#ffffff" : "#2563eb";
  const lineColor = white ? "#ffffff" : "#60a5fa";
  const outColor = white ? "#bae6fd" : "#38bdf8";
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="RealEstateAI"
      className={className}
    >
      <g stroke={lineColor} strokeWidth={3} strokeLinecap="round" opacity={white ? 0.92 : 1}>
        <path d="M18 21 L32 37" />
        <path d="M32 18 L32 37" />
        <path d="M46 21 L32 37" />
        <path d="M32 37 L32 46" />
      </g>
      <circle cx="18" cy="20" r="5" fill={nodeColor} />
      <circle cx="32" cy="17" r="5.5" fill={nodeColor} />
      <circle cx="46" cy="20" r="5" fill={nodeColor} />
      <circle cx="32" cy="49" r="7" fill={outColor} />
    </svg>
  );
}

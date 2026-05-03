/** Lumen — SVG logo: a document page with a light-beam emanating from it. */
export default function LumenLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="lm-bg" cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#FDE68A" />
          <stop offset="55%"  stopColor="#F6AD55" />
          <stop offset="100%" stopColor="#C05621" />
        </radialGradient>
        <filter id="lm-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Document body */}
      <rect x="5" y="4" width="17" height="22" rx="2.5"
        fill="url(#lm-bg)" filter="url(#lm-glow)" />

      {/* Page fold corner */}
      <path d="M18 4 L22 8 L18 8 Z" fill="rgba(0,0,0,0.18)" />

      {/* Text lines */}
      <line x1="8.5" y1="13" x2="18.5" y2="13" stroke="rgba(255,255,255,0.65)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="8.5" y1="17" x2="18.5" y2="17" stroke="rgba(255,255,255,0.65)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="8.5" y1="21" x2="15"   y2="21" stroke="rgba(255,255,255,0.65)" strokeWidth="1.4" strokeLinecap="round" />

      {/* Light beam / rays */}
      <line x1="25" y1="8"  x2="29" y2="5"  stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
      <line x1="25" y1="12" x2="30" y2="12" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
      <line x1="25" y1="16" x2="29" y2="19" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

      {/* Glow dot at beam origin */}
      <circle cx="24" cy="12" r="2.2" fill="#FDE68A" opacity="0.9" />
    </svg>
  );
}

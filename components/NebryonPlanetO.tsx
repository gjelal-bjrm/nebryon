/**
 * NebryonPlanetO
 * Animated SVG planet that replaces the "o" in "Nebryon".
 *
 * A small moon orbits on an elliptical (3-D perspective) path:
 *   • drawn BEHIND the planet while crossing the top half of the ellipse
 *   • drawn IN FRONT while crossing the bottom half
 * This is achieved with two identical <animateMotion> instances,
 * each clipped to one half of the SVG — only one is visible at a time.
 */
export default function NebryonPlanetO() {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{
        display:      "inline-block",
        verticalAlign: "-0.13em",
        overflow:     "visible",
        flexShrink:   0,
      }}
    >
      <defs>
        {/* Planet radial gradient — light centre, deep edge */}
        <radialGradient id="po-planet" cx="38%" cy="32%" r="65%">
          <stop offset="0%"   stopColor="#C4B5FD" />
          <stop offset="48%"  stopColor="#6C63FF" />
          <stop offset="100%" stopColor="#2A1A6E" />
        </radialGradient>

        {/* Subtle glow around the planet */}
        <filter id="po-glow" x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation="0.7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Back clip  — top half:    satellite is BEHIND the planet */}
        <clipPath id="po-back">
          <rect x="0" y="0"  width="24" height="12" />
        </clipPath>
        {/* Front clip — bottom half: satellite is IN FRONT of the planet */}
        <clipPath id="po-front">
          <rect x="0" y="12" width="24" height="12" />
        </clipPath>
      </defs>

      {/* ── Orbit ring — back half (rendered under the planet) ── */}
      <ellipse
        cx="12" cy="12" rx="10.5" ry="3.5"
        fill="none"
        stroke="rgba(167,139,250,0.20)"
        strokeWidth="0.5"
        clipPath="url(#po-back)"
      />

      {/* ── Moon behind the planet (dim, clipped to top half) ── */}
      <g clipPath="url(#po-back)">
        <circle r="2" fill="#9F7AEA" opacity="0.40">
          <animateMotion dur="2.8s" repeatCount="indefinite">
            <mpath href="#po-orbit" />
          </animateMotion>
        </circle>
      </g>

      {/* ── Planet ── */}
      <circle
        cx="12" cy="12" r="5.8"
        fill="url(#po-planet)"
        filter="url(#po-glow)"
      />
      {/* Specular highlight — small bright ellipse top-left */}
      <ellipse
        cx="10.0" cy="9.6" rx="2.0" ry="1.2"
        fill="rgba(255,255,255,0.20)"
        transform="rotate(-28,10.0,9.6)"
      />

      {/* ── Orbit ring — front half (rendered over the planet) ── */}
      <ellipse
        cx="12" cy="12" rx="10.5" ry="3.5"
        fill="none"
        stroke="rgba(167,139,250,0.50)"
        strokeWidth="0.65"
        clipPath="url(#po-front)"
      />

      {/* ── Moon in front of the planet (bright, clipped to bottom half) ── */}
      <g clipPath="url(#po-front)">
        <circle r="2" fill="#EDE9FE" opacity="0.95">
          <animateMotion dur="2.8s" repeatCount="indefinite">
            <mpath href="#po-orbit" />
          </animateMotion>
        </circle>
      </g>

      {/*
        Hidden orbit path consumed by both <animateMotion> elements.
        Starts at the right, goes clockwise:
          • first arc  = through the top   (behind the planet)
          • second arc = through the bottom (in front of the planet)
      */}
      <path
        id="po-orbit"
        d="M 22.5 12 A 10.5 3.5 0 0 1 1.5 12 A 10.5 3.5 0 0 1 22.5 12"
        fill="none"
        stroke="none"
      />
    </svg>
  );
}

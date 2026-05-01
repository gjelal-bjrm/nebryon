"use client";

/**
 * OrbitLogo — animated SVG recreation of the Orbit logo.
 *
 * Animations (all CSS / SVG-native, no JS runtime):
 *   • Orb:         follows the orbital ring path (animateMotion, 10 s)
 *   • Orb glow:    subtle brightness pulse (2.5 s ease-in-out)
 *   • Galaxy core: slow counter-rotation of the spiral arms (28 s)
 *   • Rings:       very faint scale-pulse on hover via CSS
 *
 * Props:
 *   size     — rendered px size (default 28)
 *   speed    — orbit period multiplier: 1 = normal (10s), 0.5 = 2× faster
 *   paused   — freeze all animations
 *   className
 */
interface Props {
  size?: number;
  speed?: number;
  paused?: boolean;
  className?: string;
}

export default function OrbitLogo({ size = 28, speed = 1, paused = false, className = "" }: Props) {
  const orbitDur  = `${10 * speed}s`;
  const swirlDur  = `${28 * speed}s`;
  const ps        = paused ? "paused" : "running";

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Orbit"
    >
      <defs>
        {/* ── Animations ─────────────────────────────────────── */}
        <style>{`
          @keyframes ol-pulse {
            0%,100% { opacity:.88; }
            50%      { opacity:1;  }
          }
          @keyframes ol-swirl {
            from { transform: rotate(0deg);   }
            to   { transform: rotate(360deg); }
          }
          .ol-orb-anim  {
            animation: ol-pulse ${orbitDur} ease-in-out infinite;
            animation-play-state: ${ps};
          }
          .ol-swirl-anim {
            animation: ol-swirl ${swirlDur} linear infinite;
            animation-play-state: ${ps};
            transform-origin: 100px 100px;
          }
        `}</style>

        {/* ── Galaxy core gradient ────────────────────────────── */}
        <radialGradient id="ol-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FDE68A" />
          <stop offset="16%"  stopColor="#FB923C" />
          <stop offset="35%"  stopColor="#F97316" />
          <stop offset="54%"  stopColor="#2DD4BF" />
          <stop offset="76%"  stopColor="#4338CA" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </radialGradient>

        {/* ── Orb fill ────────────────────────────────────────── */}
        <radialGradient id="ol-orb-fill" cx="30%" cy="28%" r="70%">
          <stop offset="0%"   stopColor="#FFFFFF" />
          <stop offset="38%"  stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#6366F1" />
        </radialGradient>

        {/* ── Filters ─────────────────────────────────────────── */}
        {/* Orbital ring glow */}
        <filter id="ol-ring-glow" x="-18%" y="-55%" width="136%" height="210%">
          <feGaussianBlur stdDeviation="2.8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Orb glow */}
        <filter id="ol-orb-glow" x="-90%" y="-90%" width="280%" height="280%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* ── Galaxy clip ─────────────────────────────────────── */}
        <clipPath id="ol-galaxy-clip">
          <circle cx="100" cy="100" r="54" />
        </clipPath>

        {/*
          ── Orbit path for animateMotion ─────────────────────────
          Pre-rotated ellipse: rx=84, ry=32, tilted -18° around (100,100)
          Parametric at t=0   → (179.9, 74.0)   [upper-right]
          Parametric at t=π   → (20.1,  126.0)  [lower-left]
          Two opposing arcs complete the full ellipse.
        */}
        <path
          id="ol-orbit-path"
          d="M 179.9 74.0 A 84 32 -18 1 0 20.1 126.0 A 84 32 -18 1 0 179.9 74.0"
          fill="none"
        />
      </defs>

      {/* ════════════════════════════════════════════════════════
          LAYER 1 — Dark concentric orbital rings (behind galaxy)
      ═══════════════════════════════════════════════════════════ */}
      <ellipse cx="100" cy="100" rx="88" ry="54" fill="none"
               stroke="#1C1A52" strokeWidth="6"
               transform="rotate(-18 100 100)" />
      <ellipse cx="100" cy="100" rx="78" ry="46" fill="none"
               stroke="#2D2B6B" strokeWidth="5"
               transform="rotate(-18 100 100)" />
      <ellipse cx="100" cy="100" rx="68" ry="38" fill="none"
               stroke="#3730A3" strokeWidth="3.5"
               transform="rotate(-18 100 100)" />

      {/* ════════════════════════════════════════════════════════
          LAYER 2 — Galaxy body + spiral arms
      ═══════════════════════════════════════════════════════════ */}
      <circle cx="100" cy="100" r="54" fill="url(#ol-core)" />

      {/* Swirl arms — clipped to galaxy circle, rotate slowly */}
      <g clipPath="url(#ol-galaxy-clip)" className="ol-swirl-anim">
        {/* Arm A — teal */}
        <ellipse cx="92"  cy="100" rx="38" ry="17" fill="#22D3EE" opacity="0.38"
                 transform="rotate(-38 100 100)" />
        {/* Arm B — amber */}
        <ellipse cx="108" cy="100" rx="36" ry="16" fill="#F59E0B" opacity="0.32"
                 transform="rotate(22 100 100)" />
        {/* Arm C — cyan deep */}
        <ellipse cx="100" cy="93"  rx="30" ry="13" fill="#06B6D4" opacity="0.28"
                 transform="rotate(-65 100 100)" />
        {/* Arm D — violet */}
        <ellipse cx="100" cy="107" rx="27" ry="12" fill="#7C3AED" opacity="0.22"
                 transform="rotate(52 100 100)" />
        {/* Hot inner core */}
        <circle cx="100" cy="100" r="22" fill="#F97316" opacity="0.48" />
        <circle cx="100" cy="100" r="12" fill="#FDE68A" opacity="0.52" />
        {/* Micro star particles */}
        <circle cx="80"  cy="83"  r="1.5" fill="white"   opacity="0.90" />
        <circle cx="119" cy="89"  r="1.2" fill="white"   opacity="0.78" />
        <circle cx="87"  cy="119" r="1.3" fill="white"   opacity="0.68" />
        <circle cx="114" cy="112" r="1.0" fill="#C4B5FD" opacity="0.88" />
        <circle cx="83"  cy="110" r="1.1" fill="white"   opacity="0.62" />
        <circle cx="115" cy="86"  r="0.9" fill="#2DD4BF" opacity="0.82" />
      </g>

      {/* Galaxy edge darkening */}
      <circle cx="100" cy="100" r="54" fill="none" stroke="#0D0C22" strokeWidth="5" opacity="0.55" />

      {/* ════════════════════════════════════════════════════════
          LAYER 3 — Bright neon orbital ring (in front)
      ═══════════════════════════════════════════════════════════ */}
      <ellipse
        cx="100" cy="100" rx="84" ry="32"
        fill="none"
        stroke="#3B9EFF" strokeWidth="3.5"
        transform="rotate(-18 100 100)"
        filter="url(#ol-ring-glow)"
      />

      {/* ════════════════════════════════════════════════════════
          LAYER 4 — Orbiting node
      ═══════════════════════════════════════════════════════════ */}
      <g className="ol-orb-anim">
        {/* Outer halo ring */}
        <circle r="14.5" fill="none" stroke="#A78BFA" strokeWidth="1.4" opacity="0.42">
          <animateMotion dur={orbitDur} repeatCount="indefinite">
            <mpath href="#ol-orbit-path" />
          </animateMotion>
        </circle>

        {/* Core orb with glow */}
        <circle r="9.5" fill="url(#ol-orb-fill)" filter="url(#ol-orb-glow)">
          <animateMotion dur={orbitDur} repeatCount="indefinite">
            <mpath href="#ol-orbit-path" />
          </animateMotion>
        </circle>
      </g>
    </svg>
  );
}

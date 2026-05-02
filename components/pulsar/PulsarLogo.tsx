"use client";

/**
 * PulsarLogo — animated SVG inspired by real pulsar astronomy:
 *  • 3 expanding pulse rings (staggered, opacity fade)
 *  • Bipolar electromagnetic jet (diagonal beam, glow pulse)
 *  • Bright central neutron-star core (intensity pulse)
 *  • Slowly rotating outer orbit ring
 *  • Static star field
 */
export default function PulsarLogo({ size = 32 }: { size?: number }) {
  const uid = "pl"; // prefix to avoid CSS class collisions

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-label="Pulsar logo"
    >
      <defs>
        {/* ── Glow filter ── */}
        <filter id={`${uid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${uid}-glow-strong`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* ── Jet gradient (fades at both ends, bright at core) ── */}
        <linearGradient id={`${uid}-jet`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#7FFFD4" stopOpacity="0" />
          <stop offset="35%"  stopColor="#00E5A0" stopOpacity="0.85" />
          <stop offset="50%"  stopColor="#CCFFF0" stopOpacity="1" />
          <stop offset="65%"  stopColor="#00E5A0" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#7FFFD4" stopOpacity="0" />
        </linearGradient>

        {/* ── Core radial gradient ── */}
        <radialGradient id={`${uid}-core`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FFFFFF" />
          <stop offset="50%"  stopColor="#ADFFD9" />
          <stop offset="100%" stopColor="#00C47A" />
        </radialGradient>

        {/* ── Ring colour ── */}
        <style>{`
          .${uid}-ring {
            fill: none;
            stroke: #00C88A;
            stroke-width: 1.2;
            transform-box: fill-box;
            transform-origin: center;
            animation: ${uid}-pulse 2.4s ease-out infinite;
          }
          .${uid}-r2 { animation-delay: 0.8s; }
          .${uid}-r3 { animation-delay: 1.6s; }

          @keyframes ${uid}-pulse {
            0%   { transform: scale(0.16); opacity: 0.9; }
            100% { transform: scale(1);    opacity: 0;   }
          }

          .${uid}-orbit {
            transform-box: fill-box;
            transform-origin: center;
            animation: ${uid}-spin 24s linear infinite;
          }
          @keyframes ${uid}-spin {
            to { transform: rotate(360deg); }
          }

          .${uid}-core {
            transform-box: fill-box;
            transform-origin: center;
            animation: ${uid}-throb 1.25s ease-in-out infinite;
          }
          @keyframes ${uid}-throb {
            0%, 100% { opacity: 1;   transform: scale(1);    }
            50%       { opacity: 0.5; transform: scale(0.85); }
          }

          .${uid}-jet {
            animation: ${uid}-beam 1.25s ease-in-out infinite;
          }
          @keyframes ${uid}-beam {
            0%, 100% { opacity: 0.65; }
            50%       { opacity: 1;    }
          }

          .${uid}-halo {
            transform-box: fill-box;
            transform-origin: center;
            animation: ${uid}-throb 1.25s ease-in-out infinite;
          }

          .${uid}-star {
            animation: ${uid}-twinkle var(--d, 3s) ease-in-out infinite;
            animation-delay: var(--dl, 0s);
          }
          @keyframes ${uid}-twinkle {
            0%, 100% { opacity: var(--o, 0.7); }
            50%       { opacity: 0.2; }
          }
        `}</style>
      </defs>

      {/* ── Outer orbit ring (slow rotation) ── */}
      <circle
        cx="50" cy="50" r="47"
        stroke="#00C88A" strokeWidth="0.4" strokeDasharray="4 3"
        opacity="0.25"
        className={`${uid}-orbit`}
      />

      {/* ── Pulse rings ── */}
      <circle cx="50" cy="50" r="44" className={`${uid}-ring`} />
      <circle cx="50" cy="50" r="44" className={`${uid}-ring ${uid}-r2`} />
      <circle cx="50" cy="50" r="44" className={`${uid}-ring ${uid}-r3`} />

      {/* ── Jet beam ── */}
      <line
        x1="8" y1="8" x2="92" y2="92"
        stroke={`url(#${uid}-jet)`} strokeWidth="2.2" strokeLinecap="round"
        filter={`url(#${uid}-glow)`}
        className={`${uid}-jet`}
      />

      {/* ── Star field ── */}
      {[
        { cx: 20, cy: 14, r: 1.0,  o: 0.75, d: "3.2s", dl: "0s"    },
        { cx: 78, cy: 20, r: 1.3,  o: 0.9,  d: "4.1s", dl: "1.3s"  },
        { cx: 82, cy: 76, r: 0.9,  o: 0.65, d: "2.8s", dl: "0.6s"  },
        { cx: 13, cy: 70, r: 1.1,  o: 0.8,  d: "3.7s", dl: "2.0s"  },
        { cx: 62, cy: 10, r: 0.7,  o: 0.6,  d: "2.5s", dl: "0.9s"  },
        { cx: 88, cy: 46, r: 0.8,  o: 0.55, d: "3.9s", dl: "1.7s"  },
      ].map((s, i) => (
        <circle
          key={i}
          cx={s.cx} cy={s.cy} r={s.r}
          fill="white"
          className={`${uid}-star`}
          style={{ "--o": s.o, "--d": s.d, "--dl": s.dl } as React.CSSProperties}
        />
      ))}

      {/* ── Core halo (outer glow) ── */}
      <circle
        cx="50" cy="50" r="11"
        fill="#00C88A" opacity="0.12"
        className={`${uid}-halo`}
      />
      <circle
        cx="50" cy="50" r="7"
        fill="#00E5A0" opacity="0.22"
        className={`${uid}-halo`}
      />

      {/* ── Core ── */}
      <circle
        cx="50" cy="50" r="4"
        fill={`url(#${uid}-core)`}
        filter={`url(#${uid}-glow-strong)`}
        className={`${uid}-core`}
      />
    </svg>
  );
}

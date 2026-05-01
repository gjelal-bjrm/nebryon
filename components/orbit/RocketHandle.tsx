"use client";

/**
 * RocketHandle — resize handle between the request and response panels.
 *
 * While a request is in-flight (`loading=true`) the bar grows slightly and
 * shows a small rocket with a multi-coloured comet trail flying left → right.
 */

interface Props {
  onMouseDown: (e: React.MouseEvent) => void;
  loading: boolean;
}

export default function RocketHandle({ onMouseDown, loading }: Props) {
  return (
    <div
      onMouseDown={onMouseDown}
      className="flex-shrink-0 cursor-row-resize relative overflow-hidden select-none"
      style={{
        height:     loading ? "14px" : "6px",
        background: loading ? "rgba(59,158,255,0.06)" : "var(--stroke)",
        transition: "height 0.18s ease, background 0.18s ease",
        borderTop:    loading ? "1px solid rgba(59,158,255,0.18)" : "none",
        borderBottom: loading ? "1px solid rgba(59,158,255,0.18)" : "none",
      }}
      onMouseEnter={(e) => {
        if (!loading) e.currentTarget.style.background = "var(--nebula)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = loading
          ? "rgba(59,158,255,0.06)"
          : "var(--stroke)";
      }}
    >
      {loading && (
        <>
          {/* Keyframes injected once inline — fine since this component renders once */}
          <style>{`
            @keyframes rh-fly {
              0%   { left: -140px; }
              100% { left: 110%;  }
            }
          `}</style>

          {/* Rocket + trail element */}
          <div
            style={{
              position:  "absolute",
              top:       "50%",
              transform: "translateY(-50%)",
              display:   "flex",
              alignItems:"center",
              gap:       "0px",
              animation: "rh-fly 1.8s linear infinite",
              pointerEvents: "none",
            }}
          >
            {/* Multi-colour comet trail */}
            <span
              style={{
                display:      "inline-block",
                width:        "90px",
                height:       "4px",
                background:   "linear-gradient(90deg, transparent 0%, #F97316 22%, #FBBF24 38%, #2DD4BF 56%, #6C63FF 74%, #3B9EFF 88%, rgba(59,158,255,0) 100%)",
                borderRadius: "2px",
                opacity:      0.9,
              }}
            />

            {/* Rocket — inline SVG pointing right */}
            <svg
              viewBox="0 0 20 20"
              width="13"
              height="13"
              style={{ flexShrink: 0, filter: "drop-shadow(0 0 4px #3B9EFF)" }}
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Body */}
              <path
                d="M 18 10 C 18 5 14 1 10 1 C 6 1 2 5 2 10 L 5 10 L 10 17 L 15 10 Z"
                fill="#ffffff"
                transform="rotate(90 10 10)"
              />
              {/* Nose highlight */}
              <circle cx="10" cy="3" r="1.5" fill="#C4B5FD"
                      transform="rotate(90 10 10)" />
              {/* Flame */}
              <ellipse cx="10" cy="18.5" rx="2.5" ry="1.8" fill="#F97316" opacity="0.9"
                       transform="rotate(90 10 10)" />
              <ellipse cx="10" cy="18.5" rx="1.3" ry="1.0" fill="#FDE68A" opacity="0.8"
                       transform="rotate(90 10 10)" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
}

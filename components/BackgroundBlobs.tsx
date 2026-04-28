"use client";

import { motion, useReducedMotion } from "framer-motion";

function Blob({
  className,
  delay = 0,
  duration = 16,
}: {
  className: string;
  delay?: number;
  duration?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ x: 0, y: 0, scale: 1 }}
      animate={{
        x: [0, 60, -40, 80, 0],
        y: [0, 80, 120, -20, 0],
        scale: [1, 1.07, 1.03, 1.1, 1],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      }}
    />
  );
}

export default function BackgroundBlobs() {
  const reduce = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      {/* léger grain/ombre */}
      <div className="absolute inset-0 bg-[radial-gradient(900px_420px_at_50%_40%,transparent_35%,rgba(0,0,0,.35)_100%)]" />

      {/* blobs */}
      <div className="absolute inset-0 opacity-95 [mix-blend-mode:screen]">
        <div className="absolute -top-24 left-[-10%] h-[520px] w-[520px] rounded-full blur-[60px] saturate-150 contrast-125 bg-[radial-gradient(circle_at_30%_30%,rgba(0,190,255,.95),transparent_62%)]" />
        <div className="absolute -top-32 left-[55%] h-[520px] w-[520px] rounded-full blur-[60px] saturate-150 contrast-125 bg-[radial-gradient(circle_at_30%_30%,rgba(0,120,255,.85),transparent_62%)]" />
        <div className="absolute top-[18%] left-[60%] h-[520px] w-[520px] rounded-full blur-[60px] saturate-150 contrast-125 bg-[radial-gradient(circle_at_30%_30%,rgba(0,255,170,.80),transparent_62%)]" />
        <div className="absolute top-[26%] left-[-8%] h-[520px] w-[520px] rounded-full blur-[60px] saturate-150 contrast-125 bg-[radial-gradient(circle_at_30%_30%,rgba(0,210,140,.65),transparent_62%)]" />

        {/* blob “pont” central */}
        <div className="absolute top-[2%] left-[20%] h-[680px] w-[680px] rounded-full opacity-70 blur-[70px] saturate-150 contrast-125 bg-[radial-gradient(circle_at_35%_35%,rgba(0,210,255,.55),transparent_64%)]" />
      </div>

      {/* version animée (désactivée si reduce motion) */}
      {!reduce && (
        <div className="absolute inset-0 opacity-70 [mix-blend-mode:screen]">
          <Blob
            className="absolute -top-24 left-[-10%] h-[520px] w-[520px] rounded-full blur-[70px] bg-[radial-gradient(circle_at_30%_30%,rgba(21,221,83,.45),transparent_65%)]"
            duration={18}
            delay={-1.2}
          />
          <Blob
            className="absolute top-[10%] left-[55%] h-[560px] w-[560px] rounded-full blur-[80px] bg-[radial-gradient(circle_at_30%_30%,rgba(0,190,255,.25),transparent_68%)]"
            duration={22}
            delay={-3.4}
          />
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

function ThickArrowUpFilled() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.5 2L12.5 7.5H10V13H5V7.5H2.5L7.5 2Z"/>
    </svg>
  );
}

function ThickArrowDownFilled() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.5 13L2.5 7.5H5V2H10V7.5H12.5L7.5 13Z"/>
    </svg>
  );
}

export default function VoteCursor() {
  const [pos, setPos] = useState<{ x: number; y: number; up: boolean | null } | null>(null);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const target = (e.target as Element | null)?.closest("[data-snack-cell]") as HTMLElement | null;
      let up: boolean | null = null;
      if (target) {
        const r = target.getBoundingClientRect();
        up = e.clientY < r.top + r.height / 2;
      }
      setPos({ x: e.clientX, y: e.clientY, up });
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  if (!pos || pos.up === null) return null;
  const Icon = pos.up ? ThickArrowUpFilled : ThickArrowDownFilled;

  return (
    <div
      className="pointer-events-none fixed z-50 text-white/40"
      style={{
        left: pos.x,
        top: pos.y,
        transform: "translate(-50%, -50%) scale(2)",
      }}
    >
      <Icon />
    </div>
  );
}

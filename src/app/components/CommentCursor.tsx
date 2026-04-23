"use client";

import { useEffect, useState } from "react";
function ChatBubbleFilled() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 3.5A1.5 1.5 0 0 1 2.5 2h10A1.5 1.5 0 0 1 14 3.5v5a1.5 1.5 0 0 1-1.5 1.5H6.207l-1.853 1.854a.5.5 0 0 1-.854-.354V10H2.5A1.5 1.5 0 0 1 1 8.5v-5Z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CommentCursor() {
  const [pos, setPos] = useState<{ x: number; y: number; inside: boolean } | null>(null);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const inside = !!(e.target as Element | null)?.closest("[data-snack-cell]");
      setPos({ x: e.clientX, y: e.clientY, inside });
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  if (!pos || !pos.inside) return null;

  return (
    <div
      className="pointer-events-none fixed z-50 text-paradigm"
      style={{
        left: pos.x,
        top: pos.y,
        transform: "translate(-50%, -50%) scale(2)",
      }}
    >
      <ChatBubbleFilled />
    </div>
  );
}

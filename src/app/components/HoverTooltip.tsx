"use client";

import { useRef, useState } from "react";

type Pos = { x: number; y: number; flipY: boolean; flipX: boolean };

const OFFSET = 12;
const EDGE = 80;

export default function HoverTooltip({
  label,
  children,
  className,
  ...rest
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const [pos, setPos] = useState<Pos | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent) {
    const flipY = e.clientY < EDGE;
    const flipX = e.clientX > window.innerWidth - EDGE * 3;
    setPos({ x: e.clientX, y: e.clientY, flipY, flipX });
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setPos(null)}
      className={className}
      {...rest}
    >
      {children}
      {pos && label != null && (
        <div
          className="pointer-events-none fixed z-50"
          style={{
            left: pos.x,
            top: pos.y,
            transform: `translate(${pos.flipX ? "calc(-100% - " + OFFSET + "px)" : (pos.flipY ? OFFSET : 4) + "px"}, ${pos.flipY ? OFFSET + "px" : "calc(-100% - " + (pos.flipX ? OFFSET : 4) + "px)"})`,
          }}
        >
          <span
            className="font-mono inline-flex items-center justify-center rounded-md bg-paradigm px-2 py-[3px] text-sm font-normal uppercase tracking-wide text-black whitespace-nowrap"
            style={{
              transform: "scale(0.8)",
              transformOrigin: pos.flipX
                ? pos.flipY
                  ? "top right"
                  : "bottom right"
                : pos.flipY
                  ? "top left"
                  : "bottom left",
            }}
          >
            {label}
          </span>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import {
  AccessibilityIcon,
  ArrowTopRightIcon,
  ArrowUpIcon,
  ChatBubbleIcon,
  InputIcon,
  StarIcon,
  UpdateIcon,
} from "@radix-ui/react-icons";

function CursorArrowFilled() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 2L3 12.5L5.5 10L7.5 13.5L9.5 12.5L7.5 9L11 9L3 2Z" stroke="currentColor" strokeLinejoin="round" />
    </svg>
  );
}
import HoverTooltip from "./components/HoverTooltip";

import VoteCursor from "./components/VoteCursor";
import CommentCursor from "./components/CommentCursor";

type Mode = "SELECT" | "VOTE" | "COMMENT";

function DashedButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-semi-mono flex cursor-pointer items-center gap-1.5 px-3 py-1 text-xs uppercase text-black ${
        active ? "bg-paradigm" : "bg-inactive"
      }`}
    >
      {children}
    </button>
  );
}

function ThickUp() {
  return (
    <svg width="13" height="13" viewBox="0 0 15 15" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.5 2L12.5 7.5H10V13H5V7.5H2.5L7.5 2Z" stroke="currentColor" strokeLinejoin="round" />
    </svg>
  );
}
function ThickDown() {
  return (
    <svg width="13" height="13" viewBox="0 0 15 15" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.5 13L2.5 7.5H5V2H10V7.5H12.5L7.5 13Z" stroke="currentColor" strokeLinejoin="round" />
    </svg>
  );
}

const placeholderImages = [
  "/snacks/BBQ-v1.png",
  "/snacks/Front-v1.png",
  "/snacks/Pistachios-Spicy.png",
  "/snacks/SeaSalt-v1.png",
  "/snacks/SV-v1.png",
];

type ItemType = "Snack" | "Drink";

type Item = {
  name: string;
  type: ItemType;
  votes: { up: number; down: number };
  glb: string;
  description: string;
};

const descriptions: Record<string, string> = {
  "Love Corn": "Savory, crunchy corn kernels with the perfect combination of saltiness and crunch — oven-baked, never fried.",
  "BBQ Chips": "Smoky, sweet and tangy BBQ crunch — oven-baked crispy corn kernels for a bold, feel-good snack.",
  "Sea Salt": "Crunchy oven-baked corn kernels seasoned with a clean hit of sea salt for the ultimate salty, satisfying bite.",
  "SV Chips": "Salt & vinegar crunch that delivers a sharp, tangy zing and a satisfying crispy finish.",
  "Snack": "A classic crunchy snack — simple, satisfying, and ready for the office munchies.",
};

const items: Item[] = [
  { name: "Love Corn", type: "Snack", votes: { up: 42, down: 3 }, glb: "", description: descriptions["Love Corn"] },
  { name: "BBQ Chips", type: "Snack", votes: { up: 28, down: 5 }, glb: "", description: descriptions["BBQ Chips"] },
  { name: "Sea Salt", type: "Snack", votes: { up: 31, down: 2 }, glb: "", description: descriptions["Sea Salt"] },
  { name: "SV Chips", type: "Snack", votes: { up: 19, down: 7 }, glb: "", description: descriptions["SV Chips"] },
  { name: "Snack", type: "Snack", votes: { up: 12, down: 1 }, glb: "", description: descriptions["Snack"] },
  { name: "Love Corn", type: "Snack", votes: { up: 8, down: 0 }, glb: "", description: descriptions["Love Corn"] },
  { name: "BBQ Chips", type: "Snack", votes: { up: 14, down: 4 }, glb: "", description: descriptions["BBQ Chips"] },
  { name: "Sea Salt", type: "Snack", votes: { up: 22, down: 6 }, glb: "", description: descriptions["Sea Salt"] },
  { name: "SV Chips", type: "Snack", votes: { up: 11, down: 2 }, glb: "", description: descriptions["SV Chips"] },
  { name: "Snack", type: "Snack", votes: { up: 6, down: 1 }, glb: "", description: descriptions["Snack"] },
  { name: "Love Corn", type: "Snack", votes: { up: 17, down: 3 }, glb: "", description: descriptions["Love Corn"] },
  { name: "BBQ Chips", type: "Snack", votes: { up: 9, down: 0 }, glb: "", description: descriptions["BBQ Chips"] },
  { name: "Sea Salt", type: "Snack", votes: { up: 25, down: 4 }, glb: "", description: descriptions["Sea Salt"] },
  { name: "SV Chips", type: "Snack", votes: { up: 13, down: 2 }, glb: "", description: descriptions["SV Chips"] },
  { name: "Snack", type: "Snack", votes: { up: 20, down: 5 }, glb: "", description: descriptions["Snack"] },
  { name: "Love Corn", type: "Snack", votes: { up: 33, down: 1 }, glb: "", description: descriptions["Love Corn"] },
  { name: "BBQ Chips", type: "Snack", votes: { up: 7, down: 2 }, glb: "", description: descriptions["BBQ Chips"] },
  { name: "Sea Salt", type: "Snack", votes: { up: 18, down: 3 }, glb: "", description: descriptions["Sea Salt"] },
  { name: "SV Chips", type: "Snack", votes: { up: 24, down: 6 }, glb: "", description: descriptions["SV Chips"] },
  { name: "Snack", type: "Snack", votes: { up: 15, down: 2 }, glb: "", description: descriptions["Snack"] },
  { name: "Love Corn", type: "Snack", votes: { up: 29, down: 4 }, glb: "", description: descriptions["Love Corn"] },
  { name: "BBQ Chips", type: "Snack", votes: { up: 21, down: 3 }, glb: "", description: descriptions["BBQ Chips"] },
  { name: "Sea Salt", type: "Snack", votes: { up: 16, down: 1 }, glb: "", description: descriptions["Sea Salt"] },
  { name: "SV Chips", type: "Snack", votes: { up: 10, down: 0 }, glb: "", description: descriptions["SV Chips"] },
];

export default function Home() {
  const [mode, setMode] = useState<Mode>("SELECT");
  const [selected, setSelected] = useState<number | null>(null);
  const [lastAction, setLastAction] = useState<{ icon: React.ReactNode; text: string } | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [hoveredUp, setHoveredUp] = useState<boolean | null>(null);
  const [userVotes, setUserVotes] = useState<Record<number, "up" | "down">>({});
  const [commentTarget, setCommentTarget] = useState<{ i: number; x: number; y: number } | null>(null);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Record<number, string[]>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("snackway.comments");
      if (raw) setComments(JSON.parse(raw));
    } catch {}
  }, []);

  function submitComment() {
    if (!commentTarget || commentText.trim().length === 0) return;
    const i = commentTarget.i;
    setComments((prev) => {
      const next = { ...prev, [i]: [...(prev[i] ?? []), commentText.trim()] };
      try { localStorage.setItem("snackway.comments", JSON.stringify(next)); } catch {}
      return next;
    });
    setSelected(i);
    setCommentTarget(null);
    setCommentText("");
    setLastAction({ icon: <ChatBubbleIcon />, text: `MADE A COMMENT ON ${items[i].name}` });
  }
  const commentPopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && commentTarget) {
        setCommentTarget(null);
        setCommentText("");
        return;
      }
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      const k = e.key.toLowerCase();
      if (k === "s") switchMode("SELECT");
      else if (k === "v") switchMode("VOTE");
      else if (k === "c") switchMode("COMMENT");
    }
    function onDown(e: MouseEvent) {
      if (!commentTarget) return;
      if (commentPopRef.current && !commentPopRef.current.contains(e.target as Node)) {
        setCommentTarget(null);
        setCommentText("");
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selected, commentTarget]);

  function openComment(i: number, x: number, y: number) {
    setCommentTarget({ i, x, y });
    setCommentText("");
    setSelected(i);
    setLastAction({ icon: <InputIcon />, text: `INITIATING COMMENT ON ${items[i].name}` });
  }
  const selectionByMode = useRef<Record<Mode, number | null>>({ SELECT: null, VOTE: null, COMMENT: null });

  function switchMode(m: Mode) {
    selectionByMode.current[mode] = selected;
    setMode(m);
    setSelected(null);
    const next = selectionByMode.current[m];
    if (next !== null) {
      setTimeout(() => setSelected(next), 250);
    }
    setLastAction({ icon: <UpdateIcon />, text: `SWITCHED TO ${m}` });
  }
  function selectSnack(i: number) {
    setSelected(i);
    setLastAction({ icon: <CursorArrowFilled />, text: `SELECTED ${items[i].name}` });
  }
  function voteSnack(i: number, up: boolean) {
    setUserVotes((v) => ({ ...v, [i]: up ? "up" : "down" }));
    setLastAction({
      icon: up ? <ThickUp /> : <ThickDown />,
      text: `${up ? "UPVOTED" : "DOWNVOTED"} ${items[i].name}`,
    });
  }
  return (
    <main className="flex flex-1 flex-col">
      <header className="relative flex items-center justify-between border-b-[0.5px] border-paradigm px-4 py-3">
        <div className="flex items-center gap-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/paradigm-logo.png" alt="Paradigm logo" className="h-[30px] w-[30px]" />
          <span
            className="group font-grotesk text-lg font-medium tracking-tight"
            onMouseEnter={() => setLastAction({ icon: <AccessibilityIcon />, text: "LEARNED WHERE WE ARE" })}
          >
            524 Snackway<span className="opacity-0 transition-opacity group-hover:opacity-100">, New York, NY 10012</span>
          </span>
        </div>
        {lastAction && (
          <span className="font-mono absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-md bg-paradigm px-2 py-[3px] text-sm uppercase tracking-wide text-black whitespace-nowrap">
            <span className="inline-flex items-center justify-center leading-none [&_svg]:h-3 [&_svg]:w-3">{lastAction.icon}</span>
            {lastAction.text}
          </span>
        )}
        <div className="flex items-center gap-2">
          <HoverTooltip label="View snacks, their comments and vote ratio">
            <DashedButton
              active={mode === "SELECT"}
              onClick={() => switchMode("SELECT")}
            >
              Select <span className="opacity-60">[S]</span>
            </DashedButton>
          </HoverTooltip>
          <HoverTooltip label="Vote on if a snack is good or not">
            <DashedButton
              active={mode === "VOTE"}
              onClick={() => switchMode("VOTE")}
            >
              Vote <span className="opacity-60">[V]</span>
            </DashedButton>
          </HoverTooltip>
          <HoverTooltip label="Comment your opinion on snacks">
            <DashedButton
              active={mode === "COMMENT"}
              onClick={() => switchMode("COMMENT")}
            >
              Comment <span className="opacity-60">[C]</span>
            </DashedButton>
          </HoverTooltip>
        </div>
      </header>
      <div className="flex flex-1">
      <div className="w-3/4">
        <div className="grid grid-cols-4 border-b-[0.5px] border-r-[0.5px] border-paradigm">
          {items.map((item, i) => (
            <HoverTooltip
              key={i}
              data-snack-cell
              onClick={
                mode === "SELECT"
                  ? () => selectSnack(i)
                  : mode === "VOTE"
                    ? (e) => {
                        const cell = (e.target as Element).closest("[data-snack-cell]") as HTMLElement | null;
                        if (!cell) return;
                        const r = cell.getBoundingClientRect();
                        voteSnack(i, e.clientY < r.top + r.height / 2);
                      }
                    : mode === "COMMENT"
                      ? (e) => openComment(i, e.clientX, e.clientY)
                      : undefined
              }
              label={
                mode === "SELECT" ? (
                  <span className="inline-flex items-center gap-1">
                    <ArrowTopRightIcon /> {item.name}
                  </span>
                ) : null
              }
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => {
                setHoveredIdx((h) => (h === i ? null : h));
                setHoveredUp(null);
              }}
              onMouseMove={(e) => {
                if (mode !== "VOTE") return;
                const cell = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setHoveredUp(e.clientY < cell.top + cell.height / 2);
              }}
              className={`relative flex flex-col border-t-[0.5px] border-l-[0.5px] border-paradigm ${(mode === "VOTE" || (mode === "COMMENT" && !commentTarget)) ? "cursor-none [&_*]:cursor-none" : ""}`}
            >
              {mode === "VOTE" && hoveredIdx === i && (
                <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
                  <div className={`flex flex-1 items-center justify-center ${hoveredUp === true ? "bg-paradigm/80" : "bg-paradigm/40"}`}>
                    <span className="text-white [&_svg]:h-8 [&_svg]:w-8"><ThickUp /></span>
                  </div>
                  <div className={`flex flex-1 items-center justify-center ${hoveredUp === false ? "bg-[#ff3b30]/80" : "bg-[#ff3b30]/40"}`}>
                    <span className="text-white [&_svg]:h-8 [&_svg]:w-8"><ThickDown /></span>
                  </div>
                </div>
              )}
              <div className="flex h-32 w-full items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={placeholderImages[i % placeholderImages.length]}
                  alt={item.name}
                  className="max-h-[70%] max-w-[70%] object-contain"
                />
              </div>
              <div className="flex flex-col gap-1 bg-transparent p-2">
                <span className="font-grotesk text-[24px] font-normal leading-tight">{item.name}</span>
                <div className="font-semi-mono -mt-0.5 flex items-center justify-between gap-3 text-[12.5px]">
                  <div className="flex gap-3">
                    <span className="inline-flex items-center gap-1"><span className="text-[#ffd60a]"><StarIcon /></span> 0</span>
                    <span className="inline-flex items-center gap-1"><span className="text-paradigm"><ThickUp /></span> {item.votes.up}</span>
                    <span className="inline-flex items-center gap-1"><span className="text-[#ff3b30]"><ThickDown /></span> {item.votes.down}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      openComment(i, r.left, r.top);
                    }}
                    className="inline-flex cursor-pointer items-center justify-center text-paradigm hover:opacity-80"
                    aria-label="Comment"
                  >
                    <ChatBubbleIcon />
                  </button>
                </div>
              </div>
            </HoverTooltip>
          ))}
        </div>
      </div>
      <aside className="w-1/4 border-l-[0.5px] border-paradigm">
        <div
          className={`sticky top-0 -mt-px h-screen p-8 transition-colors duration-300 ease-in-out ${
            mode === "SELECT" || mode === "COMMENT" ? "bg-paradigm" : "bg-transparent"
          }`}
        >
          {selected !== null && mode === "COMMENT" ? (
            <div key={selected} className="fade-in flex flex-col items-start gap-4 text-white">
              {commentTarget && (
                <div className="marching-border relative inline-block px-3 py-2">
                  <span className="font-mono text-base uppercase tracking-wide">COMMENTING ON {items[commentTarget.i].name}</span>
                  <svg
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <rect x="0.5" y="0.5" width="calc(100% - 1px)" height="calc(100% - 1px)" fill="none" stroke="white" strokeWidth="1" />
                  </svg>
                </div>
              )}
              <div className="flex w-full flex-col gap-2">
                {(comments[selected] ?? []).length === 0 ? (
                  <span className="font-grotesk text-sm opacity-60">No comments yet.</span>
                ) : (
                  (comments[selected] ?? []).map((c, idx) => (
                    <div key={idx} className="rounded-[5px] bg-white/20 px-3 py-2 font-grotesk text-sm">{c}</div>
                  ))
                )}
              </div>
            </div>
          ) : selected !== null && (
            <div key={selected} className="fade-in flex flex-col items-start gap-4 text-white">
              <div className="marching-border relative aspect-square w-full p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={placeholderImages[selected % placeholderImages.length]}
                  alt={items[selected].name}
                  className="absolute inset-2 h-[calc(100%-1rem)] w-[calc(100%-1rem)] object-contain"
                />
                <svg
                  className="pointer-events-none absolute inset-0 h-full w-full"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <rect
                    x="0.5"
                    y="0.5"
                    width="calc(100% - 1px)"
                    height="calc(100% - 1px)"
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                  />
                </svg>
              </div>
              <div className="flex flex-row items-center gap-3">
                <span className="font-grotesk text-[32px] leading-tight">{items[selected].name}</span>
                <span className="font-mono inline-flex items-center rounded bg-white px-1.5 py-[2px] text-[11px] uppercase tracking-wide text-black">
                  {items[selected].type}
                </span>
              </div>
              <p className="font-grotesk -mt-3 text-sm leading-snug">{items[selected].description}</p>
              {(() => {
                const stacked = Math.max(0, items[selected].votes.up, items[selected].votes.down) >= 100;
                const cell = stacked
                  ? "flex flex-1 flex-col items-start justify-center gap-0.5 px-3 py-2 font-grotesk"
                  : "flex flex-1 flex-row items-center justify-center gap-1.5 whitespace-nowrap px-3 py-2 font-grotesk";
                return (
                  <div className="flex w-full overflow-hidden rounded-[5px] bg-white/20">
                    <div className={cell}>
                      <span className="text-xs font-medium uppercase opacity-60">Favorites</span>
                      <span className="text-xs font-normal">0</span>
                    </div>
                    <div className={`${cell} border-l border-white/20`}>
                      <span className="text-xs font-medium uppercase opacity-60">Upvotes</span>
                      <span className="text-xs font-normal">{items[selected].votes.up}</span>
                    </div>
                    <div className={`${cell} border-l border-white/20`}>
                      <span className="text-xs font-medium uppercase opacity-60">Downvotes</span>
                      <span className="text-xs font-normal">{items[selected].votes.down}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </aside>
      </div>
      {mode === "VOTE" && <VoteCursor />}
      {mode === "COMMENT" && !commentTarget && <CommentCursor />}
      {commentTarget && (
        <div
          ref={commentPopRef}
          className="fixed z-50 flex items-end gap-2"
          style={{ left: commentTarget.x, top: commentTarget.y, transform: "translate(-12px, -12px)" }}
        >
          <div className="text-paradigm" style={{ transform: "scale(2)", transformOrigin: "bottom left" }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M1 3.5A1.5 1.5 0 0 1 2.5 2h10A1.5 1.5 0 0 1 14 3.5v5a1.5 1.5 0 0 1-1.5 1.5H6.207l-1.853 1.854a.5.5 0 0 1-.854-.354V10H2.5A1.5 1.5 0 0 1 1 8.5v-5Z" />
            </svg>
          </div>
          <div className="ml-4 flex min-w-[320px] items-center gap-2 rounded-full bg-[#2a2a2a] pl-4 pr-1.5 py-1 shadow-lg">
            <input
              autoFocus
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitComment(); }}
              placeholder="Add a comment"
              className="flex-1 bg-transparent py-1 font-grotesk text-sm text-white placeholder:text-white/50 focus:outline-none"
            />
            <button
              type="button"
              disabled={commentText.length === 0}
              onClick={submitComment}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-white transition-all duration-200 disabled:cursor-not-allowed ${commentText.length > 0 ? "bg-paradigm" : "bg-white/20"}`}
              style={{ transform: commentText.length > 0 ? "rotate(45deg)" : "rotate(0deg)" }}
              aria-label="Send"
            >
              <ArrowUpIcon />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

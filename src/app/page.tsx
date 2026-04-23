"use client";

import { useEffect, useRef, useState } from "react";
import {
  AccessibilityIcon,
  ArrowTopRightIcon,
  ArrowUpIcon,
  ChatBubbleIcon,
  CircleBackslashIcon,
  EyeOpenIcon,
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

function Action({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="font-semi-mono absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 bg-paradigm px-3 py-1 text-xs uppercase text-black whitespace-nowrap">
      <span className="inline-flex items-center justify-center leading-none [&_svg]:h-3 [&_svg]:w-3">{icon}</span>
      {text}
    </span>
  );
}

function BlurEdgeScroll({ children, className, edgeHeight = 20 }: { children: React.ReactNode; className?: string; edgeHeight?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      setAtTop(el.scrollTop <= 1);
      setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 1);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    return () => { el.removeEventListener("scroll", update); ro.disconnect(); };
  });
  const layers = [
    { blur: 2, from: 0, to: 1 },
    { blur: 6, from: 0, to: 0.75 },
    { blur: 12, from: 0, to: 0.5 },
    { blur: 24, from: 0, to: 0.3 },
  ];
  const edgeStyle = (side: "top" | "bottom", l: { blur: number; from: number; to: number }) => {
    const dir = side === "top" ? "to bottom" : "to top";
    const mask = `linear-gradient(${dir}, rgba(0,0,0,1) ${l.from * 100}%, rgba(0,0,0,0) ${l.to * 100}%)`;
    return {
      backgroundColor: "var(--color-paradigm)",
      backdropFilter: `blur(${l.blur}px)`,
      WebkitBackdropFilter: `blur(${l.blur}px)`,
      maskImage: mask,
      WebkitMaskImage: mask,
    } as React.CSSProperties;
  };
  return (
    <div className="relative flex min-h-0 flex-1 w-full">
      <div ref={ref} className={`h-full w-full overflow-y-auto ${className ?? ""}`}>{children}</div>
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 transition-opacity duration-500 ease-out ${atTop ? "opacity-0" : "opacity-100"}`}
        style={{ height: edgeHeight }}
      >
        {layers.map((l, i) => (
          <div key={i} className="absolute inset-0" style={edgeStyle("top", l)} />
        ))}
      </div>
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 bottom-0 transition-opacity duration-500 ease-out ${atBottom ? "opacity-0" : "opacity-100"}`}
        style={{ height: edgeHeight }}
      >
        {layers.map((l, i) => (
          <div key={i} className="absolute inset-0" style={edgeStyle("bottom", l)} />
        ))}
      </div>
    </div>
  );
}

function ThickUp({ filled = true }: { filled?: boolean } = {}) {
  return (
    <svg width="13" height="13" viewBox="0 0 15 15" fill={filled ? "currentColor" : "none"} xmlns="http://www.w3.org/2000/svg">
      <path d="M7.5 2L12.5 7.5H10V13H5V7.5H2.5L7.5 2Z" stroke="currentColor" strokeLinejoin="round" />
    </svg>
  );
}
function ThickDown({ filled = true }: { filled?: boolean } = {}) {
  return (
    <svg width="13" height="13" viewBox="0 0 15 15" fill={filled ? "currentColor" : "none"} xmlns="http://www.w3.org/2000/svg">
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

function formatVoteTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  if (diffMs < dayMs) {
    const hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const suffix = hours >= 12 ? "pm" : "am";
    const h12 = ((hours + 11) % 12) + 1;
    return `${h12}:${minutes}${suffix}`;
  }
  const days = Math.floor(diffMs / dayMs);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "Last week";
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

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
  const [hungerGames, setHungerGames] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [lastAction, setLastAction] = useState<{ icon: React.ReactNode; text: string } | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [hoveredUp, setHoveredUp] = useState<boolean | null>(null);
  const [userVotes, setUserVotes] = useState<Record<number, { address: string; dir: "up" | "down"; ts: number }[]>>({});
  const [commentTarget, setCommentTarget] = useState<{ i: number; x: number; y: number; w?: number; anchor?: "cursor" | "cell" } | null>(null);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Record<number, { address: string; text: string }[]>>({});
  const userAddress = useRef<string>("");
  if (!userAddress.current) {
    userAddress.current = "0x" + Array.from({ length: 40 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
  }
  const [panelCommentText, setPanelCommentText] = useState("");
  const [panelVisible, setPanelVisible] = useState(true);
  const [popoverVisible, setPopoverVisible] = useState(true);
  const [commentTargetVisible, setCommentTargetVisible] = useState(true);
  const closeCommentTimerRef = useRef<number | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [headerH, setHeaderH] = useState(0);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const measure = () => setHeaderH(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("snackway.comments");
      if (raw) {
        const parsed = JSON.parse(raw) as Record<number, unknown[]>;
        const migrated: Record<number, { address: string; text: string }[]> = {};
        for (const k of Object.keys(parsed)) {
          migrated[+k] = (parsed[+k] as unknown[]).map((c) =>
            typeof c === "string" ? { address: userAddress.current, text: c } : (c as { address: string; text: string })
          );
        }
        setComments(migrated);
      }
    } catch {}
    // TODO: replace localStorage with shared backend so vote tallies aggregate across users.
    try {
      const raw = localStorage.getItem("snackway.votes");
      if (raw) {
        const parsed = JSON.parse(raw) as Record<number, { address: string; dir: "up" | "down"; ts?: number }[]>;
        const migrated: Record<number, { address: string; dir: "up" | "down"; ts: number }[]> = {};
        for (const k of Object.keys(parsed)) {
          migrated[+k] = parsed[+k].map((v) => ({ address: v.address, dir: v.dir, ts: v.ts ?? Date.now() }));
        }
        setUserVotes(migrated);
      }
    } catch {}
  }, []);

  function submitComment() {
    if (!commentTarget || commentText.trim().length === 0) return;
    const i = commentTarget.i;
    setComments((prev) => {
      const next = { ...prev, [i]: [...(prev[i] ?? []), { address: userAddress.current, text: commentText.trim() }] };
      try { localStorage.setItem("snackway.comments", JSON.stringify(next)); } catch {}
      return next;
    });
    setSelected(i);
    setCommentTarget(null);
    setCommentText("");
    setLastAction({ icon: <ChatBubbleIcon />, text: `MADE A COMMENT ON ${items[i].name}` });
  }

  function submitPanelComment() {
    if (selected === null || panelCommentText.trim().length === 0) return;
    const i = selected;
    const text = panelCommentText.trim();
    setComments((prev) => {
      const next = { ...prev, [i]: [...(prev[i] ?? []), { address: userAddress.current, text }] };
      try { localStorage.setItem("snackway.comments", JSON.stringify(next)); } catch {}
      return next;
    });
    setPanelCommentText("");
    setLastAction({ icon: <ChatBubbleIcon />, text: `MADE A COMMENT ON ${items[i].name}` });
  }
  const commentPopRef = useRef<HTMLDivElement>(null);

  function cancelComment() {
    if (!commentTarget) return;
    setLastAction({ icon: <CircleBackslashIcon />, text: "CANCELLED COMMENTING" });
    setCommentTargetVisible(false);
    setPopoverVisible(false);
    if (closeCommentTimerRef.current) window.clearTimeout(closeCommentTimerRef.current);
    closeCommentTimerRef.current = window.setTimeout(() => {
      setCommentTarget(null);
      setCommentText("");
      setCommentTargetVisible(true);
      closeCommentTimerRef.current = null;
    }, 220);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && commentTarget) {
        cancelComment();
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
        const onCell = (e.target as Element | null)?.closest("[data-snack-cell]");
        if (onCell) return;
        cancelComment();
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

  function openComment(i: number, x: number, y: number, w?: number, anchor: "cursor" | "cell" = "cursor") {
    setLastAction({ icon: <InputIcon />, text: "ESC TO STOP COMMENTING" });
    if (closeCommentTimerRef.current) {
      window.clearTimeout(closeCommentTimerRef.current);
      closeCommentTimerRef.current = null;
    }
    const closing = !commentTargetVisible;
    if (commentTarget && commentTarget.i !== i && !closing) {
      setSelected(i);
      setCommentTarget({ i, x, y, w, anchor });
      setPanelVisible(true);
      setPopoverVisible(true);
      setCommentTargetVisible(true);
    } else if (commentTarget && commentTarget.i !== i) {
      setPanelVisible(false);
      setPopoverVisible(false);
      setCommentTargetVisible(false);
      setTimeout(() => {
        setSelected(i);
        setCommentTarget({ i, x, y, w, anchor });
        setCommentText("");
        setPanelVisible(true);
        setPopoverVisible(true);
        setCommentTargetVisible(true);
      }, 220);
    } else if (selected !== null && selected !== i) {
      setPanelVisible(false);
      setTimeout(() => {
        setSelected(i);
        setCommentTarget({ i, x, y, w, anchor });
        setCommentText("");
        setPanelVisible(true);
        setPopoverVisible(true);
        setCommentTargetVisible(true);
      }, 220);
    } else if (closing && commentTarget && commentTarget.i === i) {
      setCommentTarget({ i, x, y, w, anchor });
      setCommentText("");
      setPanelVisible(true);
      setPopoverVisible(true);
      setCommentTargetVisible(true);
    } else {
      setSelected(i);
      setCommentTarget({ i, x, y, w, anchor });
      setCommentText("");
      setPanelVisible(true);
      setPopoverVisible(true);
      setCommentTargetVisible(true);
    }
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
  function tally(i: number) {
    const list = userVotes[i] ?? [];
    let up = items[i].votes.up;
    let down = items[i].votes.down;
    for (const v of list) {
      if (v.dir === "up") up += 1;
      else down += 1;
    }
    return { up, down };
  }
  const myVote = (i: number) => userVotes[i]?.find((v) => v.address === userAddress.current)?.dir ?? null;
  function voteSnack(i: number, up: boolean) {
    const dir: "up" | "down" = up ? "up" : "down";
    const now = Date.now();
    const list = userVotes[i] ?? [];
    const existing = list.find((x) => x.address === userAddress.current);
    let nextList: { address: string; dir: "up" | "down"; ts: number }[];
    let removed = false;
    if (!existing) {
      nextList = [...list, { address: userAddress.current, dir, ts: now }];
    } else if (existing.dir === dir) {
      nextList = list.filter((x) => x.address !== userAddress.current);
      removed = true;
    } else {
      nextList = list.map((x) => (x.address === userAddress.current ? { ...x, dir, ts: now } : x));
    }
    const next = { ...userVotes, [i]: nextList };
    setUserVotes(next);
    try { localStorage.setItem("snackway.votes", JSON.stringify(next)); } catch {}
    const verb = removed ? "REMOVED VOTE ON" : up ? "UPVOTED" : "DOWNVOTED";
    setLastAction({
      icon: removed ? <UpdateIcon /> : up ? <ThickUp /> : <ThickDown />,
      text: `${verb} ${items[i].name}`,
    });
  }
  return (
    <main className="flex flex-1 flex-col">
      <header ref={headerRef} className="sticky top-0 z-20 flex items-center justify-between border-b-[0.5px] border-paradigm bg-white px-4 py-3">
        <div className="flex items-center gap-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/paradigm-logo.png"
            alt="Paradigm logo"
            className="h-[30px] w-[30px] cursor-pointer"
            onClick={() => setHungerGames((v) => {
              if (!v) setLastAction({ icon: <EyeOpenIcon />, text: "FOUND THE TRUE MEANING" });
              return !v;
            })}
          />
          <span
            className="group relative inline-block font-gaisyr text-lg font-normal tracking-tight"
            onMouseEnter={() => setLastAction({ icon: <AccessibilityIcon />, text: "LEARNED WHERE WE ARE" })}
          >
            <span className={`transition-opacity duration-300 ${hungerGames ? "opacity-0" : "opacity-100"}`}>
              524 Snackway<span className="opacity-0 transition-opacity group-hover:opacity-100">, New York, NY 10012</span>
            </span>
            <span className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${hungerGames ? "opacity-100" : "opacity-0"}`}>
              Hunger Games
            </span>
          </span>
        </div>
        {lastAction && (
          <Action icon={lastAction.icon} text={lastAction.text} />
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
                  {(() => {
                    const t = tally(i);
                    const mine = myVote(i);
                    return (
                      <div className="flex gap-3">
                        <span className="inline-flex items-center gap-1"><span className="text-[#ffd60a]"><StarIcon /></span> 0</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); voteSnack(i, true); }}
                          className="inline-flex cursor-pointer items-center gap-1 hover:opacity-80"
                          aria-label="Upvote"
                        >
                          <span className="text-paradigm"><ThickUp filled={mine === "up"} /></span> {t.up}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); voteSnack(i, false); }}
                          className="inline-flex cursor-pointer items-center gap-1 hover:opacity-80"
                          aria-label="Downvote"
                        >
                          <span className="text-[#ff3b30]"><ThickDown filled={mine === "down"} /></span> {t.down}
                        </button>
                      </div>
                    );
                  })()}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const cell = (e.currentTarget as HTMLElement).closest("[data-snack-cell]") as HTMLElement | null;
                      const r = (cell ?? (e.currentTarget as HTMLElement)).getBoundingClientRect();
                      openComment(i, r.left + r.width / 2, r.bottom, r.width, "cell");
                    }}
                    className="inline-flex cursor-pointer items-center justify-center text-paradigm hover:opacity-80"
                    aria-label="Comment"
                  >
                    <svg width="13" height="13" viewBox="0 0 15 15" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ transform: "scaleX(-1)" }}>
                      <path fillRule="evenodd" clipRule="evenodd" d="M1 3.5A1.5 1.5 0 0 1 2.5 2h10A1.5 1.5 0 0 1 14 3.5v5a1.5 1.5 0 0 1-1.5 1.5H6.207l-1.853 1.854a.5.5 0 0 1-.854-.354V10H2.5A1.5 1.5 0 0 1 1 8.5v-5Z" stroke="currentColor" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </HoverTooltip>
          ))}
        </div>
        <div aria-hidden="true" className="h-20" />
      </div>
      <aside className="relative w-1/4 border-l-[0.5px] border-paradigm">
        <div
          style={{ top: headerH, height: `calc(100vh - ${headerH}px)` }}
          className={`sticky flex flex-col overflow-hidden px-5 py-8 transition-colors duration-300 ease-in-out ${
            mode === "SELECT" || mode === "COMMENT" ? "bg-paradigm" : "bg-transparent"
          }`}
        >
          {mode === "VOTE" ? (
            (() => {
              const flat = Object.entries(userVotes).flatMap(([k, list]) =>
                list.map((v) => ({ ...v, i: Number(k), name: items[Number(k)].name }))
              );
              const filtered = hoveredIdx !== null ? flat.filter((v) => v.i === hoveredIdx) : flat;
              const sorted = filtered.sort((a, b) => b.ts - a.ts);
              const headerLabel = hoveredIdx !== null ? `${items[hoveredIdx].name} activity` : "Global activity";
              return (
                <div className="flex h-full w-full min-w-0 flex-col text-paradigm">
                  <div className="mb-3">
                    <span className="font-grotesk inline-flex items-center justify-center rounded-md bg-paradigm px-2 py-[3px] text-sm font-normal text-black whitespace-nowrap">
                      {headerLabel}
                    </span>
                  </div>
                  <div
                    className={`grid w-full transition-[grid-template-rows,margin-bottom] duration-200 ease-in-out ${hoveredIdx !== null && hoveredUp !== null ? "grid-rows-[1fr] mb-3" : "grid-rows-[0fr] mb-0"}`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      {hoveredIdx !== null && hoveredUp !== null && (
                        <div
                          className={`marching-border relative inline-block px-3 py-1 transition-opacity duration-200 ease-in-out ${hoveredUp ? "text-paradigm" : "text-[#ff3b30]"}`}
                        >
                          <span className="inline-flex items-center gap-1.5 font-grotesk text-base">
                            {hoveredUp ? <ThickUp /> : <ThickDown />}
                            {hoveredUp ? "Upvote" : "Downvote"} on {items[hoveredIdx].name}
                          </span>
                          <svg
                            className="pointer-events-none absolute inset-0 h-full w-full"
                            preserveAspectRatio="none"
                            aria-hidden="true"
                          >
                            <rect x="0.5" y="0.5" width="calc(100% - 1px)" height="calc(100% - 1px)" fill="none" stroke="currentColor" strokeWidth="1" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-1 w-full min-w-0 flex-col gap-1.5 overflow-y-auto overflow-x-hidden">
                    {sorted.length === 0 ? (
                      <span className="font-grotesk text-sm opacity-60">No votes yet.</span>
                    ) : (
                      sorted.map((v, idx) => (
                        <div
                          key={`${v.i}-${v.address}-${v.ts}-${idx}`}
                          className={`font-grotesk flex w-full min-w-0 items-baseline justify-between gap-3 text-sm ${v.dir === "up" ? "text-paradigm" : "text-[#ff3b30]"}`}
                        >
                          <span className="min-w-0 flex-1 truncate">
                            Someone {v.dir === "up" ? "liked" : "disliked"} {v.name}
                          </span>
                          <span className="shrink-0 opacity-70">{formatVoteTime(v.ts)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })()
          ) : selected !== null && mode === "COMMENT" ? (
            <div className={`flex flex-1 min-h-0 flex-col text-white transition-opacity duration-200 ease-in-out ${panelVisible ? "opacity-100" : "opacity-0"}`}>
              <BlurEdgeScroll className="flex flex-col items-start">
              <div
                className={`grid w-full transition-[grid-template-rows,margin-bottom] duration-200 ease-in-out ${commentTarget && commentTargetVisible ? "grid-rows-[1fr] mb-4" : "grid-rows-[0fr] mb-0"}`}
              >
                <div className="min-h-0 overflow-hidden">
                  {commentTarget && (
                    <div className={`marching-border relative inline-block px-3 py-1 transition-opacity duration-200 ease-in-out ${commentTargetVisible ? "opacity-100" : "opacity-0"}`}>
                      <span className="inline-flex items-center gap-1.5 font-grotesk text-base"><InputIcon /> Commenting on {items[commentTarget.i].name}</span>
                      <svg
                        className="pointer-events-none absolute inset-0 h-full w-full"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <rect x="0.5" y="0.5" width="calc(100% - 1px)" height="calc(100% - 1px)" fill="none" stroke="white" strokeWidth="1" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex w-full flex-col gap-2">
                {(comments[selected] ?? []).length === 0 ? (
                  <span className="font-grotesk text-sm text-white">No comments yet.</span>
                ) : (
                  (comments[selected] ?? []).map((c, idx) => (
                    <div key={idx} className="flex flex-col gap-0.5 rounded-[5px] bg-white/20 px-3 py-2 font-grotesk text-sm">
                      <span className="font-semi-mono text-[11px] opacity-70">{c.address.slice(0, 6)}…{c.address.slice(-4)}</span>
                      <span>{c.text}</span>
                    </div>
                  ))
                )}
              </div>
              </BlurEdgeScroll>
              <div className="-mx-5 mt-4 border-t border-white/40 px-5 pt-4">
              <div className="flex items-center gap-3">
                <input
                  value={panelCommentText}
                  onChange={(e) => setPanelCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submitPanelComment(); }}
                  placeholder="Add a comment"
                  className="flex-1 bg-transparent font-grotesk text-sm text-white placeholder:text-white/70 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={submitPanelComment}
                  disabled={panelCommentText.trim().length === 0}
                  className="cursor-pointer font-grotesk text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Post
                </button>
              </div>
              </div>
            </div>
          ) : selected !== null && (
            <div key={selected} className="fade-in flex h-full w-full min-h-0 flex-col items-start gap-4 text-white">
              <div className="marching-border relative aspect-square w-full shrink-0 p-2">
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
              <div className="flex shrink-0 flex-row items-center gap-3">
                <span className="font-grotesk text-[32px] leading-tight">{items[selected].name}</span>
                <span className="font-mono inline-flex items-center rounded bg-white px-1.5 py-[2px] text-[11px] uppercase tracking-wide text-black">
                  {items[selected].type}
                </span>
              </div>
              <p className="font-grotesk -mt-3 shrink-0 text-sm leading-snug">{items[selected].description}</p>
              {(() => {
                const t = tally(selected);
                const stacked = Math.max(0, t.up, t.down) >= 100;
                const cell = stacked
                  ? "flex flex-1 flex-col items-start justify-center gap-0.5 px-3 py-2 font-grotesk"
                  : "flex flex-1 flex-row items-center justify-center gap-1.5 whitespace-nowrap px-3 py-2 font-grotesk";
                return (
                  <div className="flex w-full shrink-0 overflow-hidden rounded-[5px] bg-white/20">
                    <div className={cell}>
                      <span className="text-xs font-medium uppercase opacity-60">Favorites</span>
                      <span className="text-xs font-normal">0</span>
                    </div>
                    <div className={`${cell} border-l border-white/20`}>
                      <span className="text-xs font-medium uppercase opacity-60">Upvotes</span>
                      <span className="text-xs font-normal">{t.up}</span>
                    </div>
                    <div className={`${cell} border-l border-white/20`}>
                      <span className="text-xs font-medium uppercase opacity-60">Downvotes</span>
                      <span className="text-xs font-normal">{t.down}</span>
                    </div>
                  </div>
                );
              })()}
              <BlurEdgeScroll className="flex flex-col gap-2">
                {(comments[selected] ?? []).length === 0 ? (
                  <span className="font-grotesk text-sm text-white/60">No comments yet.</span>
                ) : (
                  (comments[selected] ?? []).map((c, idx) => (
                    <div key={idx} className="flex shrink-0 flex-col gap-0.5 rounded-[5px] bg-white/20 px-3 py-2 font-grotesk text-sm">
                      <span className="font-semi-mono text-[11px] opacity-70">{c.address.slice(0, 6)}…{c.address.slice(-4)}</span>
                      <span>{c.text}</span>
                    </div>
                  ))
                )}
              </BlurEdgeScroll>
            </div>
          )}
        </div>
      </aside>
      </div>
      <footer aria-hidden="true" className="h-40 border-t-[0.5px] border-paradigm" />
      {mode === "VOTE" && <VoteCursor />}
      {mode === "COMMENT" && !commentTarget && <CommentCursor />}
      {commentTarget && (
        <div
          ref={commentPopRef}
          className={`fixed z-50 flex items-end gap-2 transition-opacity duration-200 ease-in-out ${popoverVisible ? "opacity-100" : "opacity-0"}`}
          style={
            commentTarget.anchor === "cell"
              ? { left: commentTarget.x, top: commentTarget.y, transform: "translate(-50%, -100%)", maxWidth: commentTarget.w, width: commentTarget.w }
              : { left: commentTarget.x, top: commentTarget.y, transform: "translate(-12px, -12px)" }
          }
        >
          {commentTarget.anchor !== "cell" && (
            <button
              type="button"
              onClick={cancelComment}
              aria-label="Cancel comment"
              className="cursor-pointer text-paradigm transition-colors duration-150 hover:text-[#ff3b30]"
              style={{ transform: "scale(2)", transformOrigin: "bottom left" }}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M1 3.5A1.5 1.5 0 0 1 2.5 2h10A1.5 1.5 0 0 1 14 3.5v5a1.5 1.5 0 0 1-1.5 1.5H6.207l-1.853 1.854a.5.5 0 0 1-.854-.354V10H2.5A1.5 1.5 0 0 1 1 8.5v-5Z" />
              </svg>
            </button>
          )}
          <div className={`flex items-center gap-2 rounded-full bg-[#2a2a2a] pl-4 pr-1.5 py-1 shadow-lg ${commentTarget.anchor === "cell" ? "flex-1 min-w-0" : "ml-4 min-w-[320px]"}`}>
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

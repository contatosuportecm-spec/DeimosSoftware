"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ZoomIn, ZoomOut, Maximize2, Trophy, Shield, Crown } from "lucide-react";
import { DecisionBadge, RoundStatusBadge } from "./StatusBadge";
import type { AutoresearchRound, RoundVariant, SlotResult } from "@/types/autoresearch";

interface OptimizationBoardProps {
  rounds: AutoresearchRound[];
  baseline: number | null;
  currentValue: string | null;
  slotCount: number;
}

const MIN_SCALE = 0.15;
const MAX_SCALE = 2;
const CARD_W = 360;
const CARD_GAP = 48;

const SLOT_COLORS = [
  { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)", text: "#f59e0b" },
  { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.35)", text: "#3b82f6" },
  { bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.35)", text: "#a855f7" },
  { bg: "rgba(236,72,153,0.12)", border: "rgba(236,72,153,0.35)", text: "#ec4899" },
  { bg: "rgba(14,165,233,0.12)", border: "rgba(14,165,233,0.35)", text: "#0ea5e9" },
  { bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.35)", text: "#22c55e" },
  { bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.35)", text: "#f97316" },
  { bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.35)", text: "#6366f1" },
];

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export default function OptimizationBoard({
  rounds,
  baseline,
  currentValue,
  slotCount,
}: OptimizationBoardProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const baselineRef = useRef<HTMLDivElement>(null);

  const [transform, setTransform] = useState({ x: 32, y: 32, k: 1 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [connectors, setConnectors] = useState<
    { x1: number; y1: number; x2: number; y2: number; color: string }[]
  >([]);
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });

  // ── Pan via mouse drag (only on the canvas itself, not on buttons) ──
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      // Don't start drag if clicking a button or interactive element
      const target = e.target as HTMLElement;
      if (target.closest("button")) return;
      setDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    },
    [transform.x, transform.y],
  );
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      setTransform((t) => ({ ...t, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }));
    },
    [dragging, dragStart],
  );
  const handleMouseUp = useCallback(() => setDragging(false), []);

  // ── Free scroll: normal wheel = pan, Ctrl/Meta+wheel = zoom ──
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        // Pinch-to-zoom (trackpad pinch)
        const d = e.deltaY > 0 ? 0.92 : 1.08;
        setTransform((t) => {
          const newK = clamp(t.k * d, MIN_SCALE, MAX_SCALE);
          const rect = el.getBoundingClientRect();
          const cx = e.clientX - rect.left;
          const cy = e.clientY - rect.top;
          const s = newK / t.k;
          return { k: newK, x: cx - (cx - t.x) * s, y: cy - (cy - t.y) * s };
        });
      } else {
        // Scroll = zoom centered on viewport
        const d = e.deltaY > 0 ? 0.95 : 1.05;
        setTransform((t) => {
          const newK = clamp(t.k * d, MIN_SCALE, MAX_SCALE);
          const rect = el.getBoundingClientRect();
          const cx = rect.width / 2;
          const cy = rect.height / 2;
          const s = newK / t.k;
          return { k: newK, x: cx - (cx - t.x) * s, y: cy - (cy - t.y) * s };
        });
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // ── Zoom centered on viewport ──
  const zoomTo = useCallback((factor: number) => {
    const vp = viewportRef.current;
    if (!vp) return;
    const rect = vp.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    setTransform((t) => {
      const newK = clamp(t.k * factor, MIN_SCALE, MAX_SCALE);
      const s = newK / t.k;
      return { k: newK, x: cx - (cx - t.x) * s, y: cy - (cy - t.y) * s };
    });
  }, []);

  // ── Fit all: measure real content, scale to fit viewport ──
  const fitAll = useCallback(() => {
    const vp = viewportRef.current;
    const ct = contentRef.current;
    if (!vp || !ct) return;
    const cw = ct.scrollWidth;
    const ch = ct.scrollHeight;
    if (cw === 0 || ch === 0) return;
    const k = clamp(
      Math.min((vp.clientWidth - 64) / cw, (vp.clientHeight - 64) / ch),
      MIN_SCALE,
      0.9,
    );
    setTransform({
      k,
      x: (vp.clientWidth - cw * k) / 2,
      y: (vp.clientHeight - ch * k) / 2,
    });
  }, []);

  // ── Measure card positions and build connectors ──
  useEffect(() => {
    const ct = contentRef.current;
    const bl = baselineRef.current;
    if (!ct || !bl) return;

    const measure = () => {
      const ctRect = ct.getBoundingClientRect();
      const lines: typeof connectors = [];

      const toLocal = (el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        return {
          top: (r.top - ctRect.top) / 1,
          bottom: (r.bottom - ctRect.top) / 1,
          centerX: (r.left - ctRect.left + r.width / 2) / 1,
        };
      };

      const blPos = toLocal(bl);

      // Baseline -> R1
      if (cardRefs.current[0]) {
        const r1 = toLocal(cardRefs.current[0]!);
        lines.push({
          x1: blPos.centerX,
          y1: blPos.bottom,
          x2: r1.centerX,
          y2: r1.top,
          color: "#f59e0b",
        });
      }

      // Round N -> Round N+1
      for (let i = 0; i < rounds.length - 1; i++) {
        const cardEl = cardRefs.current[i];
        const nextEl = cardRefs.current[i + 1];
        if (!cardEl || !nextEl) continue;

        const round = rounds[i];
        const pos = toLocal(cardEl);
        const nextPos = toLocal(nextEl);

        const color =
          round.status === "decided" && round.decision === "promoted" ? "#22c55e" : "#f59e0b";

        lines.push({
          x1: pos.centerX,
          y1: pos.bottom,
          x2: nextPos.centerX,
          y2: nextPos.top,
          color,
        });
      }

      setSvgSize({ w: ctRect.width, h: ctRect.height });
      setConnectors(lines);
    };

    // Double rAF to ensure DOM is fully rendered before measuring
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(measure);
    });
    return () => cancelAnimationFrame(raf);
  }, [rounds, slotCount, currentValue, baseline]);

  // ── Auto fitAll when rounds change ──
  const prevRoundCount = useRef(0);
  useEffect(() => {
    if (rounds.length === 0) return;
    // Only fitAll when new rounds appear, not on every data update
    if (rounds.length !== prevRoundCount.current) {
      prevRoundCount.current = rounds.length;
      const t = setTimeout(fitAll, 120);
      return () => clearTimeout(t);
    }
  }, [rounds.length, fitAll]);

  const baselineRate = Number(baseline ?? 0);

  return (
    <div
      ref={viewportRef}
      className="relative h-[620px] rounded-2xl border border-white/[0.07] bg-[#060608] select-none overflow-hidden"
      style={{ cursor: dragging ? "grabbing" : "grab" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Transformable content */}
      <div
        ref={contentRef}
        className="origin-top-left"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
          width: CARD_W + 64,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: CARD_GAP,
        }}
      >
        {/* SVG Connectors (overlay) */}
        <svg
          className="absolute top-0 left-0 pointer-events-none"
          width={svgSize.w || "100%"}
          height={svgSize.h || "100%"}
          style={{ overflow: "visible" }}
        >
          {connectors.map((c, i) => {
            const midY = (c.y1 + c.y2) / 2;
            return (
              <g key={i}>
                <path
                  d={`M ${c.x1} ${c.y1} C ${c.x1} ${midY}, ${c.x2} ${midY}, ${c.x2} ${c.y2}`}
                  fill="none"
                  stroke={c.color}
                  strokeWidth={6}
                  strokeOpacity={0.1}
                  strokeLinecap="round"
                />
                <path
                  d={`M ${c.x1} ${c.y1} C ${c.x1} ${midY}, ${c.x2} ${midY}, ${c.x2} ${c.y2}`}
                  fill="none"
                  stroke={c.color}
                  strokeWidth={2}
                  strokeOpacity={0.6}
                  strokeLinecap="round"
                />
                <circle cx={c.x2} cy={c.y2 - 2} r={3} fill={c.color} fillOpacity={0.5} />
              </g>
            );
          })}
        </svg>

        {/* Baseline Card */}
        <div
          ref={baselineRef}
          className="rounded-2xl border border-amber-500/25 bg-bg-3 overflow-hidden shrink-0"
          style={{ width: CARD_W }}
        >
          <div className="h-2 bg-gradient-to-r from-amber-500 to-amber-500/30" />
          <div className="p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Shield size={16} strokeWidth={1.5} className="text-amber-400" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white">Baseline</p>
                <p className="text-[11px] text-white/40">{slotCount} slots</p>
              </div>
            </div>
            {currentValue && (
              <div className="bg-white/[0.04] rounded-xl p-3">
                <p className="text-[12px] text-white/70 leading-relaxed line-clamp-2">
                  &ldquo;{currentValue}&rdquo;
                </p>
              </div>
            )}
            <div className="pt-3 border-t border-white/[0.06]">
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Play Rate</p>
              <p className="text-[24px] font-mono font-semibold text-white tracking-tight">
                {baselineRate > 0 ? `${baselineRate.toFixed(2)}%` : "A definir"}
              </p>
            </div>
          </div>
        </div>

        {/* Round Cards */}
        {rounds.map((round, idx) => {
          const variants = (round.variants ?? []) as RoundVariant[];
          const results = (round.slot_results ?? []) as SlotResult[];
          const isDecided = round.status === "decided";
          const winnerSlot = round.winner_slot;
          const isPromoted = round.decision === "promoted";

          return (
            <div
              key={round.id}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              className={`rounded-2xl border overflow-hidden shrink-0 ${
                isPromoted
                  ? "border-emerald-500/30 bg-bg-3"
                  : round.decision === "kept"
                    ? "border-amber-500/20 bg-bg-3"
                    : "border-white/[0.08] bg-bg-3"
              }`}
              style={{ width: CARD_W }}
            >
              {/* Top bar */}
              <div
                className="h-2"
                style={{
                  background: isPromoted
                    ? "linear-gradient(90deg, #22c55e, rgba(34,197,94,0.2))"
                    : round.decision === "kept"
                      ? "linear-gradient(90deg, #f59e0b, rgba(245,158,11,0.2))"
                      : "linear-gradient(90deg, rgba(255,255,255,0.1), transparent)",
                }}
              />

              <div className="p-4 flex flex-col gap-2">
                {/* Header */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[15px] font-mono font-semibold text-white">
                      R{round.iteration_number}
                    </span>
                    {isPromoted && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15">
                        <Crown size={11} strokeWidth={1.5} className="text-emerald-400" />
                        <span className="text-[10px] font-medium text-emerald-400">Novo lider</span>
                      </div>
                    )}
                  </div>
                  {round.decision ? (
                    <DecisionBadge decision={round.decision} />
                  ) : (
                    <RoundStatusBadge status={round.status} />
                  )}
                </div>

                {/* Slot rows */}
                <div className="space-y-1.5">
                  {variants.map((v) => {
                    const result = results.find((r) => r.slot_index === v.slot_index);
                    const isWinner = isDecided && v.slot_index === winnerSlot;
                    const sc = SLOT_COLORS[v.slot_index] ?? SLOT_COLORS[1];

                    return (
                      <div
                        key={v.slot_index}
                        className="rounded-lg p-2.5 transition-all"
                        style={{
                          backgroundColor: isWinner ? "rgba(16,185,129,0.08)" : sc.bg,
                          border: `1px solid ${isWinner ? "rgba(16,185,129,0.3)" : sc.border}`,
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: isWinner ? "#22c55e" : sc.text }}
                            />
                            <span
                              className="text-[10px] font-semibold uppercase tracking-wide"
                              style={{ color: isWinner ? "#22c55e" : sc.text }}
                            >
                              {v.role === "control" ? "Ctrl" : `${String.fromCharCode(65 + v.slot_index)}`}
                            </span>
                            {isWinner && (
                              <Trophy size={10} strokeWidth={1.5} className="text-emerald-400" />
                            )}
                            {v.strategy === "scale" && (
                              <span className="px-1 py-0.5 rounded text-[7px] font-bold uppercase border border-purple-500/30 bg-purple-500/10 text-purple-400">
                                Esc
                              </span>
                            )}
                            {v.strategy === "predictability" && (
                              <span className="px-1 py-0.5 rounded text-[7px] font-bold uppercase border border-sky-500/30 bg-sky-500/10 text-sky-400">
                                Prev
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[15px] font-mono font-semibold ${
                              isWinner ? "text-emerald-400" : "text-white"
                            }`}
                          >
                            {result ? `${result.play_rate.toFixed(1)}%` : "--"}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/60 leading-snug line-clamp-2">
                          {v.headline || "Gerando..."}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Decision reason */}
                {round.decision_reason && (
                  <div className="pt-2 border-t border-white/[0.06]">
                    <p className="text-[10px] text-white/40 leading-relaxed line-clamp-1">
                      {round.decision_reason.split("|")[0].trim()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {rounds.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-center">
            <Shield size={20} strokeWidth={1.5} className="text-white/20" />
          </div>
          <p className="text-[14px] text-white/40">Nenhum round ainda</p>
          <p className="text-[12px] text-white/20">Inicie a campanha para comecar os testes A/B</p>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-bg-3/90 backdrop-blur-sm rounded-xl border border-white/[0.08] p-1.5 z-10">
        <button
          onClick={() => zoomTo(1 / 1.3)}
          className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
        >
          <ZoomOut size={15} strokeWidth={1.5} className="text-white/50" />
        </button>
        <span className="text-[11px] font-mono text-white/40 w-12 text-center">
          {Math.round(transform.k * 100)}%
        </span>
        <button
          onClick={() => zoomTo(1.3)}
          className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
        >
          <ZoomIn size={15} strokeWidth={1.5} className="text-white/50" />
        </button>
        <div className="w-px h-4 bg-white/[0.08]" />
        <button
          onClick={fitAll}
          className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
        >
          <Maximize2 size={15} strokeWidth={1.5} className="text-white/50" />
        </button>
      </div>
    </div>
  );
}

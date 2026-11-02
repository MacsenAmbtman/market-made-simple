import { useEffect, useRef, useState } from "react";
import type { Candle } from "@/lib/daytrade";

export type ChartLine = {
  id: string;
  price: number;
  label: string;
  tone: "up" | "down" | "muted";
  onDrag?: (price: number) => void; // makes the line draggable
};

const TONE = { up: "var(--primary)", down: "var(--destructive)", muted: "var(--muted-foreground)" };

/** Candlestick chart with optional volume bars and horizontal price lines. */
export function CandleChart({
  candles,
  slots,
  lines = [],
  showVolume = false,
  height = 280,
}: {
  candles: Candle[];
  slots: number; // total bars in the session, so the day fills left to right
  lines?: ChartLine[];
  showVolume?: boolean;
  height?: number;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(600);
  const [drag, setDrag] = useState<string | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => e && setWidth(Math.max(240, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const axisW = 52;
  const volH = showVolume ? 48 : 0;
  const priceH = height - volH - 8;
  const plotW = width - axisW;

  // While dragging, keep the scale frozen so the line follows the finger.
  const frozen = useRef<{ lo: number; hi: number } | null>(null);
  let lo = Math.min(...candles.map((k) => k.l), ...lines.map((l) => l.price));
  let hi = Math.max(...candles.map((k) => k.h), ...lines.map((l) => l.price));
  const pad = Math.max((hi - lo) * 0.12, hi * 0.002);
  lo -= pad;
  hi += pad;
  if (drag && frozen.current) ({ lo, hi } = frozen.current);

  const y = (p: number) => 4 + ((hi - p) / (hi - lo)) * priceH;
  const toPrice = (py: number) => hi - ((py - 4) / priceH) * (hi - lo);
  const step = plotW / slots;
  const bodyW = Math.max(2, step * 0.65);
  const maxV = Math.max(...candles.map((k) => k.v), 1);
  const ticks = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * (i + 0.5)) / 5);

  const pointerY = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    return ((e.clientY - r.top) / r.height) * height;
  };

  return (
    <div ref={wrap} className="w-full select-none" style={{ height, touchAction: drag ? "none" : "pan-y" }}>
      <svg
        ref={svg}
        width={width}
        height={height}
        role="img"
        aria-label="Candlestick price chart"
        onPointerMove={(e) => {
          if (!drag) return;
          const line = lines.find((l) => l.id === drag);
          line?.onDrag?.(Math.max(0.5, toPrice(Math.min(priceH + 4, Math.max(4, pointerY(e))))));
        }}
        onPointerUp={() => { setDrag(null); frozen.current = null; }}
        onPointerLeave={() => { setDrag(null); frozen.current = null; }}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={0} x2={plotW} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeDasharray="2 4" />
            <text x={plotW + 6} y={y(t) + 4} fontSize={11} fill="var(--muted-foreground)">{t.toFixed(2)}</text>
          </g>
        ))}

        {candles.map((k, i) => {
          const x = i * step + step / 2;
          const color = k.c >= k.o ? TONE.up : TONE.down;
          const top = y(Math.max(k.o, k.c));
          const bodyH = Math.max(1, Math.abs(y(k.o) - y(k.c)));
          return (
            <g key={i}>
              <line x1={x} x2={x} y1={y(k.h)} y2={y(k.l)} stroke={color} strokeWidth={1} />
              <rect x={x - bodyW / 2} y={top} width={bodyW} height={bodyH} fill={color} rx={0.5} />
              {showVolume && (
                <rect x={x - bodyW / 2} y={height - (k.v / maxV) * volH} width={bodyW} height={(k.v / maxV) * volH} fill={color} opacity={0.35} />
              )}
            </g>
          );
        })}

        {lines.map((l) => {
          const ly = y(l.price);
          const c = TONE[l.tone];
          return (
            <g
              key={l.id}
              style={{ cursor: l.onDrag ? "ns-resize" : "default" }}
              onPointerDown={(e) => {
                if (!l.onDrag) return;
                e.preventDefault();
                (e.target as Element).setPointerCapture?.(e.pointerId);
                frozen.current = { lo, hi };
                setDrag(l.id);
              }}
            >
              {l.onDrag && <rect x={0} y={ly - 12} width={width} height={24} fill="transparent" />}
              <line x1={0} x2={plotW} y1={ly} y2={ly} stroke={c} strokeWidth={drag === l.id ? 2 : 1.25} strokeDasharray={l.tone === "muted" ? "4 3" : "6 4"} />
              <rect x={plotW - l.label.length * 6.4 - 16} y={ly - 10} width={l.label.length * 6.4 + 12} height={20} rx={4} fill={c} />
              <text x={plotW - l.label.length * 6.4 - 10} y={ly + 4} fontSize={11} fontWeight={600} fill="var(--background)">{l.label}</text>
              <rect x={plotW + 2} y={ly - 9} width={axisW - 4} height={18} rx={4} fill={c} />
              <text x={plotW + 6} y={ly + 4} fontSize={11} fontWeight={600} fill="var(--background)">{l.price.toFixed(2)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

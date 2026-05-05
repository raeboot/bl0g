import { useEffect, useRef, useState } from "react";
import type { CanvasPiece } from "@/lib/pieces";
import { useDraggable } from "@/hooks/useDraggable";

const TONE_FOR: Record<string, string> = {
  text: "var(--bg)",
  tag: "var(--idea)",
  image: "var(--bg)",
  link: "var(--exp)",
  video: "var(--bg)",
};

export function PieceCard({
  piece,
  index,
  onMove,
  onRemove,
  containerRef,
  removing,
}: {
  piece: CanvasPiece;
  index: number;
  onMove: (pid: string, x: number, y: number) => void;
  onRemove: (pid: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  removing?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const sizeRef = useRef<{ w: number; h: number }>({ w: 240, h: 100 });

  const ref = useDraggable({
    onMove: (x, y) => onMove(piece.pid, x, y),
    bounds: () => {
      const c = containerRef.current;
      const r = c?.getBoundingClientRect();
      return {
        w: sizeRef.current.w,
        h: sizeRef.current.h,
        cw: r?.width || 800,
        ch: r?.height || 600,
      };
    },
    onStart: () => setDragging(true),
    onEnd: () => setDragging(false),
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    sizeRef.current = { w: r.width, h: r.height };
  }, [ref, piece]);

  const tilt = dragging ? "0deg" : index % 2 === 0 ? "-1.5deg" : "1.2deg";
  const bg = piece.type === "tag" ? `var(--${(piece as any).color})` : TONE_FOR[piece.type];

  return (
    <div
      ref={ref}
      className={`absolute select-none cursor-grab active:cursor-grabbing group ${removing ? "animate-fade-out" : "animate-snap-in"}`}
      style={{
        left: piece.x,
        top: piece.y,
        width: piece.w || (piece.type === "tag" ? "auto" : 240),
        transform: `rotate(${tilt})`,
        ["--tilt" as any]: tilt,
        background: bg,
        border: "2px solid var(--ink)",
        boxShadow: dragging ? "10px 10px 0 var(--shadow)" : "6px 6px 0 var(--shadow)",
        transition: "box-shadow 0.15s",
        touchAction: "none",
      }}
      onMouseEnter={(e) => {
        if (!dragging) (e.currentTarget as HTMLDivElement).style.boxShadow = "10px 10px 0 var(--shadow)";
      }}
      onMouseLeave={(e) => {
        if (!dragging) (e.currentTarget as HTMLDivElement).style.boxShadow = "6px 6px 0 var(--shadow)";
      }}
    >
      <button
        data-no-drag
        onClick={() => onRemove(piece.pid)}
        className="pixel absolute -top-3 -right-3 text-[9px] border-2 border-ink bg-background px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="remove"
      >
        [×]
      </button>
      <PieceBody piece={piece} />
    </div>
  );
}

function PieceBody({ piece }: { piece: CanvasPiece }) {
  if (piece.type === "text") {
    return <div className="p-4 text-[13px] leading-relaxed" style={{ minWidth: 140, maxWidth: 220 }}>{piece.body}</div>;
  }
  if (piece.type === "tag") {
    return <div className="pixel px-3 py-2 text-[10px]">#{piece.label}</div>;
  }
  if (piece.type === "image") {
    return (
      <div className="p-1">
        <img src={piece.src} alt={piece.caption || "img"} className="block w-full h-auto max-h-48 object-cover" />
        {piece.caption && <div className="pixel text-[9px] mt-1 px-1">{piece.caption}</div>}
      </div>
    );
  }
  if (piece.type === "link") {
    return (
      <div className="p-3" style={{ width: 240 }}>
        <div className="text-[13px] font-semibold truncate">{piece.title}</div>
        <div className="pixel text-[9px] mt-1 opacity-70">{piece.host}</div>
      </div>
    );
  }
  if (piece.type === "video") {
    return (
      <div style={{ width: 240 }}>
        <div className="relative">
          <img src={`https://img.youtube.com/vi/${piece.ytId}/hqdefault.jpg`} alt="" className="block w-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="pixel text-[16px] border-2 border-ink bg-background px-2 py-1">▶</div>
          </div>
        </div>
        <div className="p-2 border-t-2 border-ink bg-background">
          <div className="text-[12px] truncate">{piece.title}</div>
          <div className="pixel text-[9px] opacity-70">{piece.host}</div>
        </div>
      </div>
    );
  }
  return null;
}

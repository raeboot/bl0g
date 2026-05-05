import { useCallback, useRef, useState } from "react";
import { PieceCard } from "./PieceCard";
import { AdderBar } from "./AdderBar";
import type { CanvasPiece, NewPiece } from "@/lib/pieces";

let pidCounter = 0;
const nextPid = () => `p${Date.now()}-${pidCounter++}`;

export function Canvas({
  pieces,
  setPieces,
  onCommit,
  onClear,
  removingIds,
}: {
  pieces: CanvasPiece[];
  setPieces: React.Dispatch<React.SetStateAction<CanvasPiece[]>>;
  onCommit: () => void;
  onClear: () => void;
  removingIds: Set<string>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const addPiece = useCallback(
    (p: NewPiece) => {
      const c = containerRef.current;
      const w = c?.clientWidth || 600;
      const h = c?.clientHeight || 400;
      const cardW = p.type === "tag" ? 120 : p.type === "image" ? 240 : 240;
      const cardH = 120;
      const x = Math.max(10, Math.floor(Math.random() * Math.max(10, w - cardW - 20)));
      const y = Math.max(10, Math.floor(Math.random() * Math.max(10, h - cardH - 20)));
      setPieces((arr) => [...arr, { ...p, pid: nextPid(), x, y } as CanvasPiece]);
    },
    [setPieces],
  );

  const onMove = (pid: string, x: number, y: number) =>
    setPieces((arr) => arr.map((p) => (p.pid === pid ? { ...p, x, y } : p)));

  const onRemove = (pid: string) => {
    // mark as removing — parent handles full lifecycle via removingIds
    const event = new CustomEvent("bl0g:remove-piece", { detail: { pid } });
    window.dispatchEvent(event);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => addPiece({ type: "image", src: String(reader.result), caption: f.name });
      reader.readAsDataURL(f);
    });
  };

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="dot-grid relative border-2 border-ink shadow-sticky bg-background"
        style={{ minHeight: 480 }}
      >
        {pieces.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="pixel text-[10px] text-center opacity-60 leading-relaxed">
              CANVAS IS EMPTY
              <br />
              <span className="opacity-70">add pieces below · drop image files here</span>
            </div>
          </div>
        )}
        {pieces.map((p, i) => (
          <PieceCard
            key={p.pid}
            piece={p}
            index={i}
            onMove={onMove}
            onRemove={onRemove}
            containerRef={containerRef}
            removing={removingIds.has(p.pid)}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="pixel text-[10px] opacity-60">
          {pieces.length} PIECE{pieces.length === 1 ? "" : "S"}
        </span>
        <div className="flex gap-2">
          <button className="ink-btn" onClick={onClear} disabled={pieces.length === 0}>
            [ CLEAR ]
          </button>
          <button className="ink-btn win" onClick={onCommit} disabled={pieces.length === 0}>
            [ LOG IT → ]
          </button>
        </div>
      </div>

      <AdderBar onAdd={addPiece} />
    </div>
  );
}

import { useCallback, useRef } from "react";
import { PieceCard } from "./PieceCard";
import { AdderBar } from "./AdderBar";
import type { CanvasPiece, NewPiece } from "@/lib/pieces";
import { useTags } from "@/hooks/useTags";

let pidCounter = 0;
const nextPid = () => `p${Date.now()}-${pidCounter++}`;

export function Canvas({
  pieces,
  setPieces,
  onCommit,
  onClear,
  removingIds,
  selectedTagIds,
  onToggleTag,
  committing = false,
}: {
  pieces: CanvasPiece[];
  setPieces: React.Dispatch<React.SetStateAction<CanvasPiece[]>>;
  onCommit: () => void;
  onClear: () => void;
  removingIds: Set<string>;
  selectedTagIds: string[];
  onToggleTag: (id: string) => void;
  committing?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tags] = useTags();

  const addPiece = useCallback(
    (p: NewPiece) => {
      const c = containerRef.current;
      const w = c?.clientWidth || 600;
      const h = c?.clientHeight || 400;
      const cardW = p.type === "image" ? 240 : 240;
      const cardH = 120;
      const x = Math.max(10, Math.floor(Math.random() * Math.max(10, w - cardW - 20)));
      const y = Math.max(10, Math.floor(Math.random() * Math.max(10, h - cardH - 20)));
      setPieces((arr) => [...arr, { ...p, pid: nextPid(), x, y } as CanvasPiece]);
    },
    [setPieces],
  );

  const onMove = (pid: string, x: number, y: number) =>
    setPieces((arr) => arr.map((p) => (p.pid === pid ? { ...p, x, y } : p)));

  const onUpdate = (pid: string, patch: Partial<CanvasPiece>) =>
    setPieces((arr) => arr.map((p) => (p.pid === pid ? ({ ...p, ...patch } as CanvasPiece) : p)));

  const onRemove = (pid: string) => {
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

  const selectedTags = tags.filter((t) => selectedTagIds.includes(t.id));

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="dot-grid relative border-2 border-ink shadow-sticky bg-background"
        style={{ minHeight: 480 }}
      >
        {pieces.length === 0 && selectedTags.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="pixel text-[10px] text-center opacity-60 leading-relaxed">
              CANVAS IS EMPTY
              <br />
              <span className="opacity-70">add pieces below · drop image files here</span>
            </div>
          </div>
        )}

        {selectedTags.length > 0 && (
          <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-2 z-20">
            {selectedTags.map((t, i) => (
              <span
                key={t.id}
                className="pixel inline-flex items-center gap-1 border-2 border-ink px-2 py-1 text-[10px]"
                style={{
                  background: t.color,
                  boxShadow: "3px 3px 0 var(--shadow)",
                  transform: `rotate(${i % 2 === 0 ? "-1.5deg" : "1.2deg"})`,
                }}
              >
                #{t.name}
                <button
                  onClick={() => onToggleTag(t.id)}
                  aria-label={`remove ${t.name}`}
                  className="pixel text-[10px] leading-none px-1 hover:opacity-70"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {pieces.map((p, i) => (
          <PieceCard
            key={p.pid}
            piece={p}
            index={i}
            onMove={onMove}
            onRemove={onRemove}
            onUpdate={onUpdate}
            containerRef={containerRef}
            removing={removingIds.has(p.pid)}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="pixel text-[10px] opacity-60">
          {pieces.length} PIECE{pieces.length === 1 ? "" : "S"}
          {selectedTagIds.length > 0 && ` · ${selectedTagIds.length} TAG${selectedTagIds.length === 1 ? "" : "S"}`}
        </span>
        <div className="flex gap-2">
          <button
            className="ink-btn disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={onClear}
            disabled={(pieces.length === 0 && selectedTagIds.length === 0) || committing}
          >
            [ CLEAR ]
          </button>
          <button
            className="ink-btn win disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={onCommit}
            disabled={committing || (pieces.length === 0 && selectedTagIds.length === 0)}
            title={
              pieces.length === 0 && selectedTagIds.length === 0
                ? "add a piece or tag to log"
                : undefined
            }
          >
            {committing ? "[ LOGGING… ]" : "[ LOG IT → ]"}
          </button>
        </div>
      </div>

      <AdderBar onAdd={addPiece} selectedTagIds={selectedTagIds} onToggleTag={onToggleTag} />
    </div>
  );
}

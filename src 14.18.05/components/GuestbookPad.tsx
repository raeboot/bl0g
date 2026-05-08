import { useEffect, useRef, useState } from "react";
import { addGuestbookEntry, type GuestbookEntry } from "@/lib/features";
import { Link } from "@tanstack/react-router";

const COLORS = ["#000000", "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];
const SIZES = [2, 4, 8];

export function GuestbookFAB() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-40 ink-btn flex items-center gap-2 shadow-sticky"
        style={{ background: "var(--idea)" }}
        aria-label="open guestbook"
      >
        ✏️ guestbook
      </button>
      {open && <GuestbookOverlay onClose={() => setOpen(false)} />}
    </>
  );
}

function GuestbookOverlay({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"draw" | "type">("type");
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submitText = async () => {
    if (!body.trim()) return;
    setBusy(true);
    const e: GuestbookEntry = { id: Date.now(), ts: Date.now(), kind: "text", body: body.trim(), name: name.trim() || undefined };
    await addGuestbookEntry(e);
    setBusy(false);
    setDone(true);
    setTimeout(onClose, 900);
  };

  const submitDraw = async (src: string) => {
    setBusy(true);
    const e: GuestbookEntry = { id: Date.now(), ts: Date.now(), kind: "draw", src, name: name.trim() || undefined };
    await addGuestbookEntry(e);
    setBusy(false);
    setDone(true);
    setTimeout(onClose, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="border-2 border-ink shadow-sticky-xl bg-background w-full max-w-md"
        style={{ transform: "rotate(-0.6deg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-ink p-3">
          <div className="pixel text-[12px]">✏️ GUESTBOOK</div>
          <Link to="/guestbook" onClick={onClose} className="pixel text-[9px] underline opacity-70">see wall →</Link>
        </div>
        <div className="flex border-b-2 border-ink">
          <button
            onClick={() => setTab("type")}
            className={`flex-1 pixel text-[10px] py-2 ${tab === "type" ? "bg-ink text-background" : ""}`}
            style={tab === "type" ? { background: "var(--ink)", color: "var(--bg)" } : undefined}
          >TYPE</button>
          <button
            onClick={() => setTab("draw")}
            className={`flex-1 pixel text-[10px] py-2 ${tab === "draw" ? "" : ""}`}
            style={tab === "draw" ? { background: "var(--ink)", color: "var(--bg)" } : undefined}
          >DRAW</button>
        </div>
        <div className="p-4 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="your name (optional)"
            className="w-full border-2 border-ink bg-background px-3 py-2 text-[12px]"
          />
          {tab === "type" ? (
            <>
              <textarea
                autoFocus
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="leave a warm note…"
                rows={5}
                className="w-full border-2 border-ink bg-background p-3 text-[13px]"
              />
              <div className="flex justify-end">
                <button className="ink-btn win" onClick={submitText} disabled={busy || !body.trim()}>
                  {done ? "♥ sent" : "[ SIGN → ]"}
                </button>
              </div>
            </>
          ) : (
            <DoodleCanvas onSubmit={submitDraw} done={done} busy={busy} />
          )}
        </div>
      </div>
    </div>
  );
}

function DoodleCanvas({ onSubmit, done, busy }: { onSubmit: (src: string) => void; done: boolean; busy: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(SIZES[1]);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const stack = useRef<ImageData[]>([]);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    pushSnapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushSnapshot = () => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    stack.current.push(ctx.getImageData(0, 0, c.width, c.height));
    if (stack.current.length > 25) stack.current.shift();
  };

  const undo = () => {
    const c = ref.current;
    if (!c || stack.current.length < 2) return;
    stack.current.pop();
    const prev = stack.current[stack.current.length - 1];
    c.getContext("2d")!.putImageData(prev, 0, 0);
  };

  const clear = () => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    pushSnapshot();
  };

  const pos = (e: React.PointerEvent) => {
    const c = ref.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  };

  const down = (e: React.PointerEvent) => {
    drawing.current = true;
    last.current = pos(e);
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    const p = pos(e);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(last.current!.x, last.current!.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };
  const up = () => {
    if (drawing.current) pushSnapshot();
    drawing.current = false;
    last.current = null;
  };

  const submit = () => {
    const c = ref.current!;
    onSubmit(c.toDataURL("image/png"));
  };

  return (
    <div>
      <canvas
        ref={ref}
        width={400}
        height={260}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className="block w-full border-2 border-ink touch-none cursor-crosshair"
        style={{ aspectRatio: "400/260" }}
      />
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <div className="flex gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="border-2 border-ink w-6 h-6"
              style={{ background: c, outline: color === c ? "2px solid var(--ink)" : "none", outlineOffset: 2 }}
              aria-label={c}
            />
          ))}
        </div>
        <div className="flex gap-1">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className="border-2 border-ink w-7 h-7 flex items-center justify-center"
              style={{ background: size === s ? "var(--ink)" : "var(--bg)" }}
            >
              <span style={{ background: size === s ? "var(--bg)" : "var(--ink)", borderRadius: "50%", width: s + 2, height: s + 2, display: "block" }} />
            </button>
          ))}
        </div>
        <button className="ink-btn !py-1" onClick={undo}>UNDO</button>
        <button className="ink-btn !py-1" onClick={clear}>CLEAR</button>
        <button className="ink-btn win ml-auto" onClick={submit} disabled={busy}>
          {done ? "♥ sent" : "[ SIGN → ]"}
        </button>
      </div>
    </div>
  );
}
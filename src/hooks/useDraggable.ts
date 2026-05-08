import { useEffect, useRef } from "react";

export function useDraggable(opts: {
  onMove: (x: number, y: number) => void;
  bounds?: () => { w: number; h: number; cw: number; ch: number };
  onStart?: () => void;
  onEnd?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const state = useRef({ dragging: false, ox: 0, oy: 0, startX: 0, startY: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-no-drag]")) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      const rect = el.getBoundingClientRect();
      state.current = {
        dragging: true,
        ox: e.clientX - rect.left,
        oy: e.clientY - rect.top,
        startX: e.clientX,
        startY: e.clientY,
      };
      opts.onStart?.();
    };
    const onMove = (e: PointerEvent) => {
      if (!state.current.dragging) return;
      const parent = el.parentElement;
      if (!parent) return;
      const prect = parent.getBoundingClientRect();
      let x = e.clientX - prect.left - state.current.ox;
      let y = e.clientY - prect.top - state.current.oy;
      const b = opts.bounds?.();
      if (b) {
        x = Math.max(0, Math.min(x, b.cw - b.w));
        y = Math.max(0, Math.min(y, b.ch - b.h));
      }
      opts.onMove(x, y);
    };
    const onUp = (e: PointerEvent) => {
      if (!state.current.dragging) return;
      state.current.dragging = false;
      try { el.releasePointerCapture(e.pointerId); } catch {}
      opts.onEnd?.();
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [opts]);

  return ref;
}

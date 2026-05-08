import { useEffect, useState } from "react";
import { useTags } from "@/hooks/useTags";
import { cycleColor, nextColor, nextTagId, type Tag } from "@/lib/tags";

export function ManageTagsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tags, setTags] = useTags();
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const update = (id: string, patch: Partial<Tag>) =>
    setTags(tags.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const remove = (id: string) => setTags(tags.filter((t) => t.id !== id));

  const add = () => {
    const name = newName.trim().toUpperCase().replace(/^#/, "");
    if (!name) return;
    setTags([...tags, { id: nextTagId(tags), name, color: nextColor(tags) }]);
    setNewName("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md border-2 border-ink bg-background p-5 shadow-sticky space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="pixel text-[12px]">MANAGE TAGS</div>
          <button className="ink-btn !py-1 !px-2 !text-[10px]" onClick={onClose}>×</button>
        </div>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {tags.length === 0 && (
            <div className="pixel text-[10px] opacity-50">no tags — add one below</div>
          )}
          {tags.map((t) => (
            <div key={t.id} className="flex items-center gap-2 border-2 border-ink p-2">
              <button
                onClick={() => update(t.id, { color: cycleColor(t.color) })}
                className="w-7 h-7 border-2 border-ink shrink-0"
                style={{ background: t.color }}
                title="click to cycle color"
              />
              <input
                value={t.name}
                onChange={(e) => update(t.id, { name: e.target.value.toUpperCase() })}
                className="flex-1 border-2 border-ink bg-background px-2 py-1 pixel text-[11px]"
              />
              <button
                onClick={() => {
                  if (confirm(`delete #${t.name}?`)) remove(t.id);
                }}
                className="ink-btn !py-1 !px-2 !text-[10px]"
                style={{ background: "var(--bug)" }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="border-t-2 border-ink pt-3 space-y-2">
          <div className="pixel text-[9px] opacity-60">NEW TAG</div>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="tag name"
              className="flex-1 border-2 border-ink bg-background px-2 py-1 pixel text-[11px]"
            />
            <button className="ink-btn win" onClick={add} disabled={!newName.trim()}>
              + ADD
            </button>
          </div>
        </div>

        <div className="flex justify-end border-t-2 border-ink pt-3">
          <button className="ink-btn" onClick={onClose}>[ DONE ]</button>
        </div>
      </div>
    </div>
  );
}

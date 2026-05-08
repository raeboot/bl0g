import { useMemo, useState } from "react";
import type { Entry } from "@/lib/pieces";
import { dayKey, dayLabel, dominantColor, entriesToMarkdown } from "@/lib/pieces";
import { PieceView } from "@/components/feed/PieceView";
import { EntryEditor } from "@/components/EntryEditor";
import { useTags } from "@/hooks/useTags";
import { tagsById } from "@/lib/tags";

export function TimelinePanel({
  entries,
  onExport,
  onUpdate,
  onDelete,
}: {
  entries: Entry[];
  onExport: () => void;
  onUpdate?: (e: Entry) => Promise<void> | void;
  onDelete?: (id: number) => Promise<void> | void;
}) {
  const today = dayKey(Date.now());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterTagIds, setFilterTagIds] = useState<string[]>([]);
  const [tags] = useTags();
  const tagMap = useMemo(() => tagsById(tags), [tags]);

  const toggleFilter = (id: string) =>
    setFilterTagIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const filtered = useMemo(() => {
    if (filterTagIds.length === 0) return entries;
    return entries.filter((e) => (e.tagIds ?? []).some((id) => filterTagIds.includes(id)));
  }, [entries, filterTagIds]);

  const groups = new Map<string, Entry[]>();
  for (const e of filtered) {
    const k = dayKey(e.ts);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(e);
  }
  const keys = Array.from(groups.keys()).sort((a, b) => (a < b ? 1 : -1));

  const exportLocal = () => {
    const md = entriesToMarkdown(filtered);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bl0g.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border-2 border-ink p-4 h-full" style={{ background: "var(--log-bg)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="pixel text-[12px]">TIMELINE</h3>
        <button className="ink-btn" onClick={() => { onExport(); exportLocal(); }}>
          [ EXPORT → ]
        </button>
      </div>

      {tags.length > 0 && (
        <div className="mb-4 border-2 border-ink p-2 bg-background">
          <div className="flex items-center justify-between mb-2">
            <div className="pixel text-[9px] opacity-60">FILTER BY TAG</div>
            {filterTagIds.length > 0 && (
              <button
                className="pixel text-[8px] underline opacity-70 hover:opacity-100"
                onClick={() => setFilterTagIds([])}
              >
                clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => {
              const selected = filterTagIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggleFilter(t.id)}
                  className="pixel text-[9px] border-2 border-ink px-1.5 py-0.5"
                  style={{
                    background: t.color,
                    outline: selected ? "2px solid var(--ink)" : "none",
                    outlineOffset: 2,
                    opacity: selected ? 1 : 0.5,
                  }}
                >
                  #{t.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="pixel text-[10px] opacity-60">
          {entries.length === 0 ? "no entries yet" : "no entries match the selected tags"}
        </div>
      )}
      <div className="space-y-6">
        {keys.map((k) => (
          <div key={k}>
            <div className="pixel text-[10px] mb-2">{dayLabel(k, today)}</div>
            <div className="space-y-3">
              {groups.get(k)!.map((e) => {
                if (editingId === e.id && onUpdate) {
                  return (
                    <EntryEditor
                      key={e.id}
                      entry={e}
                      onSave={async (next) => {
                        await onUpdate(next);
                        setEditingId(null);
                      }}
                      onCancel={() => setEditingId(null)}
                      onDelete={
                        onDelete
                          ? async () => {
                              await onDelete(e.id);
                              setEditingId(null);
                            }
                          : undefined
                      }
                    />
                  );
                }
                const tone = dominantColor(e.parts);
                const time = new Date(e.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                const entryTags = (e.tagIds ?? [])
                  .map((id) => tagMap.get(id))
                  .filter((t): t is NonNullable<typeof t> => !!t);
                return (
                  <div
                    key={e.id}
                    className="group bg-background p-3 border-2 border-ink"
                    style={{ borderLeftWidth: 6, borderLeftColor: `var(--${tone})` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="pixel text-[8px] opacity-60">{time}</div>
                      {onUpdate && (
                        <button
                          onClick={() => setEditingId(e.id)}
                          className="pixel text-[8px] border-2 border-ink px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          EDIT
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {e.parts.map((p, i) => (
                        <PieceView key={i} p={p} compact />
                      ))}
                    </div>
                    {entryTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t-2 border-ink/20">
                        {entryTags.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => toggleFilter(t.id)}
                            className="pixel text-[8px] border-2 border-ink px-1.5 py-0.5"
                            style={{ background: t.color }}
                          >
                            #{t.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

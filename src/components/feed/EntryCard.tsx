import { useState } from "react";
import type { Entry } from "@/lib/pieces";
import { dominantColor } from "@/lib/pieces";
import { PieceView } from "./PieceView";
import { EntryEditor } from "@/components/EntryEditor";
import { useTags } from "@/hooks/useTags";

export function EntryCard({
  entry,
  canEdit = false,
  onUpdate,
  onDelete,
}: {
  entry: Entry;
  canEdit?: boolean;
  onUpdate?: (e: Entry) => Promise<void> | void;
  onDelete?: (id: number) => Promise<void> | void;
}) {
  const [editing, setEditing] = useState(false);
  const [tags] = useTags();
  const tone = dominantColor(entry.parts);
  const nonTags = entry.parts.filter((p) => p.type !== "tag");
  const tagIds = entry.tagIds ?? [];
  const entryTags = tags.filter((t) => tagIds.includes(t.id));
  const time = new Date(entry.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (editing && canEdit && onUpdate) {
    return (
      <EntryEditor
        entry={entry}
        onSave={async (next) => {
          await onUpdate(next);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
        onDelete={
          onDelete
            ? async () => {
                await onDelete(entry.id);
                setEditing(false);
              }
            : undefined
        }
      />
    );
  }

  return (
    <article
      className="group relative border-2 border-ink bg-background p-5 transition-all duration-200 hover:translate-x-2 hover:shadow-sticky"
      style={{ borderLeftWidth: 8, borderLeftColor: `var(--${tone})` }}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="pixel text-[9px] opacity-60">{time}</div>
        {canEdit && (
          <button
            onClick={() => setEditing(true)}
            className="pixel text-[9px] border-2 border-ink px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-background"
          >
            EDIT
          </button>
        )}
      </div>
      <div className="space-y-3">
        {nonTags.map((p, i) => (
          <PieceView key={i} p={p} />
        ))}
      </div>
      {entryTags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {entryTags.map((t) => (
            <span
              key={t.id}
              className="pixel inline-block border-2 border-ink px-2 py-1 text-[9px]"
              style={{ background: t.color }}
            >
              #{t.name}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

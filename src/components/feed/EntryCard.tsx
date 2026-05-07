import { useEffect, useState } from "react";
import type { Entry } from "@/lib/pieces";
import { dominantColor } from "@/lib/pieces";
import { PieceView } from "./PieceView";
import { EntryEditor } from "@/components/EntryEditor";
import { MoodFace } from "@/components/MoodFace";
import { hasReacted, react, randomReactionCopy } from "@/lib/features";

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
  const [reacted, setReacted] = useState(false);
  const [floatMsg, setFloatMsg] = useState<string | null>(null);

  useEffect(() => { setReacted(hasReacted(entry.id)); }, [entry.id]);

  const onHeart = async () => {
    if (reacted) return;
    await react(entry.id);
    setReacted(true);
    setFloatMsg(randomReactionCopy());
    setTimeout(() => setFloatMsg(null), 1800);
  };
  const tone = dominantColor(entry.parts);
  const tags = entry.parts.filter((p) => p.type === "tag");
  const nonTags = entry.parts.filter((p) => p.type !== "tag");
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
        <div className="pixel text-[9px] opacity-60 flex items-center gap-2">
          <span>{time}</span>
          {entry.mood && <MoodFace mood={entry.mood} size={20} />}
        </div>
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
      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap">
          {tags.map((t, i) => (
            <PieceView key={i} p={t} />
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t-2 border-ink flex justify-end relative">
        <button
          onClick={onHeart}
          disabled={reacted}
          aria-label="send love"
          className="pixel text-[14px] border-2 border-ink px-3 py-1 transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          style={{ background: reacted ? "var(--bug)" : "var(--bg)" }}
        >
          {reacted ? "♥" : "♡"}
        </button>
        {floatMsg && (
          <span
            className="pointer-events-none absolute right-0 top-0 pixel text-[10px] whitespace-nowrap"
            style={{ animation: "heart-float 1.8s ease-out forwards", color: "var(--bug)" }}
          >
            {floatMsg}
          </span>
        )}
      </div>
    </article>
  );
}

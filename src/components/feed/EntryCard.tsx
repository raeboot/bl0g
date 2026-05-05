import type { Entry } from "@/lib/pieces";
import { dominantColor } from "@/lib/pieces";
import { PieceView } from "./PieceView";

export function EntryCard({ entry }: { entry: Entry }) {
  const tone = dominantColor(entry.parts);
  const tags = entry.parts.filter((p) => p.type === "tag");
  const nonTags = entry.parts.filter((p) => p.type !== "tag");
  const time = new Date(entry.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <article
      className="border-2 border-ink bg-background p-5 transition-all duration-200 hover:translate-x-2 hover:shadow-sticky"
      style={{ borderLeftWidth: 8, borderLeftColor: `var(--${tone})` }}
    >
      <div className="pixel text-[9px] opacity-60 mb-3">{time}</div>
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
    </article>
  );
}

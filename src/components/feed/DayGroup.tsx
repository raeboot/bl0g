import { Link } from "@tanstack/react-router";
import type { Entry } from "@/lib/pieces";
import { dayLabel } from "@/lib/pieces";
import { EntryCard } from "./EntryCard";

export function DayGroup({
  dayKey,
  todayKey,
  entries,
  linkable = true,
}: {
  dayKey: string;
  todayKey: string;
  entries: Entry[];
  linkable?: boolean;
}) {
  const label = dayLabel(dayKey, todayKey);
  const heading = (
    <h2 className="pixel text-[14px]">{label}</h2>
  );
  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between gap-3 mb-4">
        {linkable ? (
          <Link to="/day/$date" params={{ date: dayKey }} className="hover:underline">
            {heading}
          </Link>
        ) : (
          heading
        )}
        <span className="pixel text-[10px] opacity-60">
          {entries.length} MOMENT{entries.length === 1 ? "" : "S"}
        </span>
      </div>
      <div className="border-t-2 border-ink mb-5" />
      <div className="space-y-5">
        {entries.map((e) => (
          <EntryCard key={e.id} entry={e} />
        ))}
      </div>
    </section>
  );
}

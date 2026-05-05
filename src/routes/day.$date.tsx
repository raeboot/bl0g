import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { DayGroup } from "@/components/feed/DayGroup";
import { apiGetEntries } from "@/lib/api";
import { dayKey, type Entry } from "@/lib/pieces";

export const Route = createFileRoute("/day/$date")({
  component: DayPage,
});

function DayPage() {
  const { date } = Route.useParams();
  const [entries, setEntries] = useState<Entry[] | null>(null);

  useEffect(() => {
    apiGetEntries().then((list) => {
      setEntries(list.filter((e) => dayKey(e.ts) === date).sort((a, b) => b.ts - a.ts));
    });
  }, [date]);

  return (
    <div>
      <SiteHeader active="feed" />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <Link to="/" className="pixel text-[10px] opacity-70 hover:opacity-100">← back to feed</Link>
        <div className="h-6" />
        {entries === null && <div className="pixel text-[10px] opacity-60">loading…</div>}
        {entries && entries.length === 0 && (
          <div className="pixel text-[10px] opacity-60">no moments on this day</div>
        )}
        {entries && entries.length > 0 && (
          <DayGroup dayKey={date} todayKey={dayKey(Date.now())} entries={entries} linkable={false} />
        )}
      </main>
    </div>
  );
}

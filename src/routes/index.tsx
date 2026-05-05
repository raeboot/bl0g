import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { DayGroup } from "@/components/feed/DayGroup";
import { apiGetEntries, seedLocalIfEmpty, getMode } from "@/lib/api";
import { dayKey, seedEntries, type Entry } from "@/lib/pieces";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "bl0g — small moments, logged as they happen" },
      { name: "description", content: "A retro sticky-note dev diary. Public feed of daily creative moments." },
      { property: "og:title", content: "bl0g — small moments, logged as they happen" },
      { property: "og:description", content: "A retro sticky-note dev diary." },
    ],
  }),
  component: Feed,
});

function Feed() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const m = await getMode();
      if (m === "local") seedLocalIfEmpty(seedEntries());
      let list = await apiGetEntries();
      if (m === "api" && list.length === 0) list = seedEntries();
      list.sort((a, b) => b.ts - a.ts);
      setEntries(list);
      setLoaded(true);
    })();
  }, []);

  const groups = new Map<string, Entry[]>();
  for (const e of entries) {
    const k = dayKey(e.ts);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(e);
  }
  const keys = Array.from(groups.keys()).sort((a, b) => (a < b ? 1 : -1));
  const today = dayKey(Date.now());

  return (
    <div>
      <SiteHeader active="feed" />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="pixel text-[18px] mb-2">bl0g.dev</h1>
        <p className="text-[13px] opacity-70 mb-10">small moments, logged as they happen</p>
        {!loaded && <div className="pixel text-[10px] opacity-60">loading…</div>}
        {loaded && entries.length === 0 && (
          <div className="pixel text-[11px] opacity-60">no moments yet — head to /app to log your first one →</div>
        )}
        {keys.map((k) => (
          <DayGroup key={k} dayKey={k} todayKey={today} entries={groups.get(k)!} />
        ))}
      </main>
    </div>
  );
}

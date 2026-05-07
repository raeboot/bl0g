import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { DayGroup } from "@/components/feed/DayGroup";
import { apiGetEntries, seedLocalIfEmpty, getMode, apiUpdateEntry, apiDeleteEntry } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { dayKey, seedEntries, type Entry } from "@/lib/pieces";
import { SayHiButton } from "@/components/SayHiButton";
import { GuestbookFAB } from "@/components/GuestbookPad";

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
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    setCanEdit(!!getToken());
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

  const onUpdate = async (e: Entry) => {
    const tok = getToken() || "";
    const updated = await apiUpdateEntry(e, tok);
    setEntries((cur) => cur.map((x) => (x.id === updated.id ? updated : x)));
  };
  const onDelete = async (id: number) => {
    const tok = getToken() || "";
    await apiDeleteEntry(id, tok);
    setEntries((cur) => cur.filter((x) => x.id !== id));
  };

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
        <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
          <div>
            <h1 className="pixel text-[18px]">bl0g.dev</h1>
            <p className="text-[13px] opacity-70">small moments, logged as they happen</p>
          </div>
          <SayHiButton />
        </div>
        <div className="mb-10" />
        {!loaded && <div className="pixel text-[10px] opacity-60">loading…</div>}
        {loaded && entries.length === 0 && (
          <div className="pixel text-[11px] opacity-60">no moments yet — head to /app to log your first one →</div>
        )}
        {keys.map((k) => (
          <DayGroup
            key={k}
            dayKey={k}
            todayKey={today}
            entries={groups.get(k)!}
            canEdit={canEdit}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </main>
      <GuestbookFAB />
    </div>
  );
}

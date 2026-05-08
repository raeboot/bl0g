import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { DayGroup } from "@/components/feed/DayGroup";
import { apiGetEntries, seedLocalIfEmpty, getMode, apiUpdateEntry, apiDeleteEntry } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { dayKey, seedEntries, type Entry } from "@/lib/pieces";
import { useTags } from "@/hooks/useTags";

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
  const [query, setQuery] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [tags] = useTags();

  useEffect(() => {
    setCanEdit(!!getToken());
    (async () => {
      const m = await getMode();
      let list = await apiGetEntries();
      if (list.length === 0) list = seedEntries();
      void m;
      void seedLocalIfEmpty;
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

  const filtered = useMemo(() => {
    let list = entries;
    if (selectedTagIds.length > 0) {
      list = list.filter((e) => (e.tagIds ?? []).some((id) => selectedTagIds.includes(id)));
    }
    const q = query.trim().toLowerCase();
    if (q.length > 0) {
      list = list.filter((e) =>
        e.parts.some((p) => {
          if (p.type === "text") return p.body.toLowerCase().includes(q);
          if (p.type === "link") return (p.title || "").toLowerCase().includes(q);
          if (p.type === "video") return (p.title || "").toLowerCase().includes(q);
          if (p.type === "audio") return (p.name || "").toLowerCase().includes(q);
          return false;
        }),
      );
    }
    return list.slice().sort((a, b) => b.ts - a.ts);
  }, [entries, selectedTagIds, query]);

  const toggleTag = (id: string) =>
    setSelectedTagIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const groups = new Map<string, Entry[]>();
  for (const e of filtered) {
    const k = dayKey(e.ts);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(e);
  }
  const keys = Array.from(groups.keys()).sort((a, b) => (a < b ? 1 : -1));
  const today = dayKey(Date.now());
  const showTagBar = searchFocused || query.length > 0 || selectedTagIds.length > 0;
  const noMatches = query.trim().length >= 2 && filtered.length === 0;

  return (
    <div>
      <SiteHeader active="feed" />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="pixel text-[18px] mb-2">bl0g.dev</h1>
        <p className="text-[13px] opacity-70 mb-6">small moments, logged as they happen</p>

        <div className="mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="search your log…"
            className="pixel text-[11px] w-full border-2 border-ink bg-background px-3 py-2 placeholder:opacity-50 focus:outline-none"
          />
          <div
            className="overflow-hidden transition-all duration-200"
            style={{
              maxHeight: showTagBar ? 200 : 0,
              opacity: showTagBar ? 1 : 0,
              marginTop: showTagBar ? 8 : 0,
            }}
          >
            <div className="flex flex-wrap items-center gap-1.5">
              {tags.map((t) => {
                const sel = selectedTagIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => toggleTag(t.id)}
                    className="pixel text-[9px] border-2 border-ink px-1.5 py-0.5"
                    style={{
                      background: t.color,
                      outline: sel ? "2px solid var(--ink)" : "none",
                      outlineOffset: 2,
                      opacity: sel ? 1 : 0.55,
                    }}
                  >
                    #{t.name}
                  </button>
                );
              })}
              {selectedTagIds.length > 0 && (
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setSelectedTagIds([])}
                  className="ink-btn"
                >
                  [ clear ]
                </button>
              )}
            </div>
          </div>
        </div>

        {!loaded && <div className="pixel text-[10px] opacity-60">loading…</div>}
        {loaded && entries.length === 0 && (
          <div className="pixel text-[10px] opacity-60">no moments yet — head to /app to log your first one →</div>
        )}
        {loaded && entries.length > 0 && noMatches && (
          <div className="pixel text-[10px] opacity-60">nothing here yet :(</div>
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
    </div>
  );
}
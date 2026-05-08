import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { EntryCard } from "@/components/feed/EntryCard";
import { apiGetEntries } from "@/lib/api";
import { dayKey, type Entry } from "@/lib/pieces";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "calendar — bl0g" },
      { name: "description", content: "Browse logged days on a calendar." },
    ],
  }),
  component: CalendarPage,
});

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const DOW = ["S","M","T","W","T","F","S"];

function ymKey(y: number, m: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}
function dKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function CalendarPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const today = new Date();
  const [cursor, setCursor] = useState<{ y: number; m: number }>({
    y: today.getFullYear(),
    m: today.getMonth(),
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    apiGetEntries().then((list) => {
      list.sort((a, b) => b.ts - a.ts);
      setEntries(list);
      setLoaded(true);
    });
  }, []);

  const loggedDays = useMemo(() => {
    const s = new Set<string>();
    for (const e of entries) s.add(dayKey(e.ts));
    return s;
  }, [entries]);

  const earliest = useMemo(() => {
    if (entries.length === 0) return null;
    const min = entries.reduce((a, b) => (a.ts < b.ts ? a : b));
    const d = new Date(min.ts);
    return { y: d.getFullYear(), m: d.getMonth() };
  }, [entries]);

  const latest = { y: today.getFullYear(), m: today.getMonth() };

  const atEarliest = !earliest || (cursor.y === earliest.y && cursor.m === earliest.m);
  const atLatest = cursor.y === latest.y && cursor.m === latest.m;

  const prev = () => {
    if (atEarliest) return;
    const m = cursor.m - 1;
    if (m < 0) setCursor({ y: cursor.y - 1, m: 11 });
    else setCursor({ y: cursor.y, m });
  };
  const next = () => {
    if (atLatest) return;
    const m = cursor.m + 1;
    if (m > 11) setCursor({ y: cursor.y + 1, m: 0 });
    else setCursor({ y: cursor.y, m });
  };

  const firstDow = new Date(cursor.y, cursor.m, 1).getDay();
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const todayKey = dayKey(today.getTime());

  const cells: Array<{ d: number | null; key: string | null }> = [];
  for (let i = 0; i < firstDow; i++) cells.push({ d: null, key: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const k = dKey(cursor.y, cursor.m, d);
    cells.push({ d, key: k });
  }
  while (cells.length % 7 !== 0) cells.push({ d: null, key: null });

  const dayEntries = useMemo(
    () => (selectedDay ? entries.filter((e) => dayKey(e.ts) === selectedDay) : []),
    [selectedDay, entries],
  );

  return (
    <div>
      <SiteHeader active="calendar" />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="pixel text-[18px] mb-2">calendar</h1>
        <p className="text-[13px] opacity-70 mb-8">days you logged something</p>

        {!loaded && <div className="pixel text-[10px] opacity-60">loading…</div>}

        {loaded && (
          <div className="border-2 border-ink p-4 bg-background">
            <div className="flex items-center justify-between mb-4">
              <button
                className="ink-btn"
                onClick={prev}
                disabled={atEarliest}
                style={{ opacity: atEarliest ? 0.3 : 1, cursor: atEarliest ? "not-allowed" : "pointer" }}
              >
                [ ← ]
              </button>
              <div className="pixel text-[14px]">
                {MONTHS[cursor.m]} {cursor.y}
              </div>
              <button
                className="ink-btn"
                onClick={next}
                disabled={atLatest}
                style={{ opacity: atLatest ? 0.3 : 1, cursor: atLatest ? "not-allowed" : "pointer" }}
              >
                [ → ]
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {DOW.map((d, i) => (
                <div key={i} className="pixel text-[9px] opacity-60 text-center py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((c, i) => {
                if (!c.d || !c.key) return <div key={i} className="aspect-square" />;
                const has = loggedDays.has(c.key);
                const isToday = c.key === todayKey;
                const isSelected = c.key === selectedDay;
                return (
                  <button
                    key={i}
                    disabled={!has}
                    onClick={() => has && setSelectedDay(c.key)}
                    className={`aspect-square border-2 border-ink flex flex-col items-center justify-center pixel text-[11px] relative ${
                      isToday ? "border-2 border-ink ring-2 ring-ink ring-offset-0" : ""
                    }`}
                    style={{
                      background: isSelected ? "var(--win)" : "var(--background)",
                      opacity: has ? 1 : 0.35,
                      cursor: has ? "pointer" : "default",
                      borderWidth: isToday ? 3 : 2,
                    }}
                  >
                    <span>{c.d}</span>
                    {has && !isSelected && (
                      <span
                        className="absolute bottom-1 w-1.5 h-1.5 rounded-full"
                        style={{ background: "var(--win)" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selectedDay && dayEntries.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="pixel text-[12px]">{selectedDay}</h2>
              <Link
                to="/day/$date"
                params={{ date: selectedDay }}
                className="pixel text-[10px] underline opacity-70 hover:opacity-100"
              >
                open day →
              </Link>
            </div>
            <div className="space-y-5">
              {dayEntries.map((e) => (
                <Link
                  key={e.id}
                  to="/day/$date"
                  params={{ date: selectedDay }}
                  className="block"
                >
                  <EntryCard entry={e} canEdit={false} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
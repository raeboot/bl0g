import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Canvas } from "@/components/canvas/Canvas";
import { TimelinePanel } from "@/components/canvas/TimelinePanel";
import { apiAddEntry, apiGetEntries, apiStatus, seedLocalIfEmpty, getMode, apiUpdateEntry, apiDeleteEntry } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import { seedEntries, type CanvasPiece, type Entry, type MoodId, type Part } from "@/lib/pieces";
import { Postcards } from "@/components/Postcards";
import { SayHiSettings } from "@/components/SayHiSettings";

export const Route = createFileRoute("/app/")({
  component: AppPage,
});

function AppPage() {
  const navigate = useNavigate();
  const [authReady, setAuthReady] = useState(false);
  const [pieces, setPieces] = useState<CanvasPiece[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [mood, setMood] = useState<MoodId | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const s = await apiStatus();
      if (!s.initialized) return navigate({ to: "/app/setup" });
      if (!getToken()) return navigate({ to: "/app/login" });
      const m = await getMode();
      if (m === "local") seedLocalIfEmpty(seedEntries());
      const list = await apiGetEntries();
      list.sort((a, b) => b.ts - a.ts);
      setEntries(list);
      setAuthReady(true);
    })();
  }, [navigate]);

  useEffect(() => {
    const handler = (e: Event) => {
      const pid = (e as CustomEvent).detail.pid as string;
      setRemovingIds((s) => new Set(s).add(pid));
      setTimeout(() => {
        setPieces((arr) => arr.filter((p) => p.pid !== pid));
        setRemovingIds((s) => {
          const n = new Set(s);
          n.delete(pid);
          return n;
        });
      }, 240);
    };
    window.addEventListener("bl0g:remove-piece", handler);
    return () => window.removeEventListener("bl0g:remove-piece", handler);
  }, []);

  const onCommit = async () => {
    if (pieces.length === 0) return;
    const parts: Part[] = pieces.map(({ pid, x, y, w, ...rest }) => rest as Part);
    const entry: Entry = { id: Date.now(), ts: Date.now(), parts, mood };
    const tok = getToken() || "";
    try {
      await apiAddEntry(entry, tok);
    } catch (e) {
      console.error(e);
      return;
    }
    // staggered fade-up animation: clear after delay
    setPieces([]);
    setMood(undefined);
    setEntries((cur) => [entry, ...cur]);
  };

  const onLogout = () => {
    clearToken();
    navigate({ to: "/app/login" });
  };

  const onUpdateEntry = async (e: Entry) => {
    const tok = getToken() || "";
    const updated = await apiUpdateEntry(e, tok);
    setEntries((cur) => cur.map((x) => (x.id === updated.id ? updated : x)));
  };
  const onDeleteEntry = async (id: number) => {
    const tok = getToken() || "";
    await apiDeleteEntry(id, tok);
    setEntries((cur) => cur.filter((x) => x.id !== id));
  };

  if (!authReady) {
    return (
      <div>
        <SiteHeader active="log" />
        <main className="mx-auto max-w-6xl px-5 py-16">
          <div className="pixel text-[10px] opacity-60">checking auth…</div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <SiteHeader active="log" />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="pixel text-[14px]">CREATIVE OS</h1>
          <button className="ink-btn" onClick={onLogout}>[ LOGOUT ]</button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <Canvas
            pieces={pieces}
            setPieces={setPieces}
            onCommit={onCommit}
            onClear={() => setPieces([])}
            removingIds={removingIds}
            mood={mood}
            setMood={setMood}
          />
          <TimelinePanel entries={entries} onExport={() => {}} onUpdate={onUpdateEntry} onDelete={onDeleteEntry} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
          <Postcards />
          <SayHiSettings />
        </div>
      </main>
    </div>
  );
}

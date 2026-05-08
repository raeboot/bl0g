import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { Canvas } from "@/components/canvas/Canvas";
import { TimelinePanel } from "@/components/canvas/TimelinePanel";
import {
  apiAddEntry,
  apiGetEntries,
  apiStatus,
  apiUpdateEntry,
  apiDeleteEntry,
} from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import type { CanvasPiece, Entry, Part } from "@/lib/pieces";

export const Route = createFileRoute("/app/")({
  component: AppPage,
});

function AppPage() {
  const navigate = useNavigate();
  const [authReady, setAuthReady] = useState(false);
  const [pieces, setPieces] = useState<CanvasPiece[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [committing, setCommitting] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await apiStatus();
      if (!s.initialized) return navigate({ to: "/app/setup" });
      const { data } = await supabase.auth.getSession();
      if (!data.session) return navigate({ to: "/app/login" });
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

  const toggleTag = (id: string) =>
    setSelectedTagIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const onCommit = async () => {
    if (committing) return;
    if (pieces.length === 0 && selectedTagIds.length === 0) return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      toast.error("session expired — please log in again");
      navigate({ to: "/app/login" });
      return;
    }
    const parts: Part[] = pieces.map(({ pid, x, y, w, ...rest }) => rest as Part);
    const entry: Entry = { id: Date.now(), ts: Date.now(), parts, tagIds: selectedTagIds };
    setCommitting(true);
    try {
      const saved = await apiAddEntry(entry);
      setPieces([]);
      setSelectedTagIds([]);
      setEntries((cur) => [saved, ...cur]);
      toast.success("logged");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "failed to log entry");
    } finally {
      setCommitting(false);
    }
  };

  const onLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/app/login" });
  };

  const onUpdateEntry = async (e: Entry) => {
    try {
      const updated = await apiUpdateEntry(e);
      setEntries((cur) => cur.map((x) => (x.id === updated.id ? updated : x)));
    } catch (err: any) {
      toast.error(err?.message || "update failed");
    }
  };
  const onDeleteEntry = async (id: number) => {
    try {
      await apiDeleteEntry(id);
      setEntries((cur) => cur.filter((x) => x.id !== id));
    } catch (err: any) {
      toast.error(err?.message || "delete failed");
    }
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
            committing={committing}
            onClear={() => {
              setPieces([]);
              setSelectedTagIds([]);
            }}
            removingIds={removingIds}
            selectedTagIds={selectedTagIds}
            onToggleTag={toggleTag}
          />
          <TimelinePanel entries={entries} onExport={() => {}} onUpdate={onUpdateEntry} onDelete={onDeleteEntry} />
        </div>
      </main>
    </div>
  );
}

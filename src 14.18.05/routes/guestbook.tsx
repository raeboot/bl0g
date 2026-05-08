import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { getGuestbook, type GuestbookEntry } from "@/lib/features";
import { GuestbookFAB } from "@/components/GuestbookPad";

export const Route = createFileRoute("/guestbook")({
  head: () => ({
    meta: [
      { title: "guestbook — bl0g" },
      { name: "description", content: "A quiet wall of visits — drawings and notes from people who stopped by." },
      { property: "og:title", content: "guestbook — bl0g" },
      { property: "og:description", content: "A quiet wall of visits." },
    ],
  }),
  component: GuestbookPage,
});

function GuestbookPage() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { getGuestbook().then((e) => { setEntries(e); setLoaded(true); }); }, []);

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="pixel text-[18px] mb-2">guestbook</h1>
        <p className="text-[13px] opacity-70 mb-10">a quiet wall of visits — no likes, no ranking</p>
        {!loaded && <div className="pixel text-[10px] opacity-60">loading…</div>}
        {loaded && entries.length === 0 && (
          <div className="pixel text-[11px] opacity-60">no notes yet — be the first ↙</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {entries.map((e, i) => (
            <article
              key={e.id}
              className="border-2 border-ink bg-background p-3 shadow-sticky"
              style={{
                transform: `rotate(${i % 2 === 0 ? "-1deg" : "1deg"})`,
                background: e.kind === "draw" ? "var(--bg)" : pastel(i),
              }}
            >
              {e.kind === "draw" && e.src ? (
                <img src={e.src} alt="" className="block w-full border-2 border-ink" />
              ) : (
                <div className="text-[14px] whitespace-pre-wrap">{e.body}</div>
              )}
              <div className="pixel text-[9px] opacity-60 mt-2 flex justify-between">
                <span>{e.name || "anon"}</span>
                <span>{new Date(e.ts).toLocaleDateString()}</span>
              </div>
            </article>
          ))}
        </div>
      </main>
      <GuestbookFAB />
    </div>
  );
}

function pastel(i: number) {
  const arr = ["var(--idea)", "var(--win)", "var(--exp)", "var(--thought)", "var(--bug)"];
  return arr[i % arr.length];
}
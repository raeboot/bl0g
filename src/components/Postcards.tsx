import { useEffect, useState } from "react";
import {
  addPostcard,
  deletePostcard,
  getPostcards,
  markPostcardRead,
  randomSignoff,
  type Postcard,
} from "@/lib/features";

const REMIND_OPTIONS: { id: string; label: string; ms: () => number }[] = [
  { id: "1d", label: "Tomorrow", ms: () => 86400_000 },
  { id: "3d", label: "In 3 days", ms: () => 3 * 86400_000 },
  { id: "1w", label: "In a week", ms: () => 7 * 86400_000 },
  { id: "1m", label: "In a month", ms: () => 30 * 86400_000 },
  { id: "?", label: "Surprise me 🎲", ms: () => (1 + Math.floor(Math.random() * 30)) * 86400_000 },
];

export function Postcards() {
  const [list, setList] = useState<Postcard[]>([]);
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [remind, setRemind] = useState("3d");
  const [busy, setBusy] = useState(false);

  const refresh = async () => setList(await getPostcards());
  useEffect(() => { refresh(); }, []);

  const now = Date.now();
  const due = list.filter((p) => p.remindAt <= now && !p.read);
  const future = list.filter((p) => p.remindAt > now);

  const submit = async () => {
    if (!body.trim()) return;
    setBusy(true);
    const opt = REMIND_OPTIONS.find((o) => o.id === remind)!;
    const p: Postcard = {
      id: Date.now(),
      body: body.trim(),
      createdAt: Date.now(),
      remindAt: Date.now() + opt.ms(),
      signoff: randomSignoff(),
    };
    await addPostcard(p);
    setBody("");
    setOpen(false);
    setBusy(false);
    await refresh();
  };

  return (
    <div className="border-2 border-ink p-4" style={{ background: "var(--log-bg)" }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="pixel text-[12px]">✉️ POSTCARDS</h3>
        <button className="ink-btn" onClick={() => setOpen(true)}>[ + WRITE ]</button>
      </div>

      {due.length > 0 && (
        <div className="space-y-2 mb-4">
          <div className="pixel text-[9px] opacity-70">DELIVERED</div>
          {due.map((p) => (
            <article
              key={p.id}
              className="border-2 border-ink bg-background p-3 shadow-sticky"
              style={{ background: "var(--idea)" }}
            >
              <div className="text-[13px] whitespace-pre-wrap">{p.body}</div>
              <div className="pixel text-[9px] mt-2 opacity-70 italic">— {p.signoff}</div>
              <div className="pixel text-[8px] mt-2 opacity-60">
                from {new Date(p.createdAt).toLocaleDateString()}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  className="ink-btn !text-[9px] !py-1"
                  onClick={async () => { await markPostcardRead(p.id); refresh(); }}
                >
                  [ KEEP ]
                </button>
                <button
                  className="ink-btn !text-[9px] !py-1"
                  onClick={async () => { await deletePostcard(p.id); refresh(); }}
                >
                  [ TOSS ]
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <div className="pixel text-[9px] opacity-70">SEALED ({future.length})</div>
        {future.length === 0 && due.length === 0 && (
          <div className="pixel text-[10px] opacity-60">no postcards yet — drop a note to future you</div>
        )}
        {future.map((p) => (
          <div key={p.id} className="border-2 border-ink bg-background p-2 flex items-center justify-between">
            <div className="pixel text-[9px] opacity-70 truncate flex-1">
              opens {new Date(p.remindAt).toLocaleDateString()}
            </div>
            <button
              className="ink-btn !text-[8px] !py-1 !px-2"
              onClick={async () => { await deletePostcard(p.id); refresh(); }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div
            className="border-2 border-ink shadow-sticky-xl p-5 w-full max-w-md"
            style={{ background: "var(--idea)", transform: "rotate(-1deg)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pixel text-[12px] mb-3">✉️ POSTCARD TO FUTURE ME</div>
            <textarea
              autoFocus
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Dear future me,"
              rows={6}
              className="w-full border-2 border-ink bg-background p-3 text-[13px] mb-3 italic"
            />
            <div className="pixel text-[9px] opacity-70 mb-2">REMIND ME</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {REMIND_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setRemind(o.id)}
                  className="pixel text-[9px] border-2 border-ink px-2 py-1"
                  style={{ background: remind === o.id ? "var(--ink)" : "var(--bg)", color: remind === o.id ? "var(--bg)" : "var(--ink)" }}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button className="ink-btn" onClick={() => setOpen(false)} disabled={busy}>[ CANCEL ]</button>
              <button className="ink-btn win" onClick={submit} disabled={busy || !body.trim()}>
                {busy ? "…" : "[ SEAL → ]"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useEffect, useState } from "react";
import { getSayHi, setSayHi, type SayHiLink } from "@/lib/features";

export function SayHiSettings() {
  const [links, setLinks] = useState<SayHiLink[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => { getSayHi().then(setLinks); }, []);

  const update = (i: number, patch: Partial<SayHiLink>) =>
    setLinks((arr) => arr.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const remove = (i: number) => setLinks((arr) => arr.filter((_, idx) => idx !== i));
  const add = () => setLinks((arr) => [...arr, { id: String(Date.now()), label: "", url: "" }]);

  const save = async () => {
    const clean = links.filter((l) => l.label.trim() && l.url.trim());
    await setSayHi(clean);
    setLinks(clean);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="border-2 border-ink p-4" style={{ background: "var(--log-bg)" }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="pixel text-[12px]">👋 SAY HI LINKS</h3>
        <button className="ink-btn" onClick={add}>[ + ROW ]</button>
      </div>
      <p className="text-[12px] opacity-70 mb-3">Visitors see these on the feed. Email, socials, support, anything.</p>
      <div className="space-y-2">
        {links.length === 0 && <div className="pixel text-[10px] opacity-60">no links — add one</div>}
        {links.map((l, i) => (
          <div key={l.id} className="flex gap-2">
            <input
              value={l.label}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="label"
              className="w-32 border-2 border-ink bg-background px-2 py-1 text-[12px]"
            />
            <input
              value={l.url}
              onChange={(e) => update(i, { url: e.target.value })}
              placeholder="url or mailto:"
              className="flex-1 border-2 border-ink bg-background px-2 py-1 text-[12px]"
            />
            <button className="ink-btn !py-1 !px-2" onClick={() => remove(i)}>×</button>
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-3 gap-2 items-center">
        {saved && <span className="pixel text-[9px] opacity-70">saved ✓</span>}
        <button className="ink-btn win" onClick={save}>[ SAVE → ]</button>
      </div>
    </div>
  );
}
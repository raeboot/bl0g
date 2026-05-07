import { useEffect, useState } from "react";
import { getSayHi, type SayHiLink } from "@/lib/features";

export function SayHiButton() {
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState<SayHiLink[]>([]);

  useEffect(() => { getSayHi().then(setLinks); }, []);

  if (links.length === 0) return null;

  return (
    <>
      <button
        className="ink-btn"
        onClick={() => setOpen(true)}
        aria-label="say hi"
      >
        say hi 👋
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="border-2 border-ink shadow-sticky-xl bg-background p-5 w-full max-w-sm"
            style={{ transform: "rotate(0.8deg)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pixel text-[12px] mb-4">SAY HI</div>
            <ul className="space-y-2">
              {links.map((l) => (
                <li key={l.id}>
                  <a
                    href={l.url}
                    target={l.url.startsWith("mailto:") ? undefined : "_blank"}
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 border-2 border-ink px-3 py-2 hover:-translate-y-0.5 transition-transform"
                  >
                    <span className="pixel text-[10px]">{l.label}</span>
                    <span className="text-[11px] opacity-60 truncate">→</span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="flex justify-end mt-4">
              <button className="ink-btn" onClick={() => setOpen(false)}>[ CLOSE ]</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
import { useRef, useState } from "react";
import { TAG_PRESETS, parseYouTube, getHost, type CanvasPiece } from "@/lib/pieces";

type Mode = "TEXT" | "TAG" | "LINK" | "IMAGE";

export function AdderBar({ onAdd }: { onAdd: (p: Omit<CanvasPiece, "pid" | "x" | "y">) => void }) {
  const [mode, setMode] = useState<Mode>("TEXT");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const submitText = () => {
    if (!text.trim()) return;
    onAdd({ type: "text", body: text.trim() });
    setText("");
  };
  const submitLink = () => {
    if (!url.trim()) return;
    const yt = parseYouTube(url);
    const host = getHost(url);
    if (yt) onAdd({ type: "video", url, title: host, host, ytId: yt });
    else onAdd({ type: "link", url, title: host, host });
    setUrl("");
  };
  const onFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      onAdd({ type: "image", src: String(reader.result), caption: f.name });
    };
    reader.readAsDataURL(f);
  };

  return (
    <div className="border-2 border-ink bg-background p-4 shadow-sticky">
      <div className="flex flex-wrap gap-2 mb-3">
        {(["TEXT", "TAG", "LINK", "IMAGE"] as Mode[]).map((m) => (
          <button key={m} className={`ink-btn ${mode === m ? "active" : ""}`} onClick={() => setMode(m)}>
            {m}
          </button>
        ))}
      </div>
      {mode === "TEXT" && (
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitText()}
            placeholder="what just happened?"
            className="flex-1 border-2 border-ink bg-background px-3 py-2 text-[13px]"
          />
          <button className="ink-btn" onClick={submitText}>ADD</button>
        </div>
      )}
      {mode === "TAG" && (
        <div className="flex flex-wrap gap-2">
          {TAG_PRESETS.map((t) => (
            <button
              key={t.label}
              className="pixel text-[10px] border-2 border-ink px-2 py-1 hover:-translate-y-0.5 transition-transform"
              style={{ background: `var(--${t.color})` }}
              onClick={() => onAdd({ type: "tag", label: t.label, color: t.color })}
            >
              #{t.label}
            </button>
          ))}
        </div>
      )}
      {mode === "LINK" && (
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitLink()}
            placeholder="https://… (youtube auto-detects)"
            className="flex-1 border-2 border-ink bg-background px-3 py-2 text-[13px]"
          />
          <button className="ink-btn" onClick={submitLink}>ADD</button>
        </div>
      )}
      {mode === "IMAGE" && (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              if (fileRef.current) fileRef.current.value = "";
            }}
          />
          <button className="ink-btn" onClick={() => fileRef.current?.click()}>CHOOSE FILE</button>
          <span className="ml-3 pixel text-[9px] opacity-60">or drop into canvas</span>
        </div>
      )}
    </div>
  );
}

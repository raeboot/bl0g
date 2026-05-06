import { useRef, useState } from "react";
import { TAG_PRESETS, parseYouTube, getHost, type NewPiece } from "@/lib/pieces";
import { RichTextEditor } from "@/components/RichTextEditor";
import { AudioRecorder } from "@/components/AudioRecorder";
import { fetchLinkMeta } from "@/lib/preview";

export function AdderBar({ onAdd }: { onAdd: (p: NewPiece) => void }) {
  const [html, setHtml] = useState("");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const submitText = () => {
    if (!text.trim()) return;
    onAdd({ type: "text", body: text.trim(), html });
    setHtml("");
    setText("");
  };

  const submitLink = async () => {
    const u = url.trim();
    if (!u) return;
    const yt = parseYouTube(u);
    const host = getHost(u);
    setBusy(true);
    try {
      const meta = await fetchLinkMeta(u);
      if (yt) {
        onAdd({
          type: "video",
          url: u,
          title: meta.title || host,
          host,
          ytId: yt,
          description: meta.description,
          image: meta.image,
        });
      } else {
        onAdd({
          type: "link",
          url: u,
          title: meta.title || host,
          host,
          description: meta.description,
          image: meta.image,
        });
      }
    } finally {
      setBusy(false);
      setUrl("");
    }
  };

  const onFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => onAdd({ type: "image", src: String(reader.result), caption: f.name });
    reader.readAsDataURL(f);
  };

  return (
    <div className="border-2 border-ink bg-background p-4 shadow-sticky space-y-3">
      <div className="pixel text-[10px] opacity-60">WHAT DO YOU WANT TO LOG?</div>

      <RichTextEditor
        html={html}
        onChange={(h, t) => {
          setHtml(h);
          setText(t);
        }}
        placeholder="write it out — bold, highlight, sizes, links…"
        minHeight={100}
      />
      <div className="flex justify-end">
        <button className="ink-btn win" onClick={submitText} disabled={!text.trim()}>
          + ADD TEXT
        </button>
      </div>

      <div className="border-t-2 border-ink pt-3 space-y-2">
        <div className="pixel text-[9px] opacity-60">LINK / VIDEO</div>
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitLink()}
            placeholder="https://… (auto-fetches preview)"
            className="flex-1 border-2 border-ink bg-background px-3 py-2 text-[13px]"
          />
          <button className="ink-btn" onClick={submitLink} disabled={busy || !url.trim()}>
            {busy ? "…" : "+ ADD"}
          </button>
        </div>
      </div>

      <div className="border-t-2 border-ink pt-3 space-y-2">
        <div className="pixel text-[9px] opacity-60">MEDIA</div>
        <div className="flex flex-wrap gap-2 items-center">
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
          <button className="ink-btn" onClick={() => fileRef.current?.click()}>+ IMAGE</button>
          <AudioRecorder
            onCapture={(src, name, duration) => onAdd({ type: "audio", src, name, duration })}
          />
        </div>
      </div>

      <div className="border-t-2 border-ink pt-3">
        <div className="pixel text-[9px] opacity-60 mb-2">TAGS</div>
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
      </div>
    </div>
  );
}

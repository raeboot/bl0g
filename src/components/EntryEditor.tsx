import { useEffect, useRef, useState } from "react";
import type { Entry, MoodId, Part, TagColor } from "@/lib/pieces";
import { TAG_PRESETS, parseYouTube, getHost } from "@/lib/pieces";
import { RichTextEditor } from "@/components/RichTextEditor";
import { AudioRecorder } from "@/components/AudioRecorder";
import { fetchLinkMeta } from "@/lib/preview";
import { MoodPicker } from "@/components/MoodFace";

const TAG_COLORS: TagColor[] = ["exp", "thought", "bug", "win", "idea"];

export function EntryEditor({
  entry,
  onSave,
  onCancel,
  onDelete,
}: {
  entry: Entry;
  onSave: (next: Entry) => Promise<void> | void;
  onCancel: () => void;
  onDelete?: () => Promise<void> | void;
}) {
  const [parts, setParts] = useState<Part[]>(entry.parts);
  const [mood, setMood] = useState<MoodId | undefined>(entry.mood);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [linkInput, setLinkInput] = useState("");

  useEffect(() => setParts(entry.parts), [entry]);

  const updatePart = (i: number, next: Part) =>
    setParts((arr) => arr.map((p, idx) => (idx === i ? next : p)));
  const removePart = (i: number) => setParts((arr) => arr.filter((_, idx) => idx !== i));
  const movePart = (i: number, dir: -1 | 1) =>
    setParts((arr) => {
      const j = i + dir;
      if (j < 0 || j >= arr.length) return arr;
      const next = arr.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const addText = () => setParts((a) => [...a, { type: "text", body: "" }]);
  const addTag = (label: string, color: TagColor) =>
    setParts((a) => [...a, { type: "tag", label, color }]);
  const addLink = async () => {
    if (!linkInput.trim()) return;
    const u = linkInput;
    const yt = parseYouTube(u);
    const host = getHost(u);
    setLinkInput("");
    const meta = await fetchLinkMeta(u);
    if (yt) {
      setParts((a) => [
        ...a,
        { type: "video", url: u, title: meta.title || host, host, ytId: yt, description: meta.description, image: meta.image },
      ]);
    } else {
      setParts((a) => [
        ...a,
        { type: "link", url: u, title: meta.title || host, host, description: meta.description, image: meta.image },
      ]);
    }
  };
  const addImage = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => setParts((a) => [...a, { type: "image", src: String(reader.result), caption: f.name }]);
    reader.readAsDataURL(f);
  };
  const addAudio = (src: string, name: string, duration: number) =>
    setParts((a) => [...a, { type: "audio", src, name, duration }]);

  const submit = async () => {
    setErr("");
    setBusy(true);
    try {
      // strip empty text parts
      const clean = parts.filter((p) => !(p.type === "text" && !p.body.trim()));
      await onSave({ ...entry, parts: clean, mood });
    } catch (e: any) {
      setErr(e.message || "save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-2 border-ink bg-background p-4 shadow-sticky space-y-4">
      <div className="pixel text-[10px] opacity-70">EDITING ENTRY</div>

      <div className="space-y-3">
        {parts.length === 0 && <div className="pixel text-[10px] opacity-50">no parts — add some below</div>}
        {parts.map((p, i) => (
          <PartRow
            key={i}
            part={p}
            onChange={(next) => updatePart(i, next)}
            onRemove={() => removePart(i)}
            onUp={() => movePart(i, -1)}
            onDown={() => movePart(i, 1)}
            isFirst={i === 0}
            isLast={i === parts.length - 1}
          />
        ))}
      </div>

      <div className="border-t-2 border-ink pt-3 space-y-3">
        <div className="pixel text-[9px] opacity-60">ADD</div>
        <div className="flex flex-wrap gap-2">
          <button className="ink-btn" onClick={addText}>+ TEXT</button>
          <button className="ink-btn" onClick={() => fileRef.current?.click()}>+ IMAGE</button>
          <AudioRecorder onCapture={addAudio} />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) addImage(f);
              if (fileRef.current) fileRef.current.value = "";
            }}
          />
        </div>
        <div className="flex gap-2">
          <input
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addLink()}
            placeholder="https://… (or youtube)"
            className="flex-1 border-2 border-ink bg-background px-3 py-2 text-[12px]"
          />
          <button className="ink-btn" onClick={addLink}>+ LINK</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {TAG_PRESETS.map((t) => (
            <button
              key={t.label}
              className="pixel text-[9px] border-2 border-ink px-2 py-1"
              style={{ background: `var(--${t.color})` }}
              onClick={() => addTag(t.label, t.color)}
            >
              +#{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t-2 border-ink pt-3 space-y-2">
        <div className="pixel text-[9px] opacity-60">MOOD</div>
        <MoodPicker value={mood} onChange={setMood} />
      </div>

      {err && <div className="pixel text-[10px]" style={{ color: "var(--bug)" }}>{err}</div>}

      <div className="flex flex-wrap gap-2 justify-between border-t-2 border-ink pt-3">
        <div className="flex gap-2">
          {onDelete && (
            <button
              className="ink-btn"
              style={{ background: "var(--bug)" }}
              onClick={async () => {
                if (!confirm("delete this entry?")) return;
                setBusy(true);
                try { await onDelete(); } finally { setBusy(false); }
              }}
            >
              [ DELETE ]
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button className="ink-btn" onClick={onCancel} disabled={busy}>[ CANCEL ]</button>
          <button className="ink-btn win" onClick={submit} disabled={busy}>
            {busy ? "..." : "[ SAVE → ]"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PartRow({
  part,
  onChange,
  onRemove,
  onUp,
  onDown,
  isFirst,
  isLast,
}: {
  part: Part;
  onChange: (p: Part) => void;
  onRemove: () => void;
  onUp: () => void;
  onDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="border-2 border-ink p-3" style={{ background: rowBg(part) }}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="pixel text-[8px] opacity-60 uppercase">{part.type}</span>
        <div className="flex gap-1">
          <button className="ink-btn !py-1 !px-2 !text-[9px]" onClick={onUp} disabled={isFirst}>↑</button>
          <button className="ink-btn !py-1 !px-2 !text-[9px]" onClick={onDown} disabled={isLast}>↓</button>
          <button className="ink-btn !py-1 !px-2 !text-[9px]" onClick={onRemove}>×</button>
        </div>
      </div>
      <PartFields part={part} onChange={onChange} />
    </div>
  );
}

function rowBg(p: Part): string {
  if (p.type === "tag") return `var(--${p.color})`;
  if (p.type === "link") return "var(--exp)";
  return "var(--bg)";
}

function PartFields({ part, onChange }: { part: Part; onChange: (p: Part) => void }) {
  if (part.type === "text") {
    return (
      <RichTextEditor
        html={part.html || part.body || ""}
        onChange={(html, text) => onChange({ ...part, body: text, html })}
        placeholder="text…"
        minHeight={80}
      />
    );
  }
  if (part.type === "tag") {
    return (
      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={part.label}
          onChange={(e) => onChange({ ...part, label: e.target.value.toUpperCase() })}
          className="flex-1 min-w-[120px] border-2 border-ink bg-background px-2 py-1 text-[12px] pixel"
        />
        <div className="flex gap-1">
          {TAG_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onChange({ ...part, color: c })}
              className="border-2 border-ink w-6 h-6"
              style={{ background: `var(--${c})`, outline: part.color === c ? "2px solid var(--ink)" : "none", outlineOffset: 2 }}
              title={c}
            />
          ))}
        </div>
      </div>
    );
  }
  if (part.type === "image") {
    return (
      <div className="space-y-2">
        <img src={part.src} alt="" className="max-h-32 border-2 border-ink" />
        <input
          value={part.caption || ""}
          onChange={(e) => onChange({ ...part, caption: e.target.value })}
          placeholder="caption"
          className="w-full border-2 border-ink bg-background px-2 py-1 text-[12px]"
        />
      </div>
    );
  }
  if (part.type === "audio") {
    return (
      <div className="space-y-2">
        <audio src={part.src} controls className="w-full" />
        <input
          value={part.name || ""}
          onChange={(e) => onChange({ ...part, name: e.target.value })}
          placeholder="name"
          className="w-full border-2 border-ink bg-background px-2 py-1 text-[12px]"
        />
      </div>
    );
  }
  if (part.type === "link") {
    return (
      <div className="space-y-2">
        {part.image && <img src={part.image} alt="" className="max-h-28 w-full object-cover border-2 border-ink" />}
        <input
          value={part.url}
          onChange={(e) => {
            const url = e.target.value;
            onChange({ ...part, url, host: getHost(url) });
          }}
          placeholder="url"
          className="w-full border-2 border-ink bg-background px-2 py-1 text-[12px]"
        />
        <input
          value={part.title}
          onChange={(e) => onChange({ ...part, title: e.target.value })}
          placeholder="title"
          className="w-full border-2 border-ink bg-background px-2 py-1 text-[13px]"
        />
        <input
          value={part.description || ""}
          onChange={(e) => onChange({ ...part, description: e.target.value })}
          placeholder="description"
          className="w-full border-2 border-ink bg-background px-2 py-1 text-[12px]"
        />
      </div>
    );
  }
  if (part.type === "video") {
    return (
      <div className="space-y-2">
        <input
          value={part.url}
          onChange={(e) => {
            const url = e.target.value;
            const yt = parseYouTube(url) || part.ytId;
            onChange({ ...part, url, host: getHost(url), ytId: yt });
          }}
          placeholder="youtube url"
          className="w-full border-2 border-ink bg-background px-2 py-1 text-[12px]"
        />
        <input
          value={part.title}
          onChange={(e) => onChange({ ...part, title: e.target.value })}
          placeholder="title"
          className="w-full border-2 border-ink bg-background px-2 py-1 text-[13px]"
        />
      </div>
    );
  }
  return null;
}

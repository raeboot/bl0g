export type TagColor = "exp" | "thought" | "bug" | "win" | "idea";

export type TextPart = { type: "text"; body: string; html?: string };
export type TagPart = { type: "tag"; label: string; color: TagColor };
export type ImagePart = { type: "image"; src: string; caption?: string };
export type LinkPart = { type: "link"; url: string; title: string; host: string; description?: string; image?: string };
export type VideoPart = { type: "video"; url: string; title: string; host: string; ytId: string; description?: string; image?: string };
export type AudioPart = { type: "audio"; src: string; name?: string; duration?: number };
export type Part = TextPart | TagPart | ImagePart | LinkPart | VideoPart | AudioPart;

export type Entry = { id: number; ts: number; parts: Part[]; tagIds?: string[] };

type WithCanvas<T> = T & { pid: string; x: number; y: number; w?: number };
export type CanvasPiece =
  | WithCanvas<TextPart>
  | WithCanvas<TagPart>
  | WithCanvas<ImagePart>
  | WithCanvas<LinkPart>
  | WithCanvas<VideoPart>
  | WithCanvas<AudioPart>;
export type NewPiece = Part;

export const TAG_PRESETS: { label: string; color: TagColor }[] = [
  { label: "SHIPPED", color: "win" },
  { label: "THINKING", color: "thought" },
  { label: "STUCK", color: "bug" },
  { label: "INSPO", color: "idea" },
  { label: "DESIGN", color: "exp" },
  { label: "DEV", color: "exp" },
  { label: "V0", color: "thought" },
];

export function parseYouTube(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1) || null;
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) => p === "embed" || p === "shorts");
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    }
    return null;
  } catch {
    return null;
  }
}

export function getHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function dominantColor(parts: Part[]): TagColor {
  const counts: Record<TagColor, number> = { exp: 0, thought: 0, bug: 0, win: 0, idea: 0 };
  for (const p of parts) {
    if (p.type === "tag") counts[p.color]++;
    else if (p.type === "image") counts.idea++;
    else if (p.type === "video") counts.bug++;
    else if (p.type === "link") counts.exp++;
    else counts.thought++;
  }
  let best: TagColor = "thought";
  let max = -1;
  (Object.keys(counts) as TagColor[]).forEach((k) => {
    if (counts[k] > max) {
      max = counts[k];
      best = k;
    }
  });
  return best;
}

export function dayKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function dayLabel(key: string, todayKey: string) {
  if (key === todayKey) return "TODAY";
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

export function entriesToMarkdown(entries: Entry[]): string {
  const lines = ["# bl0g\n"];
  for (const e of entries) {
    const d = new Date(e.ts);
    lines.push(`## ${d.toISOString()}\n`);
    for (const p of e.parts) {
      if (p.type === "text") lines.push(p.body + "\n");
      else if (p.type === "tag") lines.push(`\`#${p.label}\`\n`);
      else if (p.type === "image") lines.push(`![${p.caption || ""}](${p.src})\n`);
      else if (p.type === "link") lines.push(`[${p.title || p.url}](${p.url})\n`);
      else if (p.type === "video") lines.push(`[▶ ${p.title || p.url}](${p.url})\n`);
      else if (p.type === "audio") lines.push(`🎙 ${p.name || "voicenote"}\n`);
    }
  }
  return lines.join("\n");
}

export function seedEntries(): Entry[] {
  const may = (d: number, h: number, min: number) => new Date(2025, 4, d, h, min).getTime();
  return [
    {
      id: may(4, 21, 14),
      ts: may(4, 21, 14),
      parts: [
        { type: "text", body: "shipped the sticky-card prototype. the tilt + hard shadow combo is the whole vibe — feels like a notebook, not an app." },
        { type: "tag", label: "SHIPPED", color: "win" },
        { type: "tag", label: "DESIGN", color: "exp" },
      ],
    },
    {
      id: may(3, 16, 2),
      ts: may(3, 16, 2),
      parts: [
        { type: "text", body: "drag math is annoying. pointer offsets vs container rect. finally clicked: clamp to (rect.w - card.w)." },
        { type: "tag", label: "DEV", color: "exp" },
        { type: "tag", label: "STUCK", color: "bug" },
      ],
    },
    {
      id: may(3, 11, 30),
      ts: may(3, 11, 30),
      parts: [
        { type: "text", body: "press start 2P + system-ui body is the move. retro headers, readable copy." },
        { type: "tag", label: "THINKING", color: "thought" },
      ],
    },
    {
      id: may(2, 22, 45),
      ts: may(2, 22, 45),
      parts: [
        { type: "text", body: "idea: a creative OS where each day is a canvas. drop pieces, log it, move on." },
        { type: "tag", label: "INSPO", color: "idea" },
        { type: "link", url: "https://www.are.na", title: "are.na", host: "are.na" },
      ],
    },
  ];
}

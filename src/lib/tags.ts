// Global tag registry stored in localStorage under "bl0g_tags".
// Tags are the ONLY thing that defines a tag's name + color.
// Entries reference tags by id (string).

export type Tag = { id: string; name: string; color: string };

const KEY = "bl0g_tags";

export const TAG_COLORS = [
  "#aec6ff",
  "#c9b1ff",
  "#ffb3ba",
  "#b5ead7",
  "#ffd966",
  "#ffcc99",
  "#d4a5f5",
  "#e0e0e0",
] as const;

const DEFAULTS: Tag[] = [
  { id: "1", name: "SHIPPED", color: "#b5ead7" },
  { id: "2", name: "THINKING", color: "#c9b1ff" },
  { id: "3", name: "STUCK", color: "#ffb3ba" },
  { id: "4", name: "INSPO", color: "#ffd966" },
  { id: "5", name: "DESIGN", color: "#aec6ff" },
  { id: "6", name: "DEV", color: "#b5ead7" },
  { id: "7", name: "VO", color: "#d4a5f5" },
];

const isBrowser = () => typeof window !== "undefined" && !!window.localStorage;

export function loadTags(): Tag[] {
  if (!isBrowser()) return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      saveTags(DEFAULTS);
      return DEFAULTS.slice();
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      saveTags(DEFAULTS);
      return DEFAULTS.slice();
    }
    return parsed.filter(
      (t): t is Tag =>
        t && typeof t.id === "string" && typeof t.name === "string" && typeof t.color === "string",
    );
  } catch {
    return DEFAULTS.slice();
  }
}

export function saveTags(tags: Tag[]) {
  if (!isBrowser()) return;
  localStorage.setItem(KEY, JSON.stringify(tags));
  window.dispatchEvent(new CustomEvent("bl0g:tags-changed"));
}

export function nextTagId(tags: Tag[]): string {
  let max = 0;
  for (const t of tags) {
    const n = Number(t.id);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return String(max + 1);
}

export function nextColor(tags: Tag[]): string {
  // Use the next color in the cycle based on how many tags exist.
  return TAG_COLORS[tags.length % TAG_COLORS.length];
}

export function cycleColor(current: string): string {
  const i = TAG_COLORS.indexOf(current as (typeof TAG_COLORS)[number]);
  if (i < 0) return TAG_COLORS[0];
  return TAG_COLORS[(i + 1) % TAG_COLORS.length];
}

export function tagsById(tags: Tag[]): Map<string, Tag> {
  return new Map(tags.map((t) => [t.id, t]));
}

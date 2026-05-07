// Light persistence layer for postcards, guestbook entries, say-hi links,
// and heart reactions. Tries the server API first, falls back to localStorage.

import { getMode } from "./api";

export type Postcard = {
  id: number;
  body: string;
  createdAt: number;
  remindAt: number;
  signoff: string;
  read?: boolean;
};

export type GuestbookEntry = {
  id: number;
  ts: number;
  kind: "text" | "draw";
  body?: string;
  src?: string; // dataURL for drawings
  name?: string;
};

export type SayHiLink = { id: string; label: string; url: string };

const LS = {
  postcards: "bl0g:postcards",
  guestbook: "bl0g:guestbook",
  sayhi: "bl0g:sayhi",
  reacted: "bl0g:reacted",
  reactions: "bl0g:reactions",
};

function readLS<T>(k: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(k) || "") as T; } catch { return fallback; }
}
function writeLS(k: string, v: unknown) { localStorage.setItem(k, JSON.stringify(v)); }

function authHeaders(): Record<string, string> {
  const t = localStorage.getItem("bl0g:token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function tryJSON(url: string, init?: RequestInit) {
  try {
    const r = await fetch(url, init);
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return null;
    return await r.json();
  } catch { return null; }
}

// ===== Postcards =====

export async function getPostcards(): Promise<Postcard[]> {
  const m = await getMode();
  if (m === "api") {
    const j = await tryJSON("/api/postcards", { headers: authHeaders() });
    if (j?.postcards) return j.postcards;
  }
  return readLS<Postcard[]>(LS.postcards, []);
}

export async function addPostcard(p: Postcard): Promise<Postcard> {
  const m = await getMode();
  if (m === "api") {
    const j = await tryJSON("/api/postcards", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(p),
    });
    if (j?.postcard) return j.postcard;
  }
  const list = readLS<Postcard[]>(LS.postcards, []);
  list.unshift(p);
  writeLS(LS.postcards, list);
  return p;
}

export async function markPostcardRead(id: number) {
  const m = await getMode();
  if (m === "api") {
    await tryJSON(`/api/postcards/${id}/read`, { method: "POST", headers: authHeaders() });
    return;
  }
  const list = readLS<Postcard[]>(LS.postcards, []).map((p) =>
    p.id === id ? { ...p, read: true } : p,
  );
  writeLS(LS.postcards, list);
}

export async function deletePostcard(id: number) {
  const m = await getMode();
  if (m === "api") {
    await fetch(`/api/postcards/${id}`, { method: "DELETE", headers: authHeaders() });
    return;
  }
  writeLS(LS.postcards, readLS<Postcard[]>(LS.postcards, []).filter((p) => p.id !== id));
}

export const POSTCARD_SIGNOFFS = [
  "from past me",
  "love, past me",
  "sincerely, past me",
  "xoxo, past me",
  "yours truly, past me",
  "take care, past me",
  "don't forget — past me",
  "with hope, past me",
  "anyway, past me",
  "good luck out there — past me",
  "you got this, past me",
  "miss you already, past me",
];

export function randomSignoff() {
  return POSTCARD_SIGNOFFS[Math.floor(Math.random() * POSTCARD_SIGNOFFS.length)];
}

// ===== Guestbook =====

export async function getGuestbook(): Promise<GuestbookEntry[]> {
  const m = await getMode();
  if (m === "api") {
    const j = await tryJSON("/api/guestbook");
    if (j?.entries) return j.entries;
  }
  return readLS<GuestbookEntry[]>(LS.guestbook, []);
}

export async function addGuestbookEntry(e: GuestbookEntry): Promise<GuestbookEntry> {
  const m = await getMode();
  if (m === "api") {
    const j = await tryJSON("/api/guestbook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(e),
    });
    if (j?.entry) return j.entry;
  }
  const list = readLS<GuestbookEntry[]>(LS.guestbook, []);
  list.unshift(e);
  writeLS(LS.guestbook, list);
  return e;
}

// ===== Say Hi =====

export async function getSayHi(): Promise<SayHiLink[]> {
  const m = await getMode();
  if (m === "api") {
    const j = await tryJSON("/api/sayhi");
    if (j?.links) return j.links;
  }
  return readLS<SayHiLink[]>(LS.sayhi, []);
}

export async function setSayHi(links: SayHiLink[]): Promise<void> {
  const m = await getMode();
  if (m === "api") {
    await tryJSON("/api/sayhi", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ links }),
    });
    return;
  }
  writeLS(LS.sayhi, links);
}

// ===== Reactions (heart) =====
// Visitor-side: localStorage flag stops double-tap.
// Server (or local) side: single counter per entry id.

export function hasReacted(entryId: number): boolean {
  const set = readLS<number[]>(LS.reacted, []);
  return set.includes(entryId);
}

function markReactedLocal(entryId: number) {
  const set = readLS<number[]>(LS.reacted, []);
  if (!set.includes(entryId)) {
    set.push(entryId);
    writeLS(LS.reacted, set);
  }
}

export async function react(entryId: number): Promise<void> {
  if (hasReacted(entryId)) return;
  markReactedLocal(entryId);
  const m = await getMode();
  if (m === "api") {
    await tryJSON(`/api/entries/${entryId}/react`, { method: "POST" });
    return;
  }
  const counts = readLS<Record<string, number>>(LS.reactions, {});
  counts[String(entryId)] = (counts[String(entryId)] || 0) + 1;
  writeLS(LS.reactions, counts);
}

export async function getReactionCounts(): Promise<Record<string, number>> {
  const m = await getMode();
  if (m === "api") {
    const j = await tryJSON("/api/reactions");
    if (j?.counts) return j.counts;
  }
  return readLS<Record<string, number>>(LS.reactions, {});
}

export const REACTION_COPY = [
  "the creator will feel the love",
  "sent with love",
  "💌 delivered",
  "they'll know",
];
export function randomReactionCopy() {
  return REACTION_COPY[Math.floor(Math.random() * REACTION_COPY.length)];
}
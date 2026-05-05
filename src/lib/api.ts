import type { Entry } from "./pieces";

let mode: "api" | "local" | null = null;

async function detectMode(): Promise<"api" | "local"> {
  if (mode) return mode;
  try {
    const r = await fetch("/api/status", { method: "GET" });
    if (r.ok) {
      const ct = r.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        await r.json();
        mode = "api";
        return mode;
      }
    }
  } catch {}
  mode = "local";
  return mode;
}

export async function getMode() {
  return detectMode();
}

export async function apiStatus(): Promise<{ initialized: boolean; hasEntries: boolean }> {
  const m = await detectMode();
  if (m === "local") {
    const tok = localStorage.getItem("bl0g:localPwSet") === "1";
    const entries = JSON.parse(localStorage.getItem("bl0g:entries") || "[]");
    return { initialized: tok, hasEntries: entries.length > 0 };
  }
  const r = await fetch("/api/status");
  return r.json();
}

export async function apiSetup(password: string): Promise<{ token: string }> {
  const m = await detectMode();
  if (m === "local") {
    localStorage.setItem("bl0g:localPwSet", "1");
    localStorage.setItem("bl0g:localPw", password);
    const tok = "local-" + Date.now();
    return { token: tok };
  }
  const r = await fetch("/api/setup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!r.ok) throw new Error((await r.json()).error || "setup failed");
  return r.json();
}

export async function apiLogin(password: string): Promise<{ token: string }> {
  const m = await detectMode();
  if (m === "local") {
    if (localStorage.getItem("bl0g:localPw") !== password) throw new Error("invalid password");
    return { token: "local-" + Date.now() };
  }
  const r = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!r.ok) throw new Error((await r.json()).error || "login failed");
  return r.json();
}

export async function apiGetEntries(): Promise<Entry[]> {
  const m = await detectMode();
  if (m === "local") {
    return JSON.parse(localStorage.getItem("bl0g:entries") || "[]");
  }
  const r = await fetch("/api/entries");
  const data = await r.json();
  return data.entries || [];
}

function authHeaders() {
  const t = localStorage.getItem("bl0g:token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function apiAddEntry(entry: Entry, token: string): Promise<Entry> {
  const m = await detectMode();
  if (m === "local") {
    const list: Entry[] = JSON.parse(localStorage.getItem("bl0g:entries") || "[]");
    list.unshift(entry);
    localStorage.setItem("bl0g:entries", JSON.stringify(list));
    return entry;
  }
  const r = await fetch("/api/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(entry),
  });
  if (!r.ok) throw new Error("save failed");
  return (await r.json()).entry;
}

export async function apiDeleteEntry(id: number, token: string): Promise<void> {
  const m = await detectMode();
  if (m === "local") {
    const list: Entry[] = JSON.parse(localStorage.getItem("bl0g:entries") || "[]");
    localStorage.setItem("bl0g:entries", JSON.stringify(list.filter((e) => e.id !== id)));
    return;
  }
  await fetch(`/api/entries/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function seedLocalIfEmpty(seed: Entry[]) {
  const cur = localStorage.getItem("bl0g:entries");
  if (!cur || cur === "[]") {
    localStorage.setItem("bl0g:entries", JSON.stringify(seed));
  }
}

// Browser-side API surface — talks to Supabase directly.
import { supabase } from "@/integrations/supabase/client";
import { dayKey, type Entry, type Part } from "./pieces";

export async function getMode(): Promise<"api"> {
  return "api";
}

function rowToEntry(row: {
  id: number | string;
  ts: number | string;
  parts: unknown;
  tag_ids?: unknown;
}): Entry {
  return {
    id: Number(row.id),
    ts: Number(row.ts),
    parts: (row.parts as Part[]) ?? [],
    tagIds: Array.isArray(row.tag_ids) ? (row.tag_ids as string[]) : [],
  };
}

export async function apiStatus(): Promise<{ initialized: boolean; hasEntries: boolean }> {
  const [cfgRes, countRes] = await Promise.all([
    supabase.from("app_config").select("owner_uid").eq("id", 1).maybeSingle(),
    supabase.from("entries").select("id", { count: "exact", head: true }),
  ]);
  return {
    initialized: !!cfgRes.data?.owner_uid,
    hasEntries: (countRes.count ?? 0) > 0,
  };
}

export async function apiSignUp(email: string, password: string): Promise<void> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${window.location.origin}/app` },
  });
  if (error) throw new Error(error.message);
  const uid = data.user?.id;
  if (!uid) throw new Error("signup did not return a user");
  // Claim ownership (RLS allows when owner_uid IS NULL).
  const { error: claimErr } = await supabase
    .from("app_config")
    .update({ owner_uid: uid })
    .eq("id", 1);
  if (claimErr) throw new Error(claimErr.message);
}

export async function apiSignIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function apiGetEntries(): Promise<Entry[]> {
  const { data, error } = await supabase
    .from("entries")
    .select("id, ts, parts, tag_ids")
    .order("ts", { ascending: false })
    .limit(1000);
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToEntry);
}

export async function apiAddEntry(entry: Entry, _token?: string): Promise<Entry> {
  const id = entry.id || Date.now();
  const ts = entry.ts || Date.now();
  const { data, error } = await supabase
    .from("entries")
    .insert({
      id,
      ts,
      day_key: dayKey(ts),
      parts: entry.parts as never,
      tag_ids: (entry.tagIds ?? []) as never,
    })
    .select("id, ts, parts, tag_ids")
    .single();
  if (error) throw new Error(error.message);
  return rowToEntry(data);
}

export async function apiUpdateEntry(entry: Entry, _token?: string): Promise<Entry> {
  const { data, error } = await supabase
    .from("entries")
    .update({
      ts: entry.ts,
      day_key: dayKey(entry.ts),
      parts: entry.parts as never,
      tag_ids: (entry.tagIds ?? []) as never,
    })
    .eq("id", entry.id)
    .select("id, ts, parts, tag_ids")
    .single();
  if (error) throw new Error(error.message);
  return rowToEntry(data);
}

export async function apiDeleteEntry(id: number, _token?: string): Promise<void> {
  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function seedLocalIfEmpty(_seed: Entry[]) {
  return;
}

export type { Entry, Part };

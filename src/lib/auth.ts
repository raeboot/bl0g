import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

let cached: Session | null = null;

if (typeof window !== "undefined") {
  supabase.auth.getSession().then(({ data }) => {
    cached = data.session;
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    cached = session;
  });
}

export function getSession(): Session | null {
  return cached;
}

// Legacy compatibility: callers used getToken() as a truthy "logged in" check.
export function getToken(): string | null {
  return cached?.access_token ?? null;
}

export async function clearToken(): Promise<void> {
  cached = null;
  await supabase.auth.signOut();
}

// no-op kept for source compatibility; real session is managed by Supabase.
export function setToken(_t: string): void {}

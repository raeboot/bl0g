import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { apiSignIn, apiSignUp, apiStatus } from "@/lib/api";

export function useAuth() {
  const [status, setStatus] = useState<"loading" | "uninit" | "out" | "in">("loading");

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data }, s] = await Promise.all([supabase.auth.getSession(), apiStatus()]);
      if (!active) return;
      if (!s.initialized) setStatus("uninit");
      else if (data.session) setStatus("in");
      else setStatus("out");
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setStatus((cur) => (cur === "uninit" ? cur : session ? "in" : "out"));
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const setup = async (email: string, pw: string) => {
    await apiSignUp(email, pw);
    setStatus("in");
  };
  const login = async (email: string, pw: string) => {
    await apiSignIn(email, pw);
    setStatus("in");
  };
  const logout = async () => {
    await supabase.auth.signOut();
    setStatus("out");
  };
  return { status, setup, login, logout };
}

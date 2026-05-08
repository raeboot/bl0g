import { useEffect, useState } from "react";
import { getToken, setToken, clearToken } from "@/lib/auth";
import { apiLogin, apiSetup, apiStatus } from "@/lib/api";

export function useAuth() {
  const [status, setStatus] = useState<"loading" | "uninit" | "out" | "in">("loading");

  useEffect(() => {
    (async () => {
      const s = await apiStatus();
      if (!s.initialized) setStatus("uninit");
      else if (getToken()) setStatus("in");
      else setStatus("out");
    })();
  }, []);

  const setup = async (pw: string) => {
    const { token } = await apiSetup(pw);
    setToken(token);
    setStatus("in");
  };
  const login = async (pw: string) => {
    const { token } = await apiLogin(pw);
    setToken(token);
    setStatus("in");
  };
  const logout = () => {
    clearToken();
    setStatus("out");
  };
  return { status, setup, login, logout };
}

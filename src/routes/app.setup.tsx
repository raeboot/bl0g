import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { StickyCard } from "@/components/StickyCard";
import { apiSignUp, apiStatus } from "@/lib/api";

export const Route = createFileRoute("/app/setup")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const s = await apiStatus();
    if (s.initialized) throw redirect({ to: "/app/login" });
  },
  component: Setup,
});

function Setup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (pw.length < 6) return setErr("password must be at least 6 chars");
    if (pw !== pw2) return setErr("passwords don't match");
    setBusy(true);
    try {
      await apiSignUp(email, pw);
      navigate({ to: "/app" });
    } catch (e: any) {
      setErr(e.message || "setup failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <SiteHeader active="log" />
      <main className="mx-auto max-w-md px-5 py-16">
        <StickyCard tone="win" tilt="b">
          <h1 className="pixel text-[14px] mb-4">FIRST RUN</h1>
          <p className="text-[13px] mb-5">claim ownership of this bl0g. only this account can post.</p>
          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
              className="w-full border-2 border-ink bg-background px-3 py-2 text-[13px]"
              autoFocus
              required
            />
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="password"
              className="w-full border-2 border-ink bg-background px-3 py-2 text-[13px]"
              required
            />
            <input
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              placeholder="confirm"
              className="w-full border-2 border-ink bg-background px-3 py-2 text-[13px]"
              required
            />
            {err && <div className="pixel text-[10px]" style={{ color: "var(--bug)" }}>{err}</div>}
            <button type="submit" disabled={busy} className="ink-btn win w-full">
              {busy ? "..." : "[ CLAIM → ]"}
            </button>
          </form>
        </StickyCard>
      </main>
    </div>
  );
}

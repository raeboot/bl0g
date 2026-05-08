import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { StickyCard } from "@/components/StickyCard";
import { apiSignIn, apiStatus } from "@/lib/api";

export const Route = createFileRoute("/app/login")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const s = await apiStatus();
    if (!s.initialized) throw redirect({ to: "/app/setup" });
  },
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await apiSignIn(email, pw);
      navigate({ to: "/app" });
    } catch (e: any) {
      setErr(e.message || "login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <SiteHeader active="log" />
      <main className="mx-auto max-w-md px-5 py-16">
        <StickyCard tone="exp" tilt="a">
          <h1 className="pixel text-[14px] mb-4">LOG IN</h1>
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
            {err && <div className="pixel text-[10px]" style={{ color: "var(--bug)" }}>{err}</div>}
            <button type="submit" disabled={busy} className="ink-btn win w-full">
              {busy ? "..." : "[ ENTER → ]"}
            </button>
          </form>
        </StickyCard>
      </main>
    </div>
  );
}

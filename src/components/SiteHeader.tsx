import { Link } from "@tanstack/react-router";
import { useDarkMode } from "@/hooks/useDarkMode";

export function SiteHeader({ active }: { active?: "feed" | "about" | "log" | "calendar" }) {
  const { dark, toggle } = useDarkMode();
  return (
    <header className="border-b-2 border-ink bg-background">
      <div className="mx-auto max-w-6xl px-5 py-5 flex items-center justify-between gap-4">
        <Link to="/" className="pixel text-[14px] tracking-tight">
          DEV LOG <span className="opacity-50">//</span> bl0g
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/" className={`ink-btn ${active === "feed" ? "active" : ""}`}>feed</Link>
          <Link to="/calendar" className={`ink-btn ${active === "calendar" ? "active" : ""}`}>calendar</Link>
          <Link to="/about" className={`ink-btn ${active === "about" ? "active" : ""}`}>about</Link>
          <Link to="/app" className={`ink-btn ${active === "log" ? "active" : ""}`}>log →</Link>
          <button
            onClick={toggle}
            aria-label="toggle dark mode"
            className="ink-btn"
            title={dark ? "light" : "dark"}
          >
            💡
          </button>
        </nav>
      </div>
    </header>
  );
}

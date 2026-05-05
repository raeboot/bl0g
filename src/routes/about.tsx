import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { StickyCard } from "@/components/StickyCard";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — bl0g" },
      { name: "description", content: "About bl0g, a self-hostable sticky-note dev diary." },
      { property: "og:title", content: "About — bl0g" },
      { property: "og:description", content: "About bl0g, a self-hostable sticky-note dev diary." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div>
      <SiteHeader active="about" />
      <main className="mx-auto max-w-2xl px-5 py-16">
        <StickyCard tone="idea" tilt="a" className="p-8">
          <h1 className="pixel text-[14px] mb-4">about</h1>
          <p className="text-[14px] leading-relaxed">
            bl0g is a single-user creative OS — a digital sticky-note diary for shipping, thinking, and getting unstuck.
            Drop pieces on a canvas, log it, move on. Self-host it anywhere with{" "}
            <code className="pixel text-[11px] border border-ink px-1">npm start</code>. Your data lives in one JSON
            file you can back up by copying.
          </p>
        </StickyCard>
      </main>
    </div>
  );
}

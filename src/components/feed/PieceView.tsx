import type { Part } from "@/lib/pieces";

export function PieceView({ p, compact = false }: { p: Part; compact?: boolean }) {
  if (p.type === "text") {
    return <p className={compact ? "text-[12px] leading-snug" : "text-[14px] leading-relaxed"}>{p.body}</p>;
  }
  if (p.type === "tag") {
    return (
      <span
        className="pixel inline-block border-2 border-ink px-2 py-1 text-[9px] mr-1.5 mb-1.5"
        style={{ background: `var(--${p.color})` }}
      >
        #{p.label}
      </span>
    );
  }
  if (p.type === "image") {
    return (
      <figure className="border-2 border-ink shadow-sticky inline-block max-w-full">
        <img
          src={p.src}
          alt={p.caption || "image"}
          className={compact ? "block max-h-32 w-auto" : "block max-h-72 w-auto"}
        />
        {p.caption && (
          <figcaption className="pixel text-[9px] px-2 py-1 border-t-2 border-ink bg-background">
            {p.caption}
          </figcaption>
        )}
      </figure>
    );
  }
  if (p.type === "link") {
    return (
      <a
        href={p.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block border-2 border-ink p-3 shadow-sticky hover:shadow-sticky-lg hover:-translate-y-1 transition-all"
        style={{ background: "var(--exp)" }}
      >
        <div className="text-[13px] font-semibold truncate">{p.title}</div>
        <div className="pixel text-[9px] mt-1 opacity-70">{p.host}</div>
      </a>
    );
  }
  if (p.type === "video") {
    return (
      <a
        href={p.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block border-2 border-ink shadow-sticky hover:shadow-sticky-lg hover:-translate-y-1 transition-all"
      >
        <div className="relative">
          <img
            src={`https://img.youtube.com/vi/${p.ytId}/hqdefault.jpg`}
            alt={p.title}
            className="block w-full"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="pixel text-[18px] border-2 border-ink bg-background px-3 py-2">▶</div>
          </div>
        </div>
        <div className="px-3 py-2 border-t-2 border-ink bg-background">
          <div className="text-[12px] truncate">{p.title}</div>
          <div className="pixel text-[9px] opacity-70 mt-1">{p.host}</div>
        </div>
      </a>
    );
  }
  return null;
}

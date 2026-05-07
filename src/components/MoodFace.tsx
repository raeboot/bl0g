import type { MoodId } from "@/lib/pieces";

export const MOODS: { id: MoodId; label: string }[] = [
  { id: "grinning", label: "grinning" },
  { id: "sleepy", label: "sleepy" },
  { id: "chaotic", label: "chaotic" },
  { id: "melting", label: "melting" },
  { id: "sparkling", label: "sparkling" },
  { id: "shy", label: "shy" },
  { id: "determined", label: "determined" },
  { id: "overwhelmed", label: "overwhelmed" },
];

// Hand-drawn-feel neobrutalist faces. Wobbly stroke via filter.
export function MoodFace({ mood, size = 40 }: { mood: MoodId; size?: number }) {
  const s = size;
  const stroke = "currentColor";
  const sw = 2.4;
  return (
    <svg
      viewBox="0 0 64 64"
      width={s}
      height={s}
      aria-label={mood}
      style={{ display: "block" }}
    >
      <defs>
        <filter id={`wob-${mood}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={hashSeed(mood)} />
          <feDisplacementMap in="SourceGraphic" scale="1.4" />
        </filter>
      </defs>
      <g
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#wob-${mood})`}
      >
        {/* face oval, slightly off */}
        <path d="M10 32 Q12 10 32 9 Q54 10 55 32 Q54 55 32 55 Q10 54 10 32 Z" />
        {renderFeatures(mood)}
      </g>
    </svg>
  );
}

function hashSeed(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 100;
}

function renderFeatures(mood: MoodId) {
  switch (mood) {
    case "grinning":
      return (
        <>
          <path d="M22 26 Q22 23 24 23 Q26 23 26 26" />
          <path d="M38 26 Q38 23 40 23 Q42 23 42 26" />
          <path d="M20 38 Q32 50 44 38" />
          <path d="M22 38 L42 38" />
        </>
      );
    case "sleepy":
      return (
        <>
          <path d="M21 27 Q24 25 27 27" />
          <path d="M37 27 Q40 25 43 27" />
          <path d="M26 42 Q32 40 38 42" />
          <path d="M46 18 Q50 16 54 18 L46 26 Q50 28 54 26" />
        </>
      );
    case "chaotic":
      return (
        <>
          <path d="M19 24 L29 30 M29 24 L19 30" />
          <path d="M35 24 L45 30 M45 24 L35 30" />
          <path d="M20 42 Q24 36 28 42 Q32 48 36 42 Q40 36 44 42" />
        </>
      );
    case "melting":
      return (
        <>
          <path d="M22 28 Q24 31 26 28" />
          <path d="M38 28 Q40 31 42 28" />
          <path d="M22 42 Q32 40 42 42 Q40 50 32 50 Q24 50 22 42" />
          <path d="M48 30 Q50 38 47 44" />
        </>
      );
    case "sparkling":
      return (
        <>
          <path d="M20 26 L26 26 M23 23 L23 29" />
          <path d="M38 26 L44 26 M41 23 L41 29" />
          <path d="M22 40 Q32 48 42 40" />
          <path d="M52 14 L52 20 M49 17 L55 17" />
          <path d="M12 44 L12 50 M9 47 L15 47" />
        </>
      );
    case "shy":
      return (
        <>
          <path d="M22 28 Q24 26 26 28" />
          <path d="M38 28 Q40 26 42 28" />
          <path d="M26 42 Q32 44 38 42" />
          <path d="M14 36 Q18 38 20 36" />
          <path d="M44 36 Q46 38 50 36" />
        </>
      );
    case "determined":
      return (
        <>
          <path d="M20 26 L28 24" />
          <path d="M44 26 L36 24" />
          <path d="M22 30 Q24 28 26 30" />
          <path d="M38 30 Q40 28 42 30" />
          <path d="M24 42 L40 42" />
        </>
      );
    case "overwhelmed":
      return (
        <>
          <path d="M19 23 L25 27 M25 23 L19 27" />
          <path d="M39 23 L45 27 M45 23 L39 27" />
          <path d="M22 44 Q32 38 42 44" />
          <path d="M14 16 Q18 20 14 24" />
          <path d="M50 16 Q46 20 50 24" />
        </>
      );
  }
}

export function MoodPicker({
  value,
  onChange,
}: {
  value?: MoodId;
  onChange: (m?: MoodId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {MOODS.map((m) => (
        <button
          key={m.id}
          onClick={() => onChange(value === m.id ? undefined : m.id)}
          className="border-2 border-ink p-1 hover:-translate-y-0.5 transition-transform"
          style={{
            background: value === m.id ? "var(--idea)" : "var(--bg)",
            outline: value === m.id ? "2px solid var(--ink)" : "none",
            outlineOffset: 2,
          }}
          title={m.label}
          aria-label={m.label}
        >
          <MoodFace mood={m.id} size={32} />
        </button>
      ))}
    </div>
  );
}
import { useEffect, useRef } from "react";

function exec(cmd: string, value?: string) {
  document.execCommand(cmd, false, value);
}

function applyFontSize(size: "S" | "M" | "L") {
  const map = { S: "12px", M: "15px", L: "20px" } as const;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
  const range = sel.getRangeAt(0);
  const span = document.createElement("span");
  span.style.fontSize = map[size];
  try {
    span.appendChild(range.extractContents());
    range.insertNode(span);
    sel.removeAllRanges();
  } catch {}
}

function applyHighlight() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
  const range = sel.getRangeAt(0);
  const span = document.createElement("span");
  span.style.background = "var(--idea)";
  span.style.padding = "0 2px";
  try {
    span.appendChild(range.extractContents());
    range.insertNode(span);
    sel.removeAllRanges();
  } catch {}
}

function applyLink() {
  const url = prompt("link url:");
  if (!url) return;
  exec("createLink", url);
}

export function RichTextEditor({
  html,
  onChange,
  placeholder = "what do you want to log?",
  minHeight = 120,
  autoFocus = false,
}: {
  html: string;
  onChange: (html: string, text: string) => void;
  placeholder?: string;
  minHeight?: number;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.innerHTML !== html) el.innerHTML = html || "";
    if (autoFocus) el.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    onChange(el.innerHTML, el.innerText);
  };

  const Btn = ({ label, onClick, title }: { label: string; onClick: () => void; title?: string }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
        setTimeout(emit, 0);
      }}
      className="pixel text-[9px] border-2 border-ink bg-background px-2 py-1 hover:-translate-y-0.5 transition-transform"
    >
      {label}
    </button>
  );

  return (
    <div className="border-2 border-ink bg-background">
      <div className="flex flex-wrap gap-1 p-2 border-b-2 border-ink" style={{ background: "var(--log-bg)" }}>
        <Btn label="B" onClick={() => exec("bold")} title="bold" />
        <Btn label="I" onClick={() => exec("italic")} title="italic" />
        <Btn label="U" onClick={() => exec("underline")} title="underline" />
        <Btn label="HL" onClick={applyHighlight} title="highlight" />
        <span className="w-px bg-ink mx-1" />
        <Btn label="S" onClick={() => applyFontSize("S")} title="small" />
        <Btn label="M" onClick={() => applyFontSize("M")} title="medium" />
        <Btn label="L" onClick={() => applyFontSize("L")} title="large" />
        <span className="w-px bg-ink mx-1" />
        <Btn label="LINK" onClick={applyLink} />
        <Btn label="•" onClick={() => exec("insertUnorderedList")} title="list" />
        <Btn label="CLR" onClick={() => exec("removeFormat")} title="clear formatting" />
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        data-placeholder={placeholder}
        className="rt-editor px-3 py-3 text-[14px] leading-relaxed outline-none"
        style={{ minHeight }}
      />
    </div>
  );
}
import { useEffect, useRef, useState } from "react";

export function AudioRecorder({ onCapture }: { onCapture: (src: string, name: string, duration: number) => void }) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [err, setErr] = useState("");
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startRef = useRef(0);
  const tickRef = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (tickRef.current) window.clearInterval(tickRef.current);
    mrRef.current?.stream.getTracks().forEach((t) => t.stop());
  }, []);

  const start = async () => {
    setErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        const reader = new FileReader();
        reader.onload = () => {
          const dur = (Date.now() - startRef.current) / 1000;
          onCapture(String(reader.result), `voicenote-${new Date().toISOString().slice(0, 19)}.webm`, dur);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mrRef.current = mr;
      startRef.current = Date.now();
      setElapsed(0);
      tickRef.current = window.setInterval(() => setElapsed((Date.now() - startRef.current) / 1000), 200);
      mr.start();
      setRecording(true);
    } catch (e: any) {
      setErr(e.message || "mic blocked");
    }
  };

  const stop = () => {
    mrRef.current?.stop();
    if (tickRef.current) window.clearInterval(tickRef.current);
    setRecording(false);
  };

  const onFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const audio = new Audio();
      audio.onloadedmetadata = () => onCapture(String(reader.result), f.name, audio.duration || 0);
      audio.onerror = () => onCapture(String(reader.result), f.name, 0);
      audio.src = String(reader.result);
    };
    reader.readAsDataURL(f);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!recording ? (
        <button className="ink-btn" onClick={start}>● REC</button>
      ) : (
        <button className="ink-btn" style={{ background: "var(--bug)" }} onClick={stop}>
          ■ STOP {elapsed.toFixed(1)}s
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          if (fileRef.current) fileRef.current.value = "";
        }}
      />
      <button className="ink-btn" onClick={() => fileRef.current?.click()}>UPLOAD AUDIO</button>
      {err && <span className="pixel text-[9px]" style={{ color: "var(--bug)" }}>{err}</span>}
    </div>
  );
}
import express from "express";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";
import { hashPassword, verifyPassword, makeToken, authMiddleware } from "./auth.js";
import { readStore, writeStore, ensureSecret } from "./store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8787;
const DIST = path.join(__dirname, "..", "dist");

const app = express();
app.use(compression());
app.use(express.json({ limit: "10mb" }));

let SECRET = await ensureSecret();
const getSecret = () => SECRET;
const requireAuth = authMiddleware(getSecret);

app.get("/api/status", async (req, res) => {
  const s = await readStore();
  res.json({ initialized: !!s.passwordHash, hasEntries: (s.entries || []).length > 0 });
});

app.post("/api/setup", async (req, res) => {
  const s = await readStore();
  if (s.passwordHash) return res.status(400).json({ error: "already initialized" });
  const { password } = req.body || {};
  if (!password || password.length < 4) return res.status(400).json({ error: "password too short" });
  s.passwordHash = await hashPassword(password);
  s.createdAt = Date.now();
  if (!s.sessionSecret) s.sessionSecret = SECRET;
  if (!s.entries) s.entries = [];
  await writeStore(s);
  SECRET = s.sessionSecret;
  res.json({ token: makeToken(SECRET) });
});

app.post("/api/login", async (req, res) => {
  const s = await readStore();
  if (!s.passwordHash) return res.status(400).json({ error: "not initialized" });
  const { password } = req.body || {};
  if (!password || !(await verifyPassword(password, s.passwordHash))) {
    return res.status(401).json({ error: "invalid password" });
  }
  res.json({ token: makeToken(SECRET) });
});

app.get("/api/entries", async (req, res) => {
  const s = await readStore();
  res.json({ entries: s.entries || [] });
});

app.post("/api/entries", requireAuth, async (req, res) => {
  const s = await readStore();
  const entry = req.body;
  if (!entry || !Array.isArray(entry.parts)) return res.status(400).json({ error: "bad entry" });
  entry.id = entry.id || Date.now();
  entry.ts = entry.ts || Date.now();
  s.entries = s.entries || [];
  s.entries.unshift(entry);
  await writeStore(s);
  res.json({ entry });
});

app.delete("/api/entries/:id", requireAuth, async (req, res) => {
  const s = await readStore();
  const id = Number(req.params.id);
  s.entries = (s.entries || []).filter((e) => e.id !== id);
  await writeStore(s);
  res.json({ ok: true });
});

app.get("/api/export", requireAuth, async (req, res) => {
  const s = await readStore();
  const md = entriesToMarkdown(s.entries || []);
  res.setHeader("Content-Type", "text/markdown");
  res.setHeader("Content-Disposition", 'attachment; filename="bl0g.md"');
  res.send(md);
});

function entriesToMarkdown(entries) {
  const lines = ["# bl0g\n"];
  for (const e of entries) {
    const d = new Date(e.ts);
    lines.push(`## ${d.toISOString()}`);
    for (const p of e.parts || []) {
      if (p.type === "text") lines.push(p.body);
      else if (p.type === "tag") lines.push(`\`#${p.label}\``);
      else if (p.type === "image") lines.push(`![${p.caption || ""}](${p.src})`);
      else if (p.type === "link") lines.push(`[${p.title || p.url}](${p.url})`);
      else if (p.type === "video") lines.push(`[▶ ${p.title || p.url}](${p.url})`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

app.use(express.static(DIST));
app.get("*", (req, res) => res.sendFile(path.join(DIST, "index.html")));

app.listen(PORT, () => console.log(`bl0g listening on :${PORT}`));

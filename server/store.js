import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const DATA_DIR = process.env.DATA_DIR || "./data";
const FILE = path.join(DATA_DIR, "bl0g.json");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readStore() {
  await ensureDir();
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    if (e.code === "ENOENT") {
      return { passwordHash: null, sessionSecret: null, createdAt: null, entries: [] };
    }
    throw e;
  }
}

export async function writeStore(data) {
  await ensureDir();
  const tmp = FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, FILE);
}

export async function ensureSecret() {
  const s = await readStore();
  if (!s.sessionSecret) {
    s.sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
    await writeStore(s);
  }
  return s.sessionSecret;
}

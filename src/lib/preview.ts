export type LinkMeta = {
  title?: string;
  description?: string;
  image?: string;
};

async function viaServer(url: string): Promise<LinkMeta | null> {
  try {
    const r = await fetch(`/api/preview?url=${encodeURIComponent(url)}`);
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return null;
    const j = await r.json();
    if (!j || (!j.title && !j.image && !j.description)) return null;
    return j as LinkMeta;
  } catch {
    return null;
  }
}

async function viaMicrolink(url: string): Promise<LinkMeta | null> {
  try {
    const r = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
    if (!r.ok) return null;
    const j = await r.json();
    const d = j?.data;
    if (!d) return null;
    return {
      title: d.title,
      description: d.description,
      image: d.image?.url || d.logo?.url,
    };
  } catch {
    return null;
  }
}

export async function fetchLinkMeta(url: string): Promise<LinkMeta> {
  const a = await viaServer(url);
  if (a) return a;
  const b = await viaMicrolink(url);
  return b || {};
}
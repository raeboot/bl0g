import { createServerFn } from "@tanstack/react-start";

export const apiFetchPreviewFn = createServerFn({ method: "POST" })
  .inputValidator((data: { url: string }) => {
    if (!data?.url || !/^https?:\/\//i.test(data.url)) throw new Error("bad url");
    return data;
  })
  .handler(async ({ data }) => {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 6000);
    try {
      const r = await fetch(data.url, {
        signal: ac.signal,
        headers: { "user-agent": "Mozilla/5.0 bl0g-preview" },
        redirect: "follow",
      });
      const html = (await r.text()).slice(0, 200_000);
      const pick = (re: RegExp) => {
        const m = html.match(re);
        return m ? m[1].trim() : undefined;
      };
      const meta = (prop: string) =>
        pick(
          new RegExp(
            `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
            "i",
          ),
        ) ||
        pick(
          new RegExp(
            `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,
            "i",
          ),
        );
      let image = meta("og:image") || meta("twitter:image");
      if (image && image.startsWith("/")) {
        try {
          image = new URL(image, data.url).toString();
        } catch {
          /* ignore */
        }
      }
      return {
        title: meta("og:title") || pick(/<title[^>]*>([^<]+)<\/title>/i),
        description: meta("og:description") || meta("description"),
        image,
      };
    } catch {
      return { title: undefined, description: undefined, image: undefined };
    } finally {
      clearTimeout(t);
    }
  });

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { StickyCard } from "@/components/StickyCard";

export const Route = createFileRoute("/install")({
  head: () => ({
    meta: [
      { title: "Self-host — bl0g" },
      { name: "description", content: "Self-host bl0g on a VPS or Railway." },
      { property: "og:title", content: "Self-host — bl0g" },
      { property: "og:description", content: "Self-host bl0g on a VPS or Railway." },
    ],
  }),
  component: InstallPage,
});

const ONE_LINER = `curl -fsSL https://raw.githubusercontent.com/YOUR_REPO/main/install.sh | bash`;

const INSTALL_SH = `# install.sh — lives at the root of the repo.
# the one-liner above just curls and pipes this file into bash.
# override defaults with env vars: BL0G_REPO, BL0G_DIR, BL0G_PORT, BL0G_BRANCH

git clone --depth 1 https://github.com/YOUR_REPO.git ~/bl0g
cd ~/bl0g
npm install
npm run build
npm install -g pm2
PORT=3000 pm2 start npm --name bl0g -- start
pm2 save
pm2 startup   # run the command it prints, once, to auto-start on boot`;

const RAILWAY_URL = "https://railway.app/new/template?template=https://github.com/YOUR_REPO";

const HTACCESS = `RewriteEngine On
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
ProxyPassReverse / http://localhost:3000/`;

const VHOST = `ProxyPass / http://localhost:3000/
ProxyPassReverse / http://localhost:3000/`;

function CopyBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };
  return (
    <div className="relative">
      <pre className="border-2 border-ink bg-background p-3 text-[12px] overflow-x-auto whitespace-pre">
        <code>{code}</code>
      </pre>
      <button
        onClick={copy}
        className="ink-btn absolute top-2 right-2 !py-1 !px-2 !text-[9px]"
      >
        {copied ? "COPIED" : "COPY"}
      </button>
    </div>
  );
}

function InstallPage() {
  const [showScript, setShowScript] = useState(false);
  const [showCpanel, setShowCpanel] = useState(false);

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-16 space-y-8">
        <h1 className="pixel text-[16px]">self-host bl0g</h1>

        <StickyCard tone="idea" tilt="a" className="p-6 space-y-3">
          <div className="pixel text-[11px]">VPS / cPanel SERVER</div>
          <CopyBlock code={ONE_LINER} />
          <button
            onClick={() => setShowScript((v) => !v)}
            className="pixel text-[10px] underline opacity-70 hover:opacity-100"
          >
            {showScript ? "▾ install.sh" : "▸ install.sh"}
          </button>
          {showScript && <CopyBlock code={INSTALL_SH} />}
        </StickyCard>

        <StickyCard tone="exp" tilt="b" className="p-6 space-y-3">
          <div className="pixel text-[11px]">RAILWAY (easiest)</div>
          <a
            href={RAILWAY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ink-btn win inline-block"
          >
            [ DEPLOY ON RAILWAY → ]
          </a>
          <p className="text-[12px] opacity-70">No server required. Free tier available.</p>
        </StickyCard>

        <div className="border-2 border-ink bg-background">
          <button
            onClick={() => setShowCpanel((v) => !v)}
            className="w-full text-left px-4 py-3 pixel text-[10px] hover:bg-[var(--log-bg)]"
          >
            {showCpanel ? "▾" : "▸"} running on a cPanel server? point your subdomain here →
          </button>
          {showCpanel && (
            <div className="border-t-2 border-ink p-4 space-y-4">
              <div className="space-y-2">
                <div className="pixel text-[9px] opacity-70">
                  APACHE .htaccess (in your subdomain's public_html)
                </div>
                <CopyBlock code={HTACCESS} />
              </div>
              <div className="space-y-2">
                <div className="pixel text-[9px] opacity-70">
                  OR via cPanel Apache config (vhost include)
                </div>
                <CopyBlock code={VHOST} />
              </div>
              <p className="text-[12px] opacity-70">
                create the subdomain in cPanel first, then add one of these to point it at port 3000.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

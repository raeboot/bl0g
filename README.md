# bl0g

A self-hostable, single-user creative OS — a retro sticky-note dev diary. Two surfaces:

- **`/`** — public feed (read-only) of daily moments
- **`/app`** — password-gated logging canvas where you drop pieces (text, tags, links, images, YouTube) and log them as a single entry

## Self-host

```bash
git clone <repo>
cd bl0g
npm install
npm run build      # builds the frontend into dist/
npm start          # serves dist/ + JSON API on PORT (default 8787)
```

First visit to `/app` shows a setup screen — pick a password. The server hashes it (bcrypt) and writes it to `data/bl0g.json`.

### Environment

- `PORT` — default `8787`
- `DATA_DIR` — default `./data`
- `SESSION_SECRET` — auto-generated on first boot if missing (stored in `data/bl0g.json`)

### Backup

Just copy `data/bl0g.json`. That's the whole database.

### Behind nginx / Caddy

```
# nginx
location / {
  proxy_pass http://127.0.0.1:8787;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

```
# Caddy
example.com {
  reverse_proxy 127.0.0.1:8787
}
```

### systemd unit

```ini
[Unit]
Description=bl0g
After=network.target

[Service]
WorkingDirectory=/srv/bl0g
ExecStart=/usr/bin/node server/index.js
Restart=always
Environment=PORT=8787
Environment=DATA_DIR=/srv/bl0g/data

[Install]
WantedBy=multi-user.target
```

## Lovable preview note

The Lovable preview only runs the Vite frontend (no persistent Node server). The client detects no API and falls back to `localStorage`, so the experience is identical except data lives in your browser.

## Storage caveats

Images are stored inline as base64 in `data/bl0g.json`. For very large libraries, consider a future storage upgrade.

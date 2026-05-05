# bl0g — self-hostable creative OS

Retro sticky-note dev diary. Public feed at `/`, password-gated logging canvas at `/app`. Visual system locked to the uploaded `dev_diary_sticky.html` reference (Press Start 2P, 2px ink borders, hard offset shadows, pastel HSL tokens, alternating tilt, hover lift).

## Stack note

Spec calls for Express in `/server` + `npm start`. The project is TanStack Start on Vite. I'll add a real Express server in `/server` that serves the built `dist/` and the JSON API alongside the existing frontend. In the Lovable preview (frontend-only, no persistent server), the client pings `/api/status` and falls back to localStorage so everything still works. On a self-hosted box, `npm run build && npm start` boots Express on `PORT` (default 8787) and the API takes over.

## Visual system (locked from reference)

- Press Start 2P (Google Fonts) for header, day labels, tags, buttons, counts; system-ui ~13px / 1.5 for body
- 2px ink borders; hard offset shadows `6px 6px 0` → `10px 10px 0` on hover with `translateY(-10px)` lift
- Alternating sticky tilt `-1.5° / 1.2°`; straightens on hover/drag
- Pastel HSL tokens in `src/styles.css` + `.dark` variant: `--exp` blue, `--thought` lavender, `--bug` coral, `--win` mint, `--idea` butter, `--log-bg` muted blue-grey
- `LOG IT →` uses `--win` mint with heavier shadow
- 💡 dark toggle persisted under `bl0g:dark`
- Tailwind v4 theme exposes pixel font, `shadow-sticky / sticky-lg`, keyframes `snap-in`, `fade-up-stagger`, `lift`

## Public feed (`/`, `/about`, `/day/:date`)

- Pixel header `bl0g.dev` + tagline "small moments, logged as they happen"; tabs `feed / about / log →`; 💡 toggle
- Days grouped: pixel-font date heading, "N MOMENTS", ink hairline rule
- Entry cards: ink border, color-tinted left border (dominant piece type), hover slide-right 8px with `6px 6px 0` shadow
- Full-fidelity pieces: text, image+caption, link card, video card with YouTube thumbnail + ▶
- Tags collected into a pixel-pill row at the bottom of each entry
- Day heading links to `/day/:date`
- `/about`: single paragraph on a pastel sticky panel

## Creative OS (`/app`, `/app/setup`, `/app/login`)

- First visit when uninitialized → setup screen (choose password → bcrypt hash → token)
- Login screen when not authed; auth-gated client-side, server enforces too

**Canvas (left)** — dot-grid bg, 2px ink border, offset shadow. Sticky cards (~240px) absolutely positioned, alternating tilt, hard shadow, hover lift. Drag to reposition (pointer events, clamped to bounds; tilt resets while dragging). Hover reveals pixel `[×]` delete (fade out). Snap-in on placement; staggered fade-up on commit. Native drag-and-drop of image files. Bottom bar: piece count · `[ CLEAR ]` · `[ LOG IT → ]`.

**Piece types** — text (140–220px), tag (pixel pill, 5 colors), image (base64 dataURL + caption), link (title + host), video (YouTube thumbnail + ▶ overlay parsed from URL).

**Adders** — mode buttons `TEXT / TAG / LINK / IMAGE`. Tag presets: `SHIPPED THINKING STUCK INSPO DESIGN DEV V0`. Link auto-detects YouTube → video piece. Image via hidden file input → base64.

**Timeline (right)** — `--log-bg` band, entries grouped by day ("today" / "MON, MAY 3"), compact piece rendering, color-tinted left border. `[ EXPORT → ]` hits `/api/export` (or builds locally) → `bl0g.md`.

**Commit** — `LOG IT →` plays staggered fade-up, POSTs entry, clears canvas.

## Backend (`/server`, Node + Express)

- `server/index.js` (ESM): static `dist/` + JSON API, compression, 10 MB body limit
- `server/store.js`: read/write `data/bl0g.json` with atomic temp+rename
- `server/auth.js`: bcryptjs hash; token = HMAC-SHA256(`SESSION_SECRET`, `userId|issuedAt`); bearer header
- Auto-generates `SESSION_SECRET` to `data/bl0g.json` on first boot if missing
- Endpoints:
  - `GET  /api/status` → `{ initialized, hasEntries }`
  - `POST /api/setup` (only while uninitialized) → `{ token }`
  - `POST /api/login` → `{ token }`
  - `GET  /api/entries` (public)
  - `POST /api/entries` (auth)
  - `DELETE /api/entries/:id` (auth)
  - `GET  /api/export` (auth) → `bl0g.md`
- Images stored inline as base64 (README warns about size)

## Frontend wiring

- `src/lib/api.ts` — pings `/api/status`; reachable → API mode, else localStorage mode
- `src/lib/auth.ts` — token under `bl0g:token`
- `src/lib/storage.ts` — unified `loadEntries / saveEntry / deleteEntry / exportMd`
- `src/lib/pieces.ts` — YouTube ID parsing, dominant-type detection, markdown export
- Seeds the May 2–4, 2025 example entries on first load when empty (both modes)

## Data model

```text
Entry { id: number, ts: number, parts: Part[] }
Part =
  | { type: 'text',  body }
  | { type: 'tag',   label, color: 'exp'|'thought'|'bug'|'win'|'idea' }
  | { type: 'image', src, caption? }
  | { type: 'link',  url, title, host }
  | { type: 'video', url, title, host, ytId }
```
`data/bl0g.json`: `{ passwordHash, sessionSecret, createdAt, entries }`

## File layout

- `server/{index,auth,store}.js`, `data/.gitkeep`
- `src/lib/{api,auth,storage,pieces}.ts`
- `src/hooks/{useDraggable,useDarkMode,useAuth}.ts`
- `src/components/StickyCard.tsx`, `src/components/SiteHeader.tsx`
- `src/components/canvas/{Canvas,PieceCard,AdderBar,TimelinePanel}.tsx`
- `src/components/feed/{DayGroup,EntryCard,PieceView}.tsx`
- TanStack routes: `index.tsx` (feed), `about.tsx`, `day.$date.tsx`, `app.tsx` (layout/guard), `app.index.tsx`, `app.setup.tsx`, `app.login.tsx`
- `package.json` scripts: `dev`, `build`, `start`; deps `express`, `bcryptjs`, `compression`
- `README.md`: install, nginx/Caddy, systemd unit, backup = copy `data/bl0g.json`

## Self-hosting

```bash
git clone <repo> && cd bl0g
npm install
npm run build
npm start            # PORT=8787
```
Optional `.env`: `PORT`, `DATA_DIR` (default `./data`), `SESSION_SECRET` (auto-generated if missing).

## Out of scope

Multi-user, OAuth, password reset, cloud image storage, streaks/search, Docker.

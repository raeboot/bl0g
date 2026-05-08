#!/usr/bin/env bash
# bl0g self-host installer (VPS / cPanel)
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/YOUR_REPO/main/install.sh | bash
#
# Optional env vars:
#   BL0G_REPO   git url to clone (default: https://github.com/YOUR_REPO.git)
#   BL0G_DIR    target directory (default: $HOME/bl0g)
#   BL0G_PORT   port to bind (default: 3000)
#   BL0G_BRANCH branch to check out (default: main)

set -euo pipefail

REPO="${BL0G_REPO:-https://github.com/YOUR_REPO.git}"
DIR="${BL0G_DIR:-$HOME/bl0g}"
PORT="${BL0G_PORT:-3000}"
BRANCH="${BL0G_BRANCH:-main}"

say() { printf "\n\033[1;36m▸ %s\033[0m\n" "$*"; }
die() { printf "\n\033[1;31m✗ %s\033[0m\n" "$*" >&2; exit 1; }

command -v git  >/dev/null 2>&1 || die "git is required"
command -v node >/dev/null 2>&1 || die "node is required (>=20). Install from https://nodejs.org"
command -v npm  >/dev/null 2>&1 || die "npm is required"

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 20 ] || die "node >= 20 required (found $(node -v))"

if [ -d "$DIR/.git" ]; then
  say "updating existing checkout at $DIR"
  git -C "$DIR" fetch --depth 1 origin "$BRANCH"
  git -C "$DIR" reset --hard "origin/$BRANCH"
else
  say "cloning $REPO -> $DIR"
  git clone --depth 1 --branch "$BRANCH" "$REPO" "$DIR"
fi

cd "$DIR"

say "installing dependencies"
npm install --no-audit --no-fund

say "building"
npm run build

if ! command -v pm2 >/dev/null 2>&1; then
  say "installing pm2 globally"
  npm install -g pm2
fi

say "starting bl0g on port $PORT"
PORT="$PORT" pm2 start npm --name bl0g -- start || \
  PORT="$PORT" pm2 restart bl0g

pm2 save

cat <<EOF

\033[1;32m✓ bl0g is running on http://localhost:$PORT\033[0m

next steps:
  • point a subdomain at port $PORT (see /install in the app for Apache/cPanel snippets)
  • run \`pm2 startup\` once and follow the printed command to auto-start on boot
  • visit /app/setup in your browser to set the admin password

logs:    pm2 logs bl0g
status:  pm2 status
restart: pm2 restart bl0g
EOF

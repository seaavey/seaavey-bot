# SeaaveyBot — Agent Guide

## Stack

- **Runtime**: Bun (not Node.js). All commands use `bun` not `npm`/`node`.
- **Entrypoint**: `src/index.ts` — calls `loadCommands()` then `startBot()`.
- **Database**: `bun:sqlite` with WAL mode, file `data.db`. Inline migrations via `safeMigrate()` — no migration tooling.
- **WhatsApp library**: `baileys@^7.0.0-rc13` (v7, relatively new). Auth stored in `auth/` directory via `useMultiFileAuthState`.
- **Logger**: Pino with daily file rotation (`logs/`) + pino-pretty console output.

## Commands

```bash
# required order when verifying: lint first, then typecheck
bun run lint          # eslint . && bun tsc (tsc --noEmit with strict checks)
bun run format        # prettier --write .
bun run format:check  # prettier --check .

# run tests (no package.json script — invoke directly)
bun test

# development (with hot-reload)
bun run dev

# production
bun run start
```

- **Test runner**: `bun:test`. Existing tests are in `src/infra/scrapers/__tests__/`.
- **CI** (`.github/workflows/ci.yml`): `bun install` → `bun run lint` → `bunx tsc --noEmit` → `bun test`. Triggers on push/PR to `main`.

## Architecture

| Directory                  | Purpose                                                                                                  |
| -------------------------- | -------------------------------------------------------------------------------------------------------- |
| `src/commands/<category>/` | 13 categories, each file auto-loaded as a command                                                        |
| `src/core/`                | Config, types, logger                                                                                    |
| `src/handlers/`            | Message parsing, command dispatch, guards, group events                                                  |
| `src/handlers/middleware/` | Pipeline: antiViewOnce → antiLink → antiSpam → afk → gameAnswer → geminiAuto → autoReply (order matters) |
| `src/infra/`               | Database client, loader, scheduler, repositories (one per domain)                                        |
| `src/game/`                | Game engine — 30 games, 17 use JSON data from `src/game/data/games/`                                     |
| `src/utils/`               | Message resolver, helpers, TTL map, converters                                                           |

## Command system

- Commands export `defineCommand({...})` as default. File at `src/commands/<category>/<name>.ts` gets its filename (minus `.ts`) as a trigger automatically.
- Triggers also come from `triggers[]`, `command`, and `alias[]` fields. All lowercased.
- Guards (`command-guards.ts`): ownerOnly, groupOnly, privateOnly, adminOnly, botAdmin, cooldown, enabled.
- Path alias `@/*` maps to `./src/*`.

## TypeScript quirks

- `verbatimModuleSyntax: true` — **must use `import type`** for type-only imports.
- `strict: true` with `noUncheckedIndexedAccess` enabled.
- `noUnusedLocals` / `noUnusedParameters` are **false** (relaxed for dev).
- `noEmit: true` (Bun handles transpilation).

## Config

`.env` file (copy from `.env.example`):

```env
OWNER_NUMBER=62123456789       # comma-separated for multiple
ACCESS_MODE=public             # public | private | self
PREFIX=.                       # comma-separated for multiple
NODE_ENV=production            # production | development
```

## Code style

- **ESLint**: no unused vars (`_` prefix exempt), `no-explicit-any` error, `no-console` warn, `prefer-const` error.
- **Prettier**: 100 printWidth, double quotes, trailing commas, LF line endings.
- **Git hook** (`.githooks/pre-commit`): auto-formats staged `.ts/.js/.json/.md` files with prettier + eslint --fix.
- ESLint ignores: `node_modules/`, `data/`, `auth/`, `dev/`, `logs/`.

## Docker

Multi-stage build (`oven/bun:1`). Requires volumes for `auth/` and `data/` (or `data.db`):

```bash
docker build -t seaaveybot .
docker run -v ./auth:/app/auth -v ./data.db:/app/data.db seaaveybot
```

## Miscellaneous

- Commands support cooldowns via TtlMap (5-minute self-cleanup).
- Game answer checking is a middleware — all 20 game checkers run sequentially per message in group chats.
- Scheduler (`src/infra/scheduler.ts`) polls every 30s for pending reminders and scheduled messages.
- PM2 config at `ecosystem.config.cjs` uses `bun` as interpreter.
- `install.sh` supports both Linux VPS and Termux.

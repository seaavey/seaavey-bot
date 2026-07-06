# Repository Guidelines

## Project Structure & Module Organization

SeaaveyBot is a Bun-based WhatsApp bot. The entrypoint is `src/index.ts`, which loads
commands and starts the bot. Commands live in `src/commands/<category>/<name>.ts`; each
file is auto-registered by filename, with optional `triggers`, `command`, and `alias`
fields. Core configuration, shared types, and logging live in `src/core/`. Message
handling, dispatch, guards, and middleware live in `src/handlers/`; middleware order is
significant. Infrastructure code is in `src/infra/`, including SQLite access,
repositories, scrapers, and the scheduler. Game logic is in `src/game/`, with data under
`src/game/data/` when present. Static media lives in `src/assets/`. Tests currently live
under `src/infra/scrapers/__tests__/`.

## Build, Test, and Development Commands

Use Bun for all local commands.

```bash
bun install          # install dependencies
bun run lint         # eslint . && bun tsc
bun run format       # prettier --write .
bun run format:check # verify formatting
bun test             # run bun:test suites
bun run dev          # run locally with NODE_ENV=development
bun run start        # production entrypoint
```

When verifying changes, run `bun run lint` before tests.

## Coding Style & Naming Conventions

This project uses TypeScript with `strict`, `noUncheckedIndexedAccess`, and
`verbatimModuleSyntax`. Use `import type` for type-only imports. Prefer existing helpers
from `src/utils/`, repository classes from `src/infra/repositories/`, and the `@/*` path
alias for source imports. Command files should default-export `defineCommand({...})` and
use lowercase trigger names. Formatting is Prettier with 100-character lines, double
quotes, trailing commas, and LF endings. ESLint rejects explicit `any`; unused variables
may be prefixed with `_`.

## Testing Guidelines

Tests use `bun:test`. Place new tests beside the relevant module in a `__tests__`
directory and name files `*.test.ts`, following the existing scraper tests. Add focused
tests for parser, scraper, repository, and command behavior when logic changes. Keep
network-dependent tests deterministic by mocking responses or using stable fixtures.

## Commit & Pull Request Guidelines

Recent history mostly uses concise imperative subjects with prefixes such as `feat:`,
`fix:`, and `refactor:`. Follow that style, for example `fix: handle empty scraper
response`. Pull requests should describe the behavior change, list verification commands
run, link related issues when available, and include screenshots or chat examples for
visible WhatsApp behavior.

## Security & Configuration Tips

Copy `.env.example` to `.env` for local configuration. Do not commit `.env`, `auth/`,
`logs/`, `data/`, or `data.db`. SQLite uses `bun:sqlite` with WAL mode and inline
migrations in code. WhatsApp auth state is stored in `auth/`, so keep that directory
private and mounted as persistent storage in deployments.

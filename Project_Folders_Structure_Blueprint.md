# SeaaveyBot Directory Structure Blueprint

This document serves as the definitive guide to the folder structure, architectural design, and file organization of **SeaaveyBot**. It provides rules and templates for adding new components to maintain codebase integrity and consistency.

---

## 1. Architectural Overview

**SeaaveyBot** is a high-performance WhatsApp bot powered by the **Bun** runtime. It uses the `baileys` library (v7) for WhatsApp Web API integration and a lightweight, embedded `bun:sqlite` database for persistence.

The architecture is designed to be highly modular and extensible, consisting of the following key layers:

1. **Entrypoint (`src/index.ts`)**: Initializes the bot, handles connection updates, auth states (via `auth/`), and event listeners.
2. **Handlers (`src/handlers/`)**: Dispatches commands, manages group events, wraps raw WhatsApp messages into a parsed context, and hosts the **Middleware pipeline** under `src/handlers/middleware/`.
3. **Command System (`src/commands/`)**: Commands are structured dynamically in folders under categories. File names map directly to command triggers.
4. **Infrastructure (`src/infra/`)**: Includes the SQLite database client, individual feature repositories, scrapers, and the task scheduler.
5. **Game Engine (`src/game/`)**: A dedicated engine for running text-based games, loading game questions from JSON files in `src/game/data/games/`.
6. **Utilities (`src/utils/`)**: Helpers, maps, message resolvers, and converters.
7. **Core (`src/core/`)**: Core configurations, loggers, loader, and type definitions.

---

## 2. Directory Visualization (ASCII Tree)

```text
seaavey-bot/
├── .agents/                    # Workspace agent customizations (rules, skills)
├── .github/                    # GitHub Actions CI/CD workflows
├── .githooks/                  # Pre-commit formatting/linting git hooks
├── auth/                       # WhatsApp Multi-File authentication states (Git ignored)
├── data.db                     # SQLite database file (WAL mode enabled)
├── logs/                       # Rotating application log files (Git ignored)
├── src/                        # Main source code directory
│   ├── assets/                 # Static media assets (e.g., banner.png)
│   ├── commands/               # Dynamic command categories
│   │   ├── download/           # Download & search tools (YT, IG, soundcloud, pinterest, etc.)
│   │   ├── economy/            # Currency/Shop game commands
│   │   ├── fun/                # Jokes, ship, rate, wyr, anonymous, etc.
│   │   ├── game/               # In-game control commands (akinator, family100, trivia, etc.)
│   │   ├── general/            # General bot (menu, ping, status) & productivity (todo, afk, remind)
│   │   ├── group/              # Group admin & configuration commands (kick, promote, welcome)
│   │   ├── media/              # Media utility & converter tools (sticker, toimg, removebg, upscale)
│   │   ├── owner/              # Bot owner administrative controls
│   │   └── tools/              # Calculator, translate, & real-time info (weather, earthquake, npm)
│   ├── core/                   # Shared configurations and loader setup
│   │   ├── config.ts           # Central configuration parsing from env variables
│   │   ├── loader.ts           # Command registry & dynamic file loader
│   │   ├── logger.ts           # Logger setup (Pino + Pino Pretty)
│   │   └── types.ts            # Core TypeScript interfaces and type declarations
│   ├── game/                   # Core game engine logic
│   │   ├── __tests__/          # Game engine tests (bun:test)
│   │   ├── data/               # Static game data folder
│   │   │   └── games/          # Static game JSON data files (17+ games)
│   │   ├── game.ts             # Orchestrator class for managing game sessions
│   │   └── word-game-factory.ts # Factory pattern for generating word-based game types
│   ├── handlers/               # Event and message orchestration handlers
│   │   ├── command-dispatcher.ts # Directs parsed message contexts to correct command files
│   │   ├── command-guards.ts   # Guard logic (ownerOnly, groupOnly, privateOnly, cooldowns)
│   │   ├── group-handler.ts    # Welcomes, goodbyes, and group update handlers
│   │   ├── message-handler.ts  # Receives raw messages from Baileys and starts middleware pipeline
│   │   └── middleware/         # Interceptor pipeline for incoming messages
│   │       ├── afk.ts          # AFK state interceptor
│   │       ├── anti-link.ts    # Anti-Group Link invite interceptor
│   │       ├── anti-spam.ts    # Message flood control interceptor
│   │       ├── anti-viewonce.ts # Auto-forward deleted view-once messages
│   │       ├── auto-reply.ts   # Configured auto-responders
│   │       └── game-answer.ts  # Active game message interceptor (checks answers)
│   ├── infra/                  # Shared system components
│   │   ├── client.ts           # Shared SQLite Database client connection
│   │   ├── database.ts         # Central re-exporter for data repositories
│   │   ├── scheduler.ts        # Dynamic background task runner (runs every 30s)
│   │   ├── repositories/       # Isolated business-logic data access objects
│   │   └── scrapers/           # Dynamic scrapers for media downloaders & APIs
│   └── utils/                  # Helper functions and small components
│       ├── convert.ts          # File/buffer format converters (ffmpeg, etc.)
│       ├── helper.ts           # Clean text formatting, number parsing, etc.
│       └── message-resolver.ts # Normalizer for Baileys complex message object structure
└── tsconfig.json               # strict TypeScript configurations (strict, verbatimModuleSyntax)
```

---

## 3. Directory Analysis

### `src/commands/`

Contains subfolders corresponding to categories (e.g., `download`, `group`, `economy`). Each `.ts` file inside these directories represents an individual command.

- **Rules**:
  - Dynamic Loading: The loader reads `src/commands/**/*.ts` and automatically adds the file name (excluding extension) as a command trigger.
  - No nested subdirectories beyond category level.

### `src/handlers/middleware/`

Contains message interceptors executed in a sequence. The pipeline must yield either `"next"` (continue to next middleware or command dispatcher) or `"stop"` (suppress execution).

- **Sequential Execution Order**:
  1.  `anti-viewonce.ts`
  2.  `anti-link.ts`
  3.  `anti-spam.ts`
  4.  `afk.ts`
  5.  `game-answer.ts`
  6.  `auto-reply.ts`

### `src/infra/repositories/`

Directly implements SQLite queries and table initializations. Rather than using an ORM, the project uses inline SQL commands.

- **Inline Migrations**: Table schemas are initialized directly inside each repository script. Any updates to column structures should use the `safeMigrate` helper exported from `@/infra/client`.

---

## 4. File Placement & Naming Conventions

### File Naming Style

- **Commands**: All command file names must be strictly lowercase (e.g., `ping.ts`, `toimg.ts`, `ytmp3.ts`). If multiple words, avoid camelCase or snake_case, prefer compact lowercasing or kebab-case (e.g., `addlevel.ts` or `removebg.ts`) because file names represent commands that users type.
- **Middlewares**: Kebab-case naming (e.g., `anti-link.ts`, `anti-viewonce.ts`, `game-answer.ts`).
- **Repositories**: Suffix with `-repo.ts` (e.g., `user-repo.ts`, `economy-repo.ts`).
- **Scrapers**: General scraper script naming (e.g., `akinator.ts`, `youtube.ts`).
- **General source code**: kebab-case or camelCase depending on standard usage, but kebab-case is preferred.

### TypeScript and Imports

- **verbatimModuleSyntax**: The TypeScript configuration enforces strict imports. You **must use `import type`** when importing types/interfaces only.
  ```typescript
  import type { WAMessage } from "baileys";
  ```
- **Path Aliasing**: Always use path alias `@/` instead of relative parent path loops (`../../`).
  ```typescript
  import db from "@/infra/client"; // Correct
  import db from "../../infra/client"; // Incorrect
  ```

---

## 5. Coding Templates

### Template: New Command (`src/commands/<category>/<name>.ts`)

```typescript
import { defineCommand } from "@/core/types";

export default defineCommand({
  name: "CommandName",
  alias: ["cmdalias"],
  description: "Short command description",
  cooldown: 5000, // Optional: time in ms
  groupOnly: false, // Optional
  ownerOnly: false, // Optional
  handler: async (sock, msg, args) => {
    // msg contains utility functions like reply()
    await msg.reply("Command executed successfully!");
  },
});
```

### Template: New Repository (`src/infra/repositories/<name>-repo.ts`)

```typescript
import db, { safeMigrate } from "@/infra/client";

// Inline table initialization
db.run(`
  CREATE TABLE IF NOT EXISTS sample_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE,
    value TEXT
  )
`);

// Example Migration
safeMigrate("ALTER TABLE sample_table ADD COLUMN description TEXT");

export function getSampleValue(key: string): string | null {
  const row = db.query("SELECT value FROM sample_table WHERE key = ?").get(key) as {
    value: string;
  } | null;
  return row?.value ?? null;
}

export function setSampleValue(key: string, value: string) {
  db.run(
    "INSERT INTO sample_table (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value",
    [key, value],
  );
}
```

### Template: New Middleware (`src/handlers/middleware/<name>.ts`)

```typescript
import type { MessageMiddleware } from "@/handlers/message-context";

export const sampleMiddleware: MessageMiddleware = async (ctx) => {
  const { parse } = ctx;

  // Guard condition
  if (!parse.body.includes("bad-word")) {
    return "next";
  }

  // Intercept and stop propagation
  await ctx.sock.sendMessage(parse.jid, { text: "⚠️ Mind your language!" });
  return "stop";
};
```

---

## 6. Structure Enforcement

This directory layout is strictly validated before any commit.

- **Formatting Check**: Run `bun run format` to automatically format all files using Prettier rules defined in `.prettierrc`.
- **Linting & Typing Check**: Run `bun run lint` to execute ESLint rules (ensuring no explicit `any`, resolving unused variables, and confirming strict TypeScript checks are passing).

---

_Last updated: 2026-07-02_

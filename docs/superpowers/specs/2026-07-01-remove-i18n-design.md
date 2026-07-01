# Specification: Remove i18n and Inline Natural English Text

This document outlines the design and implementation plan to completely remove the multi-language (i18n) translation system from SeaaveyBot and inline all user-facing messages as natural English text directly in the code files.

## Background and Motivation

SeaaveyBot currently uses a multi-language setup with a `t()` translation helper, `src/core/translations.ts`, and JSON translation dictionaries in `src/data/lang/` (for Indonesian and English). 

The i18n configuration makes the codebase more complex than necessary. To simplify maintenance, we will:
- Standardize all bot text to English.
- Remove the configuration options for switching languages.
- Replace all translation helper calls in the command and middleware files with natural, conversational English strings.

## Refactoring Design

### 1. Configuration Cleanup
- Remove the `LANG` environment variable from the `.env` and `.env.example` files.
- Remove the `lang` property from the `Config` interface and object in `src/core/config.ts`.

### 2. Removal of i18n Modules
- Delete the translation module at [translations.ts](file:///home/seaavey/Projects/seaavey-bot/src/core/translations.ts).
- Delete the entire directory [lang](file:///home/seaavey/Projects/seaavey-bot/src/data/lang) containing translation files.

### 3. Inlining and Rewriting Messages
Every instance of the `t(...)` helper function in the codebase will be replaced by a raw string or template literal containing natural English.
- Simple keys: `t("guard.disabled")` becomes `"This feature is disabled."`
- Parameterized keys: `t("guard.cooldown", { seconds: remaining })` becomes `` `Please wait ${remaining} seconds before using this command again.` ``
- Remove `import { t } from "@/core/translations";` from every file.

To write these messages naturally, we will avoid robotic translations and formulate them to sound friendly, clear, and human. Emojis will be used selectively and not excessively.

## Automated Migration Strategy

Because there are over 200 files utilizing the translation helper, we will write a migration script at `/home/seaavey/.gemini/antigravity-cli/brain/d13342d1-43d3-4012-a26b-9e14b3717083/scratch/migrate.ts` to parse files and perform replacements.

The script will:
- Read a key-value mapping of all translation keys to their newly rewritten, natural English equivalents.
- Traverse all TypeScript files in `src/`.
- Replace imports of `t` from `@/core/translations`.
- Replace calls to `t()` using AST manipulation or carefully validated regular expressions that match both static strings and parameter objects, rewriting them to string or template literals.

## Verification Plan

1. **Lint and Type Check**: Run `bun run lint` (which runs ESLint and `tsc --noEmit`). This will catch any syntax issues, invalid variables inside the inlined template literals, or orphaned `t` imports.
2. **Format**: Run `bun run format` to clean up file styling after edits.
3. **Tests**: Run `bun test` to ensure that all game logic and command processing tests pass.

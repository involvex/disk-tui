# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project

- Name: `@involvex/disk-tui`
- Description: A modern CLI/TUI app built with Ink and Bun to display disk information.
- Language: TypeScript (strict-ish, Bun types)
- Runtime: Bun (dev/build), Node >= 16 (runtime target)
- Framework: React + Ink (TUI), meow (CLI flags)

## Commands

- `bun run dev` — hot reload dev
- `bun run start` — run source
- `bun run build` — runs `prebuild` (format, lint:fix, typecheck) then bundles `src/cli.tsx` -> `dist/cli.js`
- `bun run lint` — `eslint src`
- `bun run lint:fix` — `eslint src --fix`
- `bun run format` — `bun fmt`
- `bun run typecheck` — `bun check`
- `bun test` — tests

## Conventions

- ESM (`"type": "module"`). Use `.js` extensions in relative imports (TS resolves to `.tsx`/`.ts`).
- Components are default-exported React components under `src/commands` and `src/components`.
- Disk data gathering lives in `src/lib/disk-info.ts`; keep platform logic there.
- Prefer Ink primitives (`Box`, `Text`) for UI; avoid raw console output in components.
- Run format + lint + typecheck before declaring work done (see `prebuild`).

## Structure

```
src/cli.tsx        # entry point + meow flags
src/app.tsx        # screen router
src/commands/      # screen components
src/components/    # reusable UI
src/lib/           # disk info + helpers
```

## Notes for agents

- Do not commit/push without explicit user permission.
- Verify builds/tests pass before claiming completion.
- Keep changes minimal and aligned with existing patterns.
- Use absolute paths when editing.

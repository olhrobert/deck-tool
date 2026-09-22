# Agents

Instructions for AI agents working in this codebase.

## Stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind v4
- shadcn on Radix (`radix-vega` style), Lucide icons
- pnpm as package manager

## Verification

Always run `pnpm verify` before declaring work complete. It runs lint, typecheck, tests, and a production build. The build uses `NEXT_BUILD_DIR=.next-build` so it won't interfere with a running dev server.

None of that renders a pixel. For anything user-facing, load the page as well — a self-referential CSS variable, a `<symbol>` sprite that draws nothing, and a dynamic `require` that only fails at request time all pass the gate.

Tests are `src/**/*.test.mts`, run by Node's built-in runner (`pnpm test`). No framework. Use them for pure modules; exercise filesystem and network paths through the running app.

## Local only

This app reads and writes the repo working tree and shells out to `scripts/`. It cannot be deployed. Read `docs/architecture.md` before adding anything that touches data.

## File conventions

- `src/components/ui/` — shadcn registry files. **Do not edit.** Two exceptions are marked `NOT stock`: `sidebar.tsx` (TooltipProvider) and `use-mobile.ts` (state init). Check these after `shadcn add --overwrite`.
- `src/components/layout/` — app shell components (sidebar, header, breadcrumb, page header).
- `src/components/` — put new feature components in their own subdirectories here.
- `src/data/` — static data (nav tree, etc.).
- `src/lib/` — shared utilities.
- `src/hooks/` — custom React hooks.
- `docs/rules/` — design and implementation rules. Read `docs/rules/app-shell.md` before touching the shell.

## Shell rules (summary)

- Every toolbar control is `h-9`.
- One filled button per screen — it is the commit action. Everything else is outline or ghost.
- The top bar holds the breadcrumb and app-wide actions only. Page titles go in the page header.
- Editor surfaces get their own toolbar instead of the page header.
- Sentence case everywhere.
- Tags are labels, not buttons — never give a non-interactive element a button silhouette.
- Table actions go in the last column, as a dropdown menu when there are several.

## Nav tree

The sidebar nav tree is in `src/data/sidebar-data.tsx`. Routes that don't exist yet are marked `locked: true` — they render visible but disabled. Keep them; the information architecture should be legible before the features ship.

## Common gotchas

- shadcn primitives set inherited text-layout properties (`whitespace-nowrap`, `gap-2`, `inline-flex`). When layout looks wrong inside a primitive, measure the DOM rather than guessing at the CSS.
- `flex-1` without `min-w-0` silently disables `truncate` on descendants.
- A vertical `Separator` has no height of its own — it is `data-vertical:self-stretch`. Giving it `h-4` without `!self-center` leaves a stub hanging from the top of the row.
- `content-start` on a wrapping flex row only packs lines, not items within a line — also add `items-start`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

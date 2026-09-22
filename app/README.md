# Deck Tool app

Web UI for the Deck Tool presentation system. Next.js 16, React 19, Tailwind v4, shadcn (Radix).

## Getting started

```bash
pnpm install
cp .env.example .env.local   # optional: logo.dev keys
pnpm dev
```

This is a local tool — it reads and writes the repository working tree and runs
the Node scripts in `../scripts`. It cannot be deployed. See
[docs/architecture.md](docs/architecture.md).

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Start dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Serve production build |
| `pnpm lint` | ESLint |
| `pnpm test` | Node's built-in test runner over `src/**/*.test.mts` |
| `pnpm typecheck` | TypeScript check (`tsc --noEmit`) |
| `pnpm verify` | Full gate: lint + typecheck + test + build (into `.next-build` so it doesn't clobber a running dev server) |

## Project structure

```
src/
  app/
    (admin)/          admin shell route group
      layout.tsx      sidebar + header chrome (reads cookie for sidebar state)
      page.tsx        home page
    layout.tsx        root layout (fonts, globals)
    globals.css       Tailwind + shadcn tokens
  components/
    layout/           shell components (admin-shell, app-sidebar, header, etc.)
    ui/               shadcn registry components — do not edit directly
  data/
    sidebar-data.tsx  nav tree definition
  hooks/
    use-mobile.ts     mobile breakpoint hook (patched)
  lib/
    utils.ts          cn() helper
docs/
  rules/
    app-shell.md      shell design rules
```

## Adding shadcn components

```bash
pnpm dlx shadcn@latest add <component>
```

Components land in `src/components/ui/`. Keep that directory unmodified — put custom compositions in `src/components/layout/` or other directories.

Two registry files have been patched and are marked with `NOT stock` comments:
- `src/components/ui/sidebar.tsx` — TooltipProvider wrapper
- `src/hooks/use-mobile.ts` — state initializer fix

Check these after any `shadcn add --overwrite`.

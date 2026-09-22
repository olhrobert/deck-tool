# Deck Tool app

Local web UI for brands and decks. Next.js 16, React 19, Tailwind v4, shadcn (Radix). Front end for the repository working tree — not deployable.

## Getting started

From the **repo root**:

```bash
cd app
pnpm install
cp .env.example .env.local   # optional: logo.dev keys
pnpm dev
```

Or `.conductor/run.sh` from the repo root. Open [http://localhost:3000](http://localhost:3000).

It reads and writes `../brands`, `../decks`, and `../presets`, and runs the Node scripts in `../scripts`. See [docs/architecture.md](docs/architecture.md), [../docs/decks.md](../docs/decks.md), and [../docs/brands.md](../docs/brands.md).

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
    (admin)/          admin shell (brands, decks)
      layout.tsx      sidebar + header chrome
      brands/         list / view / edit / create
      decks/          list / view / edit / compile
    repo/[...path]/  read-only GET of allowlisted repo trees
    layout.tsx        root layout (fonts, globals)
    globals.css       Tailwind + shadcn tokens
  components/
    layout/           shell components
    ui/               shadcn registry components — do not edit directly
  data/
    sidebar-data.tsx  nav tree (Presets / Settings locked until built)
  lib/
    brands.ts         brand-settings.json I/O
    brand-tokens.ts   flatten + live contrast
    decks.ts          decks + presets
    slide-preview.ts  viewer template for thumbs
    color.ts          colour maths
    …                 logo.dev, svg helper, repo paths
docs/
  architecture.md
  plans/              brands.md, decks.md
  rules/
    app-shell.md
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

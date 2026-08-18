# Figma library

HTML is the source of truth. This Figma file is the publish target:

[Test](https://www.figma.com/design/0jCUSNx7OCEe9eUhlhMPsU/Test) (`fileKey`: `0jCUSNx7OCEe9eUhlhMPsU`)

Machine-readable IDs and property names: [`figma/library.json`](../figma/library.json). Resolve nodes by `dsb` shared plugin data keys at runtime; IDs in the JSON are a cache.

## Architecture

| Collection | Modes | Role |
|---|---|---|
| Primitives | one per brand (Riverton today) | Raw brand values, scopes `[]` |
| Color | `Value` | Semantic aliases (`color/text-strong`, `color/slide-bg`, …) |
| Spacing | `Value` | `spacing/0` … `spacing/40`, plus `0-25`, `0-5`, `1-5`, `2-5` |
| Radius | `Value` | including `radius/card`, `radius/alert` |
| Typography | `Value` | size / weight / family tokens |

A new brand is a new Primitives **mode**, then set that mode on the deck page. Color aliases follow the selected primitive mode.

Text styles in the file are Riverton-shaped (Fraunces + Inter). Vantage HTML uses DM Sans. Decide font-family variables vs per-brand text styles before pushing a second brand.

## Creation API

Figma REST cannot create nodes. Use MCP `use_figma` (`plugin-figma-figma`) with `skillNames`: `figma-use,figma-generate-library` (add `figma-generate-design` when assembling slides).

Never parallelize `use_figma`. `setCurrentPageAsync` at most once per script. Always `return` created/mutated IDs.

## Plugin rules

- Colors are 0–1, not 0–255
- `figma.notify()` throws — skip it
- `setSharedPluginData("dsb", …)`, not `setPluginData`
- Load fonts before any text mutate. Fraunces 600 = `SemiBold`; Inter 600 = `Semi Bold`
- `layoutSizingHorizontal/Vertical` only after the node is in an auto-layout parent
- Header / Content / Footer slots must be `FILL` (horizontal; Content also vertical). Hugging slots collapse nested FILL children
- Do not `remove()` children of a **nested** instance slot. Edit attribution copy on a top-level instance, then reparent
- Do not `await` between `createInstance()` and reading nested text — node refs go stale
- Cover/title slides: **do not** instance `Slide`. Custom padding (`p-20 pb-4`) does not match chrome
- Quick Fact Card does **not** nest Card. Figma cannot set text property refs on layers inside a nested instance
- `width="fill|hug"` is instance `layoutSizing*`, not a variant
- CSS vs Figma defaultVariant (setter is read-only): Card CSS `md/md`, Figma `sm/sm`; Slide Title CSS `md`, Figma `lg`. Always set variants explicitly
- Failed `use_figma` scripts are atomic — retry the whole script

## Refreshing `library.json`

Dump keys with `use_figma`: walk `COMPONENT` / `COMPONENT_SET`, local variables, and text styles; read `getSharedPluginData("dsb", "key")`. Update IDs when the file is rebuilt.

# Push-to-Figma reference

## Component keys

| IR `component` | Notes |
|---|---|
| `componentset/slide` | 1280×800. Nested Header HUG / Content FILL / Footer HUG. Slots named `Slot` |
| `componentset/slide-title` | Set `size` every time. CSS default `md`, Figma `lg` |
| `componentset/section-title` | CSS default `md`; decks often use `lg` |
| `component/quick-fact-card` | Standalone. Never nest inside a Card instance |
| `componentset/card` | Set `padding` and `gap`. CSS default `md/md`, Figma `sm/sm` |
| `componentset/attribution-box` | Slot content is not a TEXT property |
| `componentset/list-item` | `kind` picks Check vs Close (no INSTANCE_SWAP on unpublished icons) |
| `component/logo-{brand}` | Scale from viewBox. Cover height 24; footer 16 unless HTML `style="height: …"` says otherwise |

## Plugin traps

- Colors 0–1. No `figma.notify()`. No `loadAllPagesAsync` / `createImageAsync` / `setPluginData`
- `setSharedPluginData("dsb", key, value)`
- Load fonts before text mutate, including every family in every Primitives mode before binding `fontFamily`. Fraunces bold = `SemiBold`; Inter bold = `Semi Bold`. Bind weight as FLOAT (`fontWeight`), not `fontStyle` strings
- No text styles. IR `typography` → bind `fontFamily` / `fontWeight` / `fontSize`. `lineheight/md` is CSS × 100; apply as `{ unit: "PERCENT", value: 120 }` (Figma FLOAT vars on lineHeight/letterSpacing are pixels)
- `layoutSizing*` only after the node is in an auto-layout parent
- Header/Content/Footer **slots** must FILL; hugging slots collapse nested FILL children to ~100px
- Nested instance `remove()` on slot children throws `Node … not found`. Mutate top-level, then reparent
- `await` invalidates instance text node refs. Re-fetch by id after any await
- `use_figma` failures are atomic — fix and rerun the whole script
- One `setCurrentPageAsync` per script; never parallel `use_figma`
- Cannot add children to an instance except into slots
- Cover HTML uses `p-20 pb-4` — Slide chrome padding does not match

## Slot fill

```js
function slotOf(inst) {
  const s = inst.findAllWithCriteria({ types: ["SLOT"] })[0];
  if (!s) throw new Error("No slot on " + inst.name);
  return s;
}
function clearSlot(slot) {
  for (const child of [...slot.children]) child.remove();
}
```

`clearSlot` is safe on Header/Content/Footer slots of a Slide instance (one level). It is **not** safe on Attribution's slot after the instance is nested in the footer.

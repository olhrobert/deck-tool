# Component attributes

One table for size, gap, padding, and variant. Brand tokens pick the actual steps; these are the HTML axes.

## Size

| Element | Attribute | Values | Default |
| --- | --- | --- | --- |
| `<slide-title>` | `size` | `sm` \| `md` \| `lg` | `md` |
| `<cover-title>` | `size` | `sm` \| `md` \| `lg` \| `xl` | `md` |
| `<analyst>` | `size` | `sm` \| `lg` | `lg` |
| `<text>` | `size` | type-scale step (`200`…`4000`) | `400` |
| `<stamp>`, `<media-slot>` | `size` | spacing-scale step (`0`…`40`, `0-5`, …) | stamp: brand default; media-slot: omit |

Do not put `size` on badge, callout title/description, or card/callout padding axes.

## Align

| Element | Attribute | Values | Default |
| --- | --- | --- | --- |
| `<slide-title-group>`, `<slide-title>` | `align` | `left` \| `center` \| `right` | `left` |

Omit `align` for left. Set it on `<slide-title-group>` so pretitles, title, and subtitle share the alignment.

## Orientation

| Element | Attribute | Values | Default |
| --- | --- | --- | --- |
| `<divider>` | `orientation` | `vertical` | omit (horizontal) |

Omit `orientation` for a full-width hairline. Set `orientation="vertical"` in a row stack so the rule stretches to the row height.

## Gap

| Element | Attribute | Values | Default when omitted |
| --- | --- | --- | --- |
| `<stack>` | `gap` | spacing-scale step (`0`…`40`, `0-5`, …) | `4` |
| `<card>` | `gap` | `none` \| `sm` \| `md` \| `lg` | `sm` |
| `<callout>` | `gap` | `none` \| `sm` \| `md` \| `lg` | `sm` |

`<stack>` `wrap="true"` lets row children wrap (analyst tags).

## Padding

| Element | Attribute | Values | Default when omitted |
| --- | --- | --- | --- |
| `<card>` | `padding` | `sm` \| `md` \| `lg` \| `xl` | `md` (`components.card.padding`) |
| `<callout>` | `padding` | `sm` \| `md` \| `lg` | `md` (`components.callout.padding`) |
| `<media-slot>` | `padding` | `none` \| `sm` \| `md` \| `lg` | `md` |

`<media-slot>` `border="false"` drops the well stroke. Default stroke is `--card-neutral-border-subtle` (follows `color-theme`). `radius="none"` squares the corners. `size` is a spacing-scale square (analyst logo: `size="10"` on lg, `size="7"` on sm).

## Variant

| Element | `variant` | Notes |
| --- | --- | --- |
| `<card>`, `<analyst>`, `<media-card>`, `<badge>`, `<stamp>` | `neutral` \| `emphasis` \| `positive` \| `warning` \| `negative` \| `informative` | Default `neutral`. |
| `<callout>` | `neutral` \| `positive` \| `warning` \| `negative` \| `informative` | No `emphasis`. |

Paint follows inherited `color-theme` (`light` \| `dark`). Card `layout="basic|stripe"` is omitted so `components.card.defaultLayout` applies.

## Fill / hug

`width="fill|hug"` and `height="fill|hug"` work on `card`, `analyst`, `media-card`, `callout`, `badge`, `attribution-box`, `slide-footer`, `stack`, `media-slot`, and `img`. They are independent axes: `width` is horizontal only, `height` is vertical only. Omit both to hug.

Row `<stack>` hugs children’s height. Set `height="fill"` on a child (media well) to stretch it. Nested stacks do not auto-share a row — set `width="fill"` on each child that should. Column stacks stretch children so copy wraps; `width="fill"` in a column does not grow height. Images use `object-fit: cover`.

# Component attributes

One table for size, gap, padding, and variant. Brand tokens pick the actual steps; these are the HTML axes.

## Size

| Element | Attribute | Values | Default |
| --- | --- | --- | --- |
| `<body-copy>`, `<paragraph-title>`, `<slide-title>` | `size` | `sm` \| `md` \| `lg` | `md` |
| `<cover-title>` | `size` | `sm` \| `md` \| `lg` \| `xl` | `md` |
| `<text>` (attribution) | `size` | type-scale step (`200`…`4000`) | `400` |
| `<stamp>` | `size` | spacing-scale step (`0`…`40`, `0-5`, …) | brand `stamp.defaultSize` |

Do not put `size` on badge, callout title/description, or card/callout padding axes.

## Gap

| Element | Attribute | Values | Default when omitted |
| --- | --- | --- | --- |
| `<stack>` | `gap` | `none` \| `sm` \| `md` \| `lg` | `md` |
| `<card>` | `gap` | `none` \| `sm` \| `md` \| `lg` | `sm` |
| `<callout>` | `gap` | `none` \| `sm` \| `md` \| `lg` | `sm` |

`<stack>` has no `gap="0"` alias — use `none`.

## Padding

| Element | Attribute | Values | Default when omitted |
| --- | --- | --- | --- |
| `<card>` | `padding` | `sm` \| `md` \| `lg` | `md` (`components.card.padding`) |
| `<callout>` | `padding` | `sm` \| `md` \| `lg` | `md` (`components.callout.padding`) |

## Variant

| Element | `variant` | Notes |
| --- | --- | --- |
| `<card>`, `<badge>`, `<stamp>` | `neutral` \| `emphasis` \| `positive` \| `warning` \| `negative` \| `informative` | Default `neutral`. |
| `<callout>` | `neutral` \| `positive` \| `warning` \| `negative` \| `informative` | No `emphasis`. |

Paint follows inherited `color-theme` (`light` \| `dark`). Card `layout="basic|stripe"` is omitted so `components.card.defaultLayout` applies.

## Fill / hug

`width="fill|hug"` and `height="fill|hug"` work on `card`, `callout`, `badge`, `attribution-box`, `slide-footer`, `stack`, `media-slot`, and `img`. Column stacks (`direction="col"`) grow `height="fill"` children. Images use `object-fit: cover`.

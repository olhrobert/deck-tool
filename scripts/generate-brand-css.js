#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const BRAND_FILENAME = "brand-settings.json";
const OUTPUT_FILENAME = "brand.css";

function isCssFontWeight(value) {
	const n = Number(value);
	return Number.isInteger(n) && n >= 100 && n <= 900 && n % 100 === 0;
}

const FONT_WEIGHT_NAMES = ["regular", "medium", "bold"];
const FONT_WEIGHT_NAME_SET = new Set(FONT_WEIGHT_NAMES);

function isFontWeightName(value) {
	return FONT_WEIGHT_NAME_SET.has(String(value));
}

const FONT_FAMILY_NAMES = ["display", "base"];
const FONT_FAMILY_NAME_SET = new Set(FONT_FAMILY_NAMES);

function isFontFamilyName(value) {
	return FONT_FAMILY_NAME_SET.has(String(value));
}

/**
 * Maps brand-settings.json fields to CSS custom properties. This is the single
 * source of truth for which design-system globals a brand is allowed to override.
 * Each entry is a [dotted brand-settings.json path, --css-variable] pair.
 * Anything not listed here stays a shared design-system default (type scale,
 * global spacing scale, etc.).
 *
 * Font *named families* (`font.family.display|base`) are CSS stacks.
 * Role families (`cover.title.family`, `body.family`, …) name one of those
 * two. Font *named weights* (`font.weight.regular|medium|bold`) are CSS numbers
 * (400, 500, 600, 700, …) matching `@font-face` in design-system/tokens/fonts.css.
 * Role weights (`slide.title.weight`, `card.title.weight`, …) and `<text weight>`
 * name one of those three. Font *sizes* are type-scale steps (800, 600, 400, …)
 * from design-system/tokens/typography.css — not pixel values.
 * Semantic *spacing* is a spacing-scale step (20, 16, "0-5", …) from
 * design-system/tokens/spacing.css — not pixel values.
 * `slide.canvas.maxWidth` is a pixel integer (default 1280) — the slide canvas cap.
 * Component *radius* names a `border.radius` step (`med`, `none`, …).
 * Component *stroke* names a `border.size` step (`none`, `sm`, `md`, `lg`).
 *
 * Cover and slide settings live under top-level `cover` / `slide` (colors,
 * type, chrome), nested by group (`cover.canvas.background`,
 * `cover.surface.background`, `slide.pretitle.family`,
 * `slide.header.paddingLeft`). Top-level groups, in
 * order: `foundations` (`basic`, `color`, `tone`, `font`, `border`) then
 * `components` (`cover`, `slide`, `paragraphTitle`, `body`, `stack`,
 * `card`, `callout`). Hard-coded RGB lives on `foundations.color` (`brand.1`–
 * `brand.6`, `semantic.positive`…, `chart.1`–`chart.4`). `semantic.neutral`
 * / `semantic.bright` may ref `brand.*`. `foundations.tone` is Strong / Base /
 * Subtle opacity. Card paint and cover/slide roles ref that palette
 * (`"semantic.positive"` or `{ "color": "brand.1", "opacity": 0.18 }`).
 * Card and callout paint are grouped by role (`card.foreground.{family}`,
 * `callout.background.{family}`, `card.stripe.color.{family}`); CSS vars stay
 * family-leading (`--card-positive-quiet-foreground`,
 * `--callout-neutral-quiet-stripe`). Callout has no emphasis axis, so its
 * families are quiet-only. Remaining component tokens are grouped by component
 * (`card`, `callout`, …) and named component-leading
 * (`--slide-pretitle-font-family`). TOKEN_MAP order is the brand.css order.
 */
const TYPE_SCALE_STEPS = [
	"4000",
	"3400",
	"3000",
	"2400",
	"2000",
	"1600",
	"1200",
	"1000",
	"800",
	"700",
	"600",
	"550",
	"500",
	"450",
	"400",
	"350",
	"300",
	"275",
	"250",
	"225",
	"200",
];
const TYPE_SCALE_STEP_SET = new Set(TYPE_SCALE_STEPS);

function isTypeScaleStep(value) {
	return TYPE_SCALE_STEP_SET.has(String(value));
}

const SPACING_SCALE_STEPS = [
	"0",
	"0-25",
	"0-5",
	"1",
	"1-5",
	"2",
	"2-5",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9",
	"10",
	"11",
	"12",
	"13",
	"14",
	"15",
	"16",
	"17",
	"18",
	"19",
	"20",
	"21",
	"22",
	"23",
	"24",
	"25",
	"26",
	"27",
	"28",
	"29",
	"30",
	"31",
	"32",
	"33",
	"34",
	"35",
	"36",
	"37",
	"38",
	"39",
	"40",
];
const SPACING_SCALE_STEP_SET = new Set(SPACING_SCALE_STEPS);

function isSpacingScaleStep(value) {
	return SPACING_SCALE_STEP_SET.has(String(value));
}

function isFontSizePath(jsonPath) {
	return (
		/\.(size|sizeLg|sizeMd|sizeSm)$/.test(jsonPath) ||
		/(pretitle|title|subtitle|description|text)Size(Lg|Md|Sm)?$/.test(
			jsonPath,
		)
	);
}

function isSpacingStepPath(jsonPath) {
	return (
		/\.(padding|gap)\.(none|sm|md|lg)$/i.test(jsonPath) ||
		/\.padding(Top|Right|Bottom|Left)$/i.test(jsonPath) ||
		/\.title\.gap$/i.test(jsonPath) ||
		jsonPath === "components.slideFooter.gap" ||
		jsonPath === "components.slideFooter.logoHeight" ||
		/(padding(Sm|Md|Lg)|gap(Sm|Md|Lg)|metaPaddingTop|titleGap)$/i.test(
			jsonPath,
		)
	);
}

function isFontNamedFamilyPath(jsonPath) {
	return /^foundations\.font\.family\.(display|base)$/.test(jsonPath);
}

function isFontRoleFamilyPath(jsonPath) {
	if (jsonPath.startsWith("foundations.font.family.")) return false;
	return (
		jsonPath.endsWith(".family") ||
		/(title|pretitle|subtitle)Family$/.test(jsonPath)
	);
}

function isFontNamedWeightPath(jsonPath) {
	return /^foundations\.font\.weight\.(regular|medium|bold)$/.test(jsonPath);
}

function isFontRoleWeightPath(jsonPath) {
	if (jsonPath.startsWith("foundations.font.weight.")) return false;
	return (
		jsonPath.endsWith(".weight") ||
		/(title|pretitle|subtitle)Weight$/.test(jsonPath)
	);
}

const BORDER_RADIUS_STEPS = ["none", "sm", "med", "lg", "full"];
const BORDER_RADIUS_STEP_SET = new Set(BORDER_RADIUS_STEPS);

function isBorderRadiusStep(value) {
	return BORDER_RADIUS_STEP_SET.has(String(value));
}

function isBorderRadiusRolePath(jsonPath) {
	return (
		(jsonPath.endsWith(".borderRadius") ||
			jsonPath.endsWith(".border.radius")) &&
		!jsonPath.startsWith("foundations.border.radius.")
	);
}

const BORDER_SIZE_STEPS = ["none", "sm", "md", "lg"];
const BORDER_SIZE_STEP_SET = new Set(BORDER_SIZE_STEPS);

function isBorderSizeStep(value) {
	return BORDER_SIZE_STEP_SET.has(String(value));
}

function isBorderSizeRolePath(jsonPath) {
	return (
		jsonPath === "components.callout.stripe.width" ||
		jsonPath === "components.card.stripe.width" ||
		/\.borderSize\.(top|bottom|left|right)$/.test(jsonPath) ||
		/\.border\.size(Top|Bottom|Left|Right)$/.test(jsonPath)
	);
}

function isPixelDimensionPath(jsonPath) {
	return jsonPath === "components.slide.canvas.maxWidth";
}

function isPixelDimension(value) {
	const n = Number(value);
	return Number.isInteger(n) && n > 0;
}

function isPretitleUppercasePath(jsonPath) {
	return (
		jsonPath.endsWith(".pretitle.uppercase") ||
		jsonPath.endsWith(".pretitleUppercase")
	);
}

function isPretitleUppercaseBoolean(value) {
	return typeof value === "boolean";
}

function isPretitleLetterSpacingPath(jsonPath) {
	return (
		jsonPath.endsWith(".pretitle.letterSpacing") ||
		jsonPath.endsWith(".pretitleLetterSpacing")
	);
}

function isPretitleLetterSpacing(value) {
	return typeof value === "string" && /^\d+(\.\d+)?%$/.test(value);
}

const CARD_LAYOUT_NAMES = ["basic", "stripe"];
const CARD_LAYOUT_NAME_SET = new Set(CARD_LAYOUT_NAMES);

function isCardLayoutPath(jsonPath) {
	return jsonPath === "components.card.defaultLayout";
}

function isCardLayoutName(value) {
	return CARD_LAYOUT_NAME_SET.has(String(value));
}

function isBadgeBorderPath(jsonPath) {
	return jsonPath === "components.badge.border";
}

function isBadgeBorderBoolean(value) {
	return typeof value === "boolean";
}

const CARD_STRIPE_LAYOUT_CSS = [
	'card:not([layout="basic"]) {',
	"	border-color: var(--_card-stripe);",
	"	border-top-width: var(--border-size-none);",
	"	border-bottom-width: var(--border-size-none);",
	"	border-right-width: var(--border-size-none);",
	"	border-left-width: var(--card-stripe-width);",
	"	border-radius: var(--border-radius-none);",
	"}",
].join("\n");

const BRAND_SWATCH_INDICES = ["1", "2", "3", "4", "5", "6"];
const CHART_SWATCH_INDICES = ["1", "2", "3", "4"];
const BRAND_SWATCH_KEYS = BRAND_SWATCH_INDICES.map((i) => `brand.${i}`);
const CHART_SWATCH_KEYS = CHART_SWATCH_INDICES.map((i) => `chart.${i}`);
const SEMANTIC_HUE_KEYS = [
	"neutral",
	"bright",
	"positive",
	"negative",
	"warning",
	"informative",
];
const TONE_KEYS = ["strong", "base", "subtle"];
const CARD_STATUS_FAMILY_KEYS = [
	"positiveQuiet",
	"positiveEmphasis",
	"negativeQuiet",
	"negativeEmphasis",
	"warningQuiet",
	"warningEmphasis",
	"informativeQuiet",
	"informativeEmphasis",
];
const SEMANTIC_SWATCH_KEYS = SEMANTIC_HUE_KEYS.map((key) => `semantic.${key}`);
const PALETTE_REF_SET = new Set([
	...BRAND_SWATCH_KEYS,
	...CHART_SWATCH_KEYS,
	...SEMANTIC_SWATCH_KEYS,
]);

function isBrandSwatchPath(jsonPath) {
	return /^foundations\.color\.brand\.[1-6]$/.test(jsonPath);
}

function isChartSwatchPath(jsonPath) {
	return /^foundations\.color\.chart\.[1-4]$/.test(jsonPath);
}

function isSemanticSwatchPath(jsonPath) {
	return new RegExp(
		`^foundations\\.color\\.semantic\\.(${SEMANTIC_HUE_KEYS.join("|")})$`,
	).test(jsonPath);
}

function isTonePath(jsonPath) {
	return new RegExp(`^foundations\\.tone\\.(${TONE_KEYS.join("|")})$`).test(
		jsonPath,
	);
}

function isToneValue(value) {
	return (
		typeof value === "number" &&
		!Number.isNaN(value) &&
		value >= 0 &&
		value <= 1
	);
}

function camelToKebab(value) {
	return String(value)
		.replace(/([a-z])([A-Z])/g, "$1-$2")
		.toLowerCase();
}

function jsonPathToCssVar(jsonPath) {
	return `--${jsonPath.split(".").map(camelToKebab).join("-")}`;
}

function semanticFamilyKey(variant, tone) {
	return `${variant}${tone.charAt(0).toUpperCase()}${tone.slice(1)}`;
}

const SEMANTIC_COLOR_VARIANTS = [
	"neutral",
	"positive",
	"negative",
	"warning",
	"informative",
];
const SEMANTIC_COLOR_TONES = ["quiet", "emphasis"];
const NEUTRAL_COLOR_FAMILY_KEYS = ["neutralQuiet", "neutralEmphasis"];
const CARD_COLOR_FAMILY_KEYS = [
	...NEUTRAL_COLOR_FAMILY_KEYS,
	...CARD_STATUS_FAMILY_KEYS,
];
const CALLOUT_COLOR_FAMILY_KEYS = [
	"neutralQuiet",
	"positiveQuiet",
	"negativeQuiet",
	"warningQuiet",
	"informativeQuiet",
];
const SEMANTIC_COLOR_FAMILY_KEYS = CARD_COLOR_FAMILY_KEYS;
const CARD_FAMILY_GROUP = CARD_COLOR_FAMILY_KEYS.join("|");
const CALLOUT_FAMILY_GROUP = CALLOUT_COLOR_FAMILY_KEYS.join("|");
const CARD_COLOR_PATH = new RegExp(
	`^components\\.card\\.(foreground|background|border\\.subtle|stripe\\.color)\\.(${CARD_FAMILY_GROUP})$`,
);
const CALLOUT_COLOR_PATH = new RegExp(
	`^components\\.callout\\.(foreground|background|stripe\\.color)\\.(${CALLOUT_FAMILY_GROUP})$`,
);

function cardPaintCssLeaf(role) {
	if (role === "subtle") return "border-subtle";
	if (role === "stripe") return "stripe";
	return role;
}

function paintTokenMapEntries({
	component,
	jsonPrefix,
	role,
	groupLabel,
	familyKeys,
	aliasColor = false,
}) {
	const cssLeaf = cardPaintCssLeaf(role);
	return familyKeys.flatMap((family, index) => {
		const jsonPath = `${jsonPrefix}.${family}`;
		const kebab = camelToKebab(family);
		const componentVar = `--${component}-${kebab}-${cssLeaf}`;
		const first =
			index === 0
				? [jsonPath, componentVar, groupLabel]
				: [jsonPath, componentVar];
		if (!aliasColor) return [first];
		return [first, [jsonPath, `--color-${kebab}-${cssLeaf}`]];
	});
}

function cardPaintTokenMapEntries(jsonPrefix, role, groupLabel) {
	return paintTokenMapEntries({
		component: "card",
		jsonPrefix,
		role,
		groupLabel,
		familyKeys: CARD_COLOR_FAMILY_KEYS,
		aliasColor: true,
	});
}

function calloutPaintTokenMapEntries(jsonPrefix, role, groupLabel) {
	return paintTokenMapEntries({
		component: "callout",
		jsonPrefix,
		role,
		groupLabel,
		familyKeys: CALLOUT_COLOR_FAMILY_KEYS,
	});
}

function cardColorTokenMapEntries() {
	return [
		...cardPaintTokenMapEntries(
			"components.card.foreground",
			"foreground",
			"card — foreground",
		),
		...cardPaintTokenMapEntries(
			"components.card.background",
			"background",
			"card — background",
		),
	];
}

function cardBorderColorTokenMapEntries() {
	return cardPaintTokenMapEntries(
		"components.card.border.subtle",
		"subtle",
		"card — border subtle",
	);
}

function cardStripeTokenMapEntries() {
	return [
		[
			"components.card.stripe.width",
			"--card-stripe-width",
			"card — stripe",
		],
		...cardPaintTokenMapEntries(
			"components.card.stripe.color",
			"stripe",
			"card — stripe color",
		),
	];
}

function semanticSwatchTokenMapEntries() {
	return SEMANTIC_HUE_KEYS.map((key, index) => {
		const jsonPath = `foundations.color.semantic.${key}`;
		const cssVar = jsonPathToCssVar(`color.semantic.${key}`);
		if (index === 0) return [jsonPath, cssVar, "color — semantic"];
		return [jsonPath, cssVar];
	});
}

function toneTokenMapEntries() {
	return TONE_KEYS.map((key, index) => {
		const jsonPath = `foundations.tone.${key}`;
		const cssVar = `--tone-${key}`;
		if (index === 0) return [jsonPath, cssVar, "tone"];
		return [jsonPath, cssVar];
	});
}

function isColorLiteralPath(jsonPath) {
	return isBrandSwatchPath(jsonPath) || isChartSwatchPath(jsonPath);
}

function isCardColorPath(jsonPath) {
	return CARD_COLOR_PATH.test(jsonPath);
}

function isCalloutColorPath(jsonPath) {
	return CALLOUT_COLOR_PATH.test(jsonPath);
}

function isColorRolePath(jsonPath) {
	return (
		/^components\.(cover|slide)\.canvas\.(background|foreground)$/.test(
			jsonPath,
		) ||
		/^components\.(cover|slide)\.surface\.(background|foreground|border)$/.test(
			jsonPath,
		)
	);
}

function isBadgeBackgroundPath(jsonPath) {
	return jsonPath === "components.badge.background";
}

function isColorRefPath(jsonPath) {
	return (
		isColorRolePath(jsonPath) ||
		isCardColorPath(jsonPath) ||
		isCalloutColorPath(jsonPath) ||
		isBadgeBackgroundPath(jsonPath) ||
		isSemanticSwatchPath(jsonPath)
	);
}

function isColorLiteral(value) {
	if (typeof value !== "string") return false;
	return (
		/^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)$/i.test(
			value,
		) || /^#[0-9a-f]{6}$/i.test(value)
	);
}

function parseColorChannels(value) {
	if (typeof value !== "string") return null;
	const rgb = value.match(
		/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
	);
	if (rgb) {
		return {
			r: Number(rgb[1]),
			g: Number(rgb[2]),
			b: Number(rgb[3]),
			a: rgb[4] === undefined ? 1 : Number(rgb[4]),
		};
	}
	const hex = value.match(/^#([0-9a-f]{6})$/i);
	if (hex) {
		const n = parseInt(hex[1], 16);
		return {
			r: (n >> 16) & 255,
			g: (n >> 8) & 255,
			b: n & 255,
			a: 1,
		};
	}
	return null;
}

function withOpacity(colorValue, opacity) {
	const channels = parseColorChannels(colorValue);
	if (!channels) {
		throw new Error(
			`Cannot apply opacity to non-color value ${JSON.stringify(colorValue)}`,
		);
	}
	if (
		typeof opacity !== "number" ||
		Number.isNaN(opacity) ||
		opacity < 0 ||
		opacity > 1
	) {
		throw new Error(
			`opacity must be a number between 0 and 1 (got ${JSON.stringify(opacity)})`,
		);
	}
	return `rgba(${channels.r}, ${channels.g}, ${channels.b}, ${opacity})`;
}

function resolvePalettePath(refName) {
	if (PALETTE_REF_SET.has(refName)) {
		return `foundations.color.${refName}`;
	}
	return null;
}

/**
 * Resolve a color role ref against `foundations.color`
 * (`brand.1`, `semantic.positive`, `chart.1`, …).
 * Accepts a raw rgb/rgba/# literal, `"brand.1"` /
 * `"semantic.positive"` / `"chart.1"`, or
 * `{ "color": "semantic.warning", "opacity": 0.1 }`.
 */
function resolveColorRef(brand, raw, jsonPath, depth = 0) {
	if (isColorLiteral(raw)) {
		return raw;
	}

	let refName;
	let opacity;

	if (typeof raw === "string") {
		refName = raw;
	} else if (raw && typeof raw === "object" && !Array.isArray(raw)) {
		refName = raw.color;
		opacity = raw.opacity;
		if (typeof refName !== "string" || refName.trim() === "") {
			throw new Error(
				`${jsonPath} color ref object must include a string "color" (got ${JSON.stringify(raw)})`,
			);
		}
		if (
			opacity !== undefined &&
			(typeof opacity !== "number" || Number.isNaN(opacity))
		) {
			throw new Error(
				`${jsonPath} opacity must be a number between 0 and 1 (got ${JSON.stringify(opacity)})`,
			);
		}
	} else {
		throw new Error(
			`${jsonPath} must be a palette ref string, { "color", "opacity"? }, or rgb()/rgba()/#rrggbb (got ${JSON.stringify(raw)})`,
		);
	}

	const palettePath = resolvePalettePath(refName);
	if (!palettePath) {
		throw new Error(
			`${jsonPath} unknown palette ref "${refName}" (use brand.1–brand.6, chart.1–chart.4, or semantic.neutral / semantic.bright / semantic.positive / …)`,
		);
	}

	const resolved = getPath(brand, palettePath);
	if (resolved === undefined || resolved === null) {
		throw new Error(
			`${jsonPath} references missing palette entry ${palettePath}`,
		);
	}

	let literal;
	if (isColorLiteral(resolved)) {
		literal = resolved;
	} else {
		if (depth >= 8) {
			throw new Error(
				`${jsonPath} color ref cycle or too deep (via ${palettePath})`,
			);
		}
		literal = resolveColorRef(brand, resolved, palettePath, depth + 1);
	}

	if (opacity !== undefined) {
		return withOpacity(literal, opacity);
	}
	return literal;
}

const TOKEN_MAP = [
	["foundations.color.brand.1", "--color-palette-brand-1", "color"],
	["foundations.color.brand.2", "--color-palette-brand-2"],
	["foundations.color.brand.3", "--color-palette-brand-3"],
	["foundations.color.brand.4", "--color-palette-brand-4"],
	["foundations.color.brand.5", "--color-palette-brand-5"],
	["foundations.color.brand.6", "--color-palette-brand-6"],

	...semanticSwatchTokenMapEntries(),

	["foundations.color.chart.1", "--color-palette-chart-1", "color — chart"],
	["foundations.color.chart.2", "--color-palette-chart-2"],
	["foundations.color.chart.3", "--color-palette-chart-3"],
	["foundations.color.chart.4", "--color-palette-chart-4"],

	...toneTokenMapEntries(),

	[
		"foundations.font.family.display",
		"--font-family-display",
		"font — family",
	],
	["foundations.font.family.base", "--font-family-base"],

	[
		"foundations.font.weight.regular",
		"--font-weight-regular",
		"font — weight",
	],
	["foundations.font.weight.medium", "--font-weight-medium"],
	["foundations.font.weight.bold", "--font-weight-bold"],

	[
		"foundations.border.radius.none",
		"--border-radius-none",
		"border — radius",
	],
	["foundations.border.radius.sm", "--border-radius-sm"],
	["foundations.border.radius.med", "--border-radius-med"],
	["foundations.border.radius.lg", "--border-radius-lg"],
	["foundations.border.radius.full", "--border-radius-full"],

	["foundations.border.size.none", "--border-size-none", "border — size"],
	["foundations.border.size.sm", "--border-size-sm"],
	["foundations.border.size.md", "--border-size-md"],
	["foundations.border.size.lg", "--border-size-lg"],

	["components.cover.canvas.background", "--color-cover-background", "cover"],
	["components.cover.canvas.foreground", "--color-cover-foreground"],
	["components.cover.surface.background", "--color-cover-surface-background"],
	["components.cover.surface.foreground", "--color-cover-surface-foreground"],
	["components.cover.surface.border", "--color-cover-surface-border"],
	["components.cover.title.family", "--cover-title-font-family"],
	["components.cover.title.weight", "--cover-title-font-weight"],

	["components.slide.canvas.background", "--color-slide-background", "slide"],
	["components.slide.canvas.foreground", "--color-slide-foreground"],
	["components.slide.canvas.maxWidth", "--slide-max-width"],
	["components.slide.surface.background", "--color-slide-surface-background"],
	["components.slide.surface.foreground", "--color-slide-surface-foreground"],
	["components.slide.surface.border", "--color-slide-surface-border"],
	["components.slide.pretitle.family", "--slide-pretitle-font-family"],
	["components.slide.pretitle.weight", "--slide-pretitle-font-weight"],
	["components.slide.pretitle.uppercase", "--slide-pretitle-text-transform"],
	[
		"components.slide.pretitle.letterSpacing",
		"--slide-pretitle-letter-spacing",
	],
	["components.slide.pretitle.size", "--slide-pretitle-size"],
	["components.slide.title.gap", "--slide-title-gap"],
	["components.slide.title.family", "--slide-title-font-family"],
	["components.slide.title.weight", "--slide-title-font-weight"],
	["components.slide.title.sizeSm", "--slide-title-size-sm"],
	["components.slide.title.sizeMd", "--slide-title-size-md"],
	["components.slide.title.sizeLg", "--slide-title-size-lg"],
	["components.slide.subtitle.family", "--slide-subtitle-font-family"],
	["components.slide.subtitle.weight", "--slide-subtitle-font-weight"],
	["components.slide.subtitle.size", "--slide-subtitle-size"],
	["components.slide.header.paddingTop", "--slide-header-padding-top"],
	["components.slide.header.paddingRight", "--slide-header-padding-right"],
	["components.slide.header.paddingBottom", "--slide-header-padding-bottom"],
	["components.slide.header.paddingLeft", "--slide-header-padding-left"],
	["components.slide.content.paddingTop", "--slide-content-padding-top"],
	["components.slide.content.paddingRight", "--slide-content-padding-right"],
	[
		"components.slide.content.paddingBottom",
		"--slide-content-padding-bottom",
	],
	["components.slide.content.paddingLeft", "--slide-content-padding-left"],
	["components.slide.footer.paddingTop", "--slide-footer-padding-top"],
	["components.slide.footer.paddingRight", "--slide-footer-padding-right"],
	["components.slide.footer.paddingBottom", "--slide-footer-padding-bottom"],
	["components.slide.footer.paddingLeft", "--slide-footer-padding-left"],

	[
		"components.paragraphTitle.family",
		"--paragraph-title-font-family",
		"paragraphTitle",
	],
	["components.paragraphTitle.weight", "--paragraph-title-font-weight"],
	["components.paragraphTitle.sizeSm", "--paragraph-title-size-sm"],
	["components.paragraphTitle.sizeMd", "--paragraph-title-size-md"],
	["components.paragraphTitle.sizeLg", "--paragraph-title-size-lg"],

	["components.body.family", "--body-font-family", "body"],
	["components.body.weight", "--body-font-weight"],
	["components.body.sizeSm", "--body-size-sm"],
	["components.body.sizeMd", "--body-size-md"],
	["components.body.sizeLg", "--body-size-lg"],

	["components.card.defaultLayout", "--card-default-layout", "card"],
	...cardColorTokenMapEntries(),
	["components.card.padding.sm", "--card-padding-sm"],
	["components.card.padding.md", "--card-padding-md"],
	["components.card.padding.lg", "--card-padding-lg"],
	["components.card.gap.none", "--card-gap-none"],
	["components.card.gap.sm", "--card-gap-sm"],
	["components.card.gap.md", "--card-gap-md"],
	["components.card.gap.lg", "--card-gap-lg"],
	["components.card.border.radius", "--card-border-radius"],
	["components.card.border.sizeTop", "--card-border-size-top"],
	["components.card.border.sizeBottom", "--card-border-size-bottom"],
	["components.card.border.sizeLeft", "--card-border-size-left"],
	["components.card.border.sizeRight", "--card-border-size-right"],
	...cardBorderColorTokenMapEntries(),
	...cardStripeTokenMapEntries(),
	["components.card.title.family", "--card-title-font-family"],
	["components.card.title.weight", "--card-title-font-weight"],
	["components.card.title.sizeSm", "--card-title-size-sm"],
	["components.card.title.sizeMd", "--card-title-size-md"],
	["components.card.title.sizeLg", "--card-title-size-lg"],
	["components.card.pretitle.family", "--card-pretitle-font-family"],
	["components.card.pretitle.weight", "--card-pretitle-font-weight"],
	["components.card.pretitle.uppercase", "--card-pretitle-text-transform"],
	[
		"components.card.pretitle.letterSpacing",
		"--card-pretitle-letter-spacing",
	],
	["components.card.pretitle.size", "--card-pretitle-size"],
	["components.card.meta.paddingTop", "--card-meta-padding-top"],

	...calloutPaintTokenMapEntries(
		"components.callout.background",
		"background",
		"callout — background",
	),
	...calloutPaintTokenMapEntries(
		"components.callout.foreground",
		"foreground",
		"callout — foreground",
	),
	[
		"components.callout.title.family",
		"--callout-title-font-family",
		"callout — title",
	],
	["components.callout.title.weight", "--callout-title-font-weight"],
	["components.callout.title.size", "--callout-title-size"],
	[
		"components.callout.description.family",
		"--callout-description-font-family",
		"callout — description",
	],
	[
		"components.callout.description.weight",
		"--callout-description-font-weight",
	],
	["components.callout.description.size", "--callout-description-size"],
	[
		"components.callout.stripe.width",
		"--callout-stripe-width",
		"callout — stripe",
	],
	...calloutPaintTokenMapEntries(
		"components.callout.stripe.color",
		"stripe",
		"callout — stripe color",
	),
	["components.callout.gap.none", "--callout-gap-none", "callout — gap"],
	["components.callout.gap.sm", "--callout-gap-sm"],
	["components.callout.gap.md", "--callout-gap-md"],
	["components.callout.gap.lg", "--callout-gap-lg"],

	["components.badge.textSize", "--badge-text-size", "badge"],
	["components.badge.border", "--badge-border-width"],
	["components.badge.borderRadius", "--badge-border-radius"],
	["components.badge.background", "--badge-background"],

	[
		"components.slideFooter.textSize",
		"--slide-footer-text-size",
		"slide-footer",
	],
	["components.slideFooter.logoHeight", "--slide-footer-logo-height"],
	["components.slideFooter.gap", "--slide-footer-gap"],

	["components.stack.gap.none", "--stack-gap-none", "stack"],
	["components.stack.gap.sm", "--stack-gap-sm"],
	["components.stack.gap.md", "--stack-gap-md"],
	["components.stack.gap.lg", "--stack-gap-lg"],
];

function getPath(obj, dottedPath) {
	return dottedPath.split(".").reduce((acc, key) => {
		return acc && typeof acc === "object" ? acc[key] : undefined;
	}, obj);
}

function toCssValue(jsonPath, value, brand) {
	if (isColorRefPath(jsonPath)) {
		return resolveColorRef(brand, value, jsonPath);
	}
	if (isTonePath(jsonPath)) {
		if (!isToneValue(value)) {
			throw new Error(
				`${jsonPath} must be a number between 0 and 1 (got ${JSON.stringify(value)})`,
			);
		}
		return String(value);
	}
	if (isColorLiteralPath(jsonPath)) {
		if (!isColorLiteral(value)) {
			throw new Error(
				`${jsonPath} must be rgb()/rgba()/#rrggbb (got ${JSON.stringify(value)})`,
			);
		}
		return value;
	}
	if (isFontSizePath(jsonPath)) {
		if (!isTypeScaleStep(value)) {
			throw new Error(
				`${jsonPath} must be a type-scale step (${TYPE_SCALE_STEPS.join(", ")}) from design-system/tokens/typography.css (got ${JSON.stringify(value)})`,
			);
		}
		return `var(--text-size-${value})`;
	}
	if (isFontNamedFamilyPath(jsonPath)) {
		if (typeof value !== "string" || value.trim() === "") {
			throw new Error(
				`${jsonPath} must be a CSS font stack (got ${JSON.stringify(value)})`,
			);
		}
		return value;
	}
	if (isFontRoleFamilyPath(jsonPath)) {
		if (!isFontFamilyName(value)) {
			throw new Error(
				`${jsonPath} must be a named family (${FONT_FAMILY_NAMES.join(", ")}) from font.family (got ${JSON.stringify(value)})`,
			);
		}
		return `var(--font-family-${value})`;
	}
	if (isFontNamedWeightPath(jsonPath)) {
		if (!isCssFontWeight(value)) {
			throw new Error(
				`${jsonPath} must be a CSS font-weight (400, 500, 600, 700, …) matching design-system/tokens/fonts.css (got ${JSON.stringify(value)})`,
			);
		}
		return String(Number(value));
	}
	if (isFontRoleWeightPath(jsonPath)) {
		if (!isFontWeightName(value)) {
			throw new Error(
				`${jsonPath} must be a named weight (${FONT_WEIGHT_NAMES.join(", ")}) from font.weight (got ${JSON.stringify(value)})`,
			);
		}
		return `var(--font-weight-${value})`;
	}
	if (isSpacingStepPath(jsonPath)) {
		if (!isSpacingScaleStep(value)) {
			throw new Error(
				`${jsonPath} must be a spacing-scale step (${SPACING_SCALE_STEPS.join(", ")}) from design-system/tokens/spacing.css (got ${JSON.stringify(value)})`,
			);
		}
		return `var(--spacing-${value})`;
	}
	if (isBorderRadiusRolePath(jsonPath)) {
		if (!isBorderRadiusStep(value)) {
			throw new Error(
				`${jsonPath} must be a border-radius step (${BORDER_RADIUS_STEPS.join(", ")}) from border.radius (got ${JSON.stringify(value)})`,
			);
		}
		return `var(--border-radius-${value})`;
	}
	if (isBorderSizeRolePath(jsonPath)) {
		if (!isBorderSizeStep(value)) {
			throw new Error(
				`${jsonPath} must be a border-size step (${BORDER_SIZE_STEPS.join(", ")}) from border.size (got ${JSON.stringify(value)})`,
			);
		}
		return `var(--border-size-${value})`;
	}
	if (isPixelDimensionPath(jsonPath)) {
		if (!isPixelDimension(value)) {
			throw new Error(
				`${jsonPath} must be a positive integer pixel value (got ${JSON.stringify(value)})`,
			);
		}
		return `${Number(value)}px`;
	}
	if (isPretitleUppercasePath(jsonPath)) {
		if (!isPretitleUppercaseBoolean(value)) {
			throw new Error(
				`${jsonPath} must be a boolean (true = uppercase, false = no transform) (got ${JSON.stringify(value)})`,
			);
		}
		return value ? "uppercase" : "none";
	}
	if (isPretitleLetterSpacingPath(jsonPath)) {
		if (!isPretitleLetterSpacing(value)) {
			throw new Error(
				`${jsonPath} must be a percentage string such as "2%" (got ${JSON.stringify(value)})`,
			);
		}
		return value;
	}
	if (isCardLayoutPath(jsonPath)) {
		if (!isCardLayoutName(value)) {
			throw new Error(
				`${jsonPath} must be ${CARD_LAYOUT_NAMES.join(" or ")} (got ${JSON.stringify(value)})`,
			);
		}
		return String(value);
	}
	if (isBadgeBorderPath(jsonPath)) {
		if (!isBadgeBorderBoolean(value)) {
			throw new Error(
				`${jsonPath} must be true or false (got ${JSON.stringify(value)})`,
			);
		}
		return value ? "var(--border-size-sm)" : "var(--border-size-none)";
	}
	return value;
}

function buildBrandCss(brand) {
	const lines = [];
	for (const [jsonPath, cssVar, group] of TOKEN_MAP) {
		const raw = getPath(brand, jsonPath);
		if (raw === undefined || raw === null) continue;
		const value = toCssValue(jsonPath, raw, brand);
		if (value === null) continue;
		if (group) {
			if (lines.length > 0) lines.push("");
			lines.push(`\t/* ${group} */`);
		}
		lines.push(`\t${cssVar}: ${value};`);
	}

	const brandName =
		(brand.foundations &&
			brand.foundations.basic &&
			brand.foundations.basic.name) ||
		"brand";
	const layout = getPath(brand, "components.card.defaultLayout");
	const extra =
		layout === "stripe"
			? [
					"",
					'/* Default card layout: stripe (omit layout, or layout="stripe") */',
					CARD_STRIPE_LAYOUT_CSS,
					"",
				]
			: [""];
	return [
		`/* AUTO-GENERATED from ${BRAND_FILENAME} for "${brandName}" — do not edit by hand. */`,
		`/* Regenerate: npm run generate-brand -- brands/<name> */`,
		"",
		":root {",
		lines.join("\n"),
		"}",
		...extra,
	].join("\n");
}

function generateBrandCss(brandDir) {
	const resolvedDir = path.resolve(brandDir);
	const brandPath = path.join(resolvedDir, BRAND_FILENAME);
	if (!fs.existsSync(brandPath)) {
		throw new Error(`Missing ${BRAND_FILENAME} in ${resolvedDir}`);
	}

	const brand = JSON.parse(fs.readFileSync(brandPath, "utf8"));
	const css = buildBrandCss(brand);
	const outputPath = path.join(resolvedDir, OUTPUT_FILENAME);

	const previous = fs.existsSync(outputPath)
		? fs.readFileSync(outputPath, "utf8")
		: null;
	fs.writeFileSync(outputPath, css, "utf8");

	return { outputPath, changed: previous !== css };
}

function usage() {
	console.error(
		"Usage: node scripts/generate-brand-css.js <brand-directory>",
	);
	console.error(
		"Example: node scripts/generate-brand-css.js brands/riverton",
	);
	process.exit(1);
}

module.exports = {
	generateBrandCss,
	buildBrandCss,
	TOKEN_MAP,
	TYPE_SCALE_STEPS,
	SPACING_SCALE_STEPS,
	FONT_WEIGHT_NAMES,
	FONT_FAMILY_NAMES,
	BRAND_SWATCH_KEYS,
	SEMANTIC_COLOR_VARIANTS,
	SEMANTIC_COLOR_TONES,
	SEMANTIC_COLOR_FAMILY_KEYS,
	SEMANTIC_HUE_KEYS,
	TONE_KEYS,
	CARD_STATUS_FAMILY_KEYS,
	NEUTRAL_COLOR_FAMILY_KEYS,
	CARD_COLOR_FAMILY_KEYS,
	CALLOUT_COLOR_FAMILY_KEYS,
	semanticFamilyKey,
	isTonePath,
	isToneValue,
	resolveColorRef,
	resolvePalettePath,
	isColorRolePath,
	isColorRefPath,
	isCardColorPath,
	isCalloutColorPath,
	isSemanticSwatchPath,
	isColorLiteralPath,
	isColorLiteral,
	isBrandSwatchPath,
	isCssFontWeight,
	isFontWeightName,
	isFontFamilyName,
	isFontNamedFamilyPath,
	isFontRoleFamilyPath,
	isFontNamedWeightPath,
	isFontRoleWeightPath,
	isFontSizePath,
	isSpacingStepPath,
	isSpacingScaleStep,
	isTypeScaleStep,
	isBorderRadiusRolePath,
	isBorderRadiusStep,
	isBorderSizeRolePath,
	isBorderSizeStep,
	isPixelDimensionPath,
	isPixelDimension,
	isPretitleUppercasePath,
	isPretitleUppercaseBoolean,
	isPretitleLetterSpacingPath,
	isPretitleLetterSpacing,
	isCardLayoutPath,
	isCardLayoutName,
	CARD_LAYOUT_NAMES,
	isBadgeBorderPath,
	isBadgeBorderBoolean,
	BORDER_RADIUS_STEPS,
	BORDER_SIZE_STEPS,
	BRAND_FILENAME,
};

if (require.main === module) {
	const brandArg = process.argv[2];
	if (!brandArg) {
		usage();
	}

	try {
		const { outputPath } = generateBrandCss(brandArg);
		console.log(`Generated ${outputPath}`);
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
}

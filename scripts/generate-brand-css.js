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
 * Component *stroke* names a `border.size` step (`none`, `sm`, `md`).
 *
 * Cover and slide settings live under top-level `cover` / `slide` (colors,
 * type, chrome), nested by group (`cover.canvas.background`,
 * `cover.surface.background`, `slide.pretitle.family`,
 * `slide.header.paddingLeft`). Top-level groups, in
 * order: `foundations` (`basic`, `color`, `font`, `border`) then
 * `components` (`cover`, `slide`, `paragraphTitle`, `body`, `stack`,
 * `card`, `callout`). Hard-coded RGB lives on `foundations.color` (`brand.1`–
 * `brand.6`, `semantic.positiveQuiet`…, `chart.1`–`chart.4`). Card
 * paint and cover/slide roles ref that palette (`"semantic.positiveQuiet"`
 * or `{ "color": "brand.1", "opacity": 0.18 }`). Remaining
 * component tokens are grouped by component (`card`, …) and named component-leading
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
		/(pretitle|title|subtitle|description|text)Size(Lg|Md|Sm)?$/.test(jsonPath)
	);
}

function isSpacingStepPath(jsonPath) {
	return (
		/\.(padding|gap)\.(none|sm|md|lg)$/i.test(jsonPath) ||
		/\.padding(Top|Right|Bottom|Left)$/i.test(jsonPath) ||
		/\.title\.gap$/i.test(jsonPath) ||
		jsonPath === "components.slideFooter.gap" ||
		jsonPath === "components.slideFooter.logoHeight" ||
		/(padding(Sm|Md|Lg)|gap(Sm|Md|Lg)|metaPaddingTop|titleGap)$/i.test(jsonPath)
	);
}

function isFontNamedFamilyPath(jsonPath) {
	return /^foundations\.font\.family\.(display|base)$/.test(jsonPath);
}

function isFontRoleFamilyPath(jsonPath) {
	if (jsonPath.startsWith("foundations.font.family.")) return false;
	return jsonPath.endsWith(".family") || /(title|pretitle|subtitle)Family$/.test(jsonPath);
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
		(jsonPath.endsWith(".borderRadius") || jsonPath.endsWith(".border.radius")) &&
		!jsonPath.startsWith("foundations.border.radius.")
	);
}

const BORDER_SIZE_STEPS = ["none", "sm", "md"];
const BORDER_SIZE_STEP_SET = new Set(BORDER_SIZE_STEPS);

function isBorderSizeStep(value) {
	return BORDER_SIZE_STEP_SET.has(String(value));
}

function isBorderSizeRolePath(jsonPath) {
	return (
		jsonPath === "components.callout.borderSize" ||
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
	return jsonPath === "components.card.layout";
}

function isCardLayoutName(value) {
	return CARD_LAYOUT_NAME_SET.has(String(value));
}

const BADGE_BORDER_COLOR_NAMES = ["card", "none"];
const BADGE_BORDER_COLOR_NAME_SET = new Set(BADGE_BORDER_COLOR_NAMES);

function isBadgeBorderColorPath(jsonPath) {
	return jsonPath === "components.badge.borderColor";
}

function isBadgeBorderColorName(value) {
	return BADGE_BORDER_COLOR_NAME_SET.has(String(value));
}

const CARD_STRIPE_LAYOUT_CSS = [
	"card:not([layout=\"basic\"]) {",
	"	border-color: var(--_card-border-strong);",
	"	border-top-width: var(--border-size-none);",
	"	border-bottom-width: var(--border-size-none);",
	"	border-right-width: var(--border-size-none);",
	"	border-left-width: var(--border-size-md);",
	"	border-radius: var(--border-radius-none);",
	"}",
].join("\n");

const BRAND_SWATCH_INDICES = ["1", "2", "3", "4", "5", "6"];
const CHART_SWATCH_INDICES = ["1", "2", "3", "4"];
const BRAND_SWATCH_KEYS = BRAND_SWATCH_INDICES.map((i) => `brand.${i}`);
const CHART_SWATCH_KEYS = CHART_SWATCH_INDICES.map((i) => `chart.${i}`);
const STATUS_SEMANTIC_FAMILY_KEYS = [
	"positiveQuiet",
	"positiveEmphasis",
	"negativeQuiet",
	"negativeEmphasis",
	"warningQuiet",
	"warningEmphasis",
	"informativeQuiet",
	"informativeEmphasis",
];
const SEMANTIC_SWATCH_KEYS = STATUS_SEMANTIC_FAMILY_KEYS.map(
	(key) => `semantic.${key}`,
);
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
		`^foundations\\.color\\.semantic\\.(${STATUS_SEMANTIC_FAMILY_KEYS.join("|")})$`,
	).test(jsonPath);
}

function camelToKebab(value) {
	return String(value).replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

function jsonPathToCssVar(jsonPath) {
	return `--${jsonPath.split(".").map(camelToKebab).join("-")}`;
}

function semanticFamilyKey(variant, tone) {
	return `${variant}${tone.charAt(0).toUpperCase()}${tone.slice(1)}`;
}

const SEMANTIC_COLOR_VARIANTS = [
	"default",
	"positive",
	"negative",
	"warning",
	"informative",
];
const SEMANTIC_COLOR_TONES = ["quiet", "emphasis"];
const DEFAULT_COLOR_FAMILY_KEYS = ["defaultQuiet", "defaultEmphasis"];
const CARD_COLOR_FAMILY_KEYS = [
	...DEFAULT_COLOR_FAMILY_KEYS,
	...STATUS_SEMANTIC_FAMILY_KEYS,
];
const SEMANTIC_COLOR_FAMILY_KEYS = CARD_COLOR_FAMILY_KEYS;
const CARD_FAMILY_GROUP = CARD_COLOR_FAMILY_KEYS.join("|");
const SEMANTIC_LEAF_GROUP =
	"(foregroundStrong|foregroundBase|foregroundSubtle|backgroundBase|borderSubtle|borderStrong)";
const CARD_COLOR_PATH = new RegExp(
	`^components\\.card\\.(${CARD_FAMILY_GROUP})\\.${SEMANTIC_LEAF_GROUP}$`,
);

const SEMANTIC_TOKEN_LEAVES = [
	"foregroundStrong",
	"foregroundBase",
	"foregroundSubtle",
	"backgroundBase",
	"borderSubtle",
	"borderStrong",
];

function semanticSwatchTokenMapEntries() {
	return STATUS_SEMANTIC_FAMILY_KEYS.map((key, index) => {
		const jsonPath = `foundations.color.semantic.${key}`;
		const cssVar = jsonPathToCssVar(`color.semantic.${key}`);
		if (index === 0) return [jsonPath, cssVar, "color — semantic"];
		return [jsonPath, cssVar];
	});
}

function cardColorTokenMapEntries() {
	const entries = [];
	for (const family of CARD_COLOR_FAMILY_KEYS) {
		let firstInFamily = true;
		for (const jsonSuffix of SEMANTIC_TOKEN_LEAVES) {
			const jsonPath = `components.card.${family}.${jsonSuffix}`;
			const cardVar = jsonPathToCssVar(`card.${family}.${jsonSuffix}`);
			if (firstInFamily) {
				entries.push([jsonPath, cardVar, `card — ${family}`]);
				firstInFamily = false;
			} else {
				entries.push([jsonPath, cardVar]);
			}
			entries.push([
				jsonPath,
				jsonPathToCssVar(`color.${family}.${jsonSuffix}`),
			]);
		}
	}
	return entries;
}

function isColorLiteralPath(jsonPath) {
	return (
		isBrandSwatchPath(jsonPath) ||
		isChartSwatchPath(jsonPath) ||
		isSemanticSwatchPath(jsonPath)
	);
}

function isCardColorPath(jsonPath) {
	return CARD_COLOR_PATH.test(jsonPath);
}

function isColorRolePath(jsonPath) {
	return (
		/^components\.(cover|slide)\.canvas\.(background|foreground)$/.test(jsonPath) ||
		/^components\.(cover|slide)\.surface\.(background|foreground|border)$/.test(jsonPath)
	);
}

function isColorRefPath(jsonPath) {
	return isColorRolePath(jsonPath) || isCardColorPath(jsonPath);
}

function isColorLiteral(value) {
	if (typeof value !== "string") return false;
	return (
		/^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)$/i.test(value) ||
		/^#[0-9a-f]{6}$/i.test(value)
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
		throw new Error(`Cannot apply opacity to non-color value ${JSON.stringify(colorValue)}`);
	}
	if (typeof opacity !== "number" || Number.isNaN(opacity) || opacity < 0 || opacity > 1) {
		throw new Error(`opacity must be a number between 0 and 1 (got ${JSON.stringify(opacity)})`);
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
 * (`brand.1`, `semantic.positiveQuiet`, `chart.1`, …).
 * Accepts a raw rgb/rgba/# literal, `"brand.1"` /
 * `"semantic.positiveQuiet"` / `"chart.1"`, or
 * `{ "color": "semantic.warningQuiet", "opacity": 0.1 }`.
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
		if (opacity !== undefined && (typeof opacity !== "number" || Number.isNaN(opacity))) {
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
			`${jsonPath} unknown palette ref "${refName}" (use brand.1–brand.6, chart.1–chart.4, or semantic.positiveQuiet / …)`,
		);
	}

	const resolved = getPath(brand, palettePath);
	if (resolved === undefined || resolved === null) {
		throw new Error(`${jsonPath} references missing palette entry ${palettePath}`);
	}

	let literal;
	if (isColorLiteral(resolved)) {
		literal = resolved;
	} else {
		if (depth >= 8) {
			throw new Error(`${jsonPath} color ref cycle or too deep (via ${palettePath})`);
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

	["foundations.font.family.display", "--font-family-display", "font — family"],
	["foundations.font.family.base", "--font-family-base"],

	["foundations.font.weight.regular", "--font-weight-regular", "font — weight"],
	["foundations.font.weight.medium", "--font-weight-medium"],
	["foundations.font.weight.bold", "--font-weight-bold"],

	["foundations.border.radius.none", "--border-radius-none", "border — radius"],
	["foundations.border.radius.sm", "--border-radius-sm"],
	["foundations.border.radius.med", "--border-radius-med"],
	["foundations.border.radius.lg", "--border-radius-lg"],
	["foundations.border.radius.full", "--border-radius-full"],

	["foundations.border.size.none", "--border-size-none", "border — size"],
	["foundations.border.size.sm", "--border-size-sm"],
	["foundations.border.size.md", "--border-size-md"],

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
	["components.slide.pretitle.letterSpacing", "--slide-pretitle-letter-spacing"],
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
	["components.slide.content.paddingBottom", "--slide-content-padding-bottom"],
	["components.slide.content.paddingLeft", "--slide-content-padding-left"],
	["components.slide.footer.paddingTop", "--slide-footer-padding-top"],
	["components.slide.footer.paddingRight", "--slide-footer-padding-right"],
	["components.slide.footer.paddingBottom", "--slide-footer-padding-bottom"],
	["components.slide.footer.paddingLeft", "--slide-footer-padding-left"],

	["components.paragraphTitle.family", "--paragraph-title-font-family", "paragraphTitle"],
	["components.paragraphTitle.weight", "--paragraph-title-font-weight"],
	["components.paragraphTitle.sizeSm", "--paragraph-title-size-sm"],
	["components.paragraphTitle.sizeMd", "--paragraph-title-size-md"],
	["components.paragraphTitle.sizeLg", "--paragraph-title-size-lg"],

	["components.body.family", "--body-font-family", "body"],
	["components.body.weight", "--body-font-weight"],
	["components.body.sizeSm", "--body-size-sm"],
	["components.body.sizeMd", "--body-size-md"],
	["components.body.sizeLg", "--body-size-lg"],

	["components.card.layout", "--card-layout", "card"],
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
	["components.card.title.family", "--card-title-font-family"],
	["components.card.title.weight", "--card-title-font-weight"],
	["components.card.title.sizeSm", "--card-title-size-sm"],
	["components.card.title.sizeMd", "--card-title-size-md"],
	["components.card.title.sizeLg", "--card-title-size-lg"],
	["components.card.pretitle.family", "--card-pretitle-font-family"],
	["components.card.pretitle.weight", "--card-pretitle-font-weight"],
	["components.card.pretitle.uppercase", "--card-pretitle-text-transform"],
	["components.card.pretitle.letterSpacing", "--card-pretitle-letter-spacing"],
	["components.card.pretitle.size", "--card-pretitle-size"],
	["components.card.meta.paddingTop", "--card-meta-padding-top"],

	["components.callout.titleSize", "--callout-title-size", "callout"],
	["components.callout.descriptionSize", "--callout-description-size"],
	["components.callout.borderSize", "--callout-border-size"],

	["components.badge.textSize", "--badge-text-size", "badge"],
	["components.badge.borderColor", "--badge-border-color"],
	["components.badge.borderRadius", "--badge-border-radius"],

	["components.slideFooter.textSize", "--slide-footer-text-size", "slide-footer"],
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
	if (isBadgeBorderColorPath(jsonPath)) {
		if (!isBadgeBorderColorName(value)) {
			throw new Error(
				`${jsonPath} must be ${BADGE_BORDER_COLOR_NAMES.join(" or ")} (got ${JSON.stringify(value)})`,
			);
		}
		if (value === "none") return "transparent";
		return null;
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

	const brandName = (brand.foundations && brand.foundations.basic && brand.foundations.basic.name) || "brand";
	const layout = getPath(brand, "components.card.layout");
	const extra =
		layout === "stripe"
			? ["", "/* Default card layout: stripe (omit layout, or layout=\"stripe\") */", CARD_STRIPE_LAYOUT_CSS, ""]
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
	console.error("Usage: node scripts/generate-brand-css.js <brand-directory>");
	console.error("Example: node scripts/generate-brand-css.js brands/riverton");
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
	STATUS_SEMANTIC_FAMILY_KEYS,
	DEFAULT_COLOR_FAMILY_KEYS,
	CARD_COLOR_FAMILY_KEYS,
	semanticFamilyKey,
	resolveColorRef,
	resolvePalettePath,
	isColorRolePath,
	isColorRefPath,
	isCardColorPath,
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
	isBadgeBorderColorPath,
	isBadgeBorderColorName,
	BADGE_BORDER_COLOR_NAMES,
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

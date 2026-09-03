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
 * Font *named families* (`fonts.families.display|base`) are CSS stacks.
 * Role families (`cover.title.family`, `fonts.body.family`, …) name one of those
 * two. Font *named weights* (`fonts.weights.regular|medium|bold`) are CSS numbers
 * (400, 500, 600, 700, …) matching `@font-face` in design-system/tokens/fonts.css.
 * Role weights (`slide.title.weight`, `card.title.weight`, …) and `<text weight>`
 * name one of those three. Font *sizes* are type-scale steps (800, 600, 400, …)
 * from design-system/tokens/typography.css — not pixel values.
 * Semantic *spacing* is a spacing-scale step (20, 16, "0-5", …) from
 * design-system/tokens/spacing.css — not pixel values.
 * `slide.maxWidth` is a pixel integer (default 1280) — the slide canvas cap.
 * Component *radius* names a `border.radius` step (`med`, `none`, …).
 * Component *stroke* names a `border.size` step (`none`, `sm`, `md`).
 *
 * Cover and slide settings live under top-level `cover` / `slide` (colors,
 * type, chrome), nested by group (`cover.surface.background`,
 * `slide.pretitle.family`, `slide.header.paddingLeft`). Other generic tokens
 * are grouped by type (`colors.brand`, `colors.status`, `colors.charts`,
 * `fonts.families`, `fonts.weights`, `fonts.body`, `border.radius`,
 * `border.size`). Hard-coded RGB lives on `colors.brand` / status / charts;
 * `colors.highlight` and cover/slide color roles ref that palette
 * (`"brand2"` or `{ "color": "brand1", "opacity": 0.18 }`). Remaining
 * component tokens are grouped by component (`card`, `alert`, …) and named
 * component-leading (`--slide-pretitle-font-family`). TOKEN_MAP order is the
 * brand.css order.
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
		/(pretitle|title|subtitle)Size(Lg|Md|Sm)?$/.test(jsonPath)
	);
}

function isSpacingStepPath(jsonPath) {
	return /(padding(Sm|Md|Lg|Top|Right|Bottom|Left)|gap(Sm|Md|Lg)?|metaPaddingTop|titleGap|padding[XY](Title|Content))$/i.test(
		jsonPath,
	);
}

function isFontNamedFamilyPath(jsonPath) {
	return /^fonts\.families\.(display|base)$/.test(jsonPath);
}

function isFontRoleFamilyPath(jsonPath) {
	if (jsonPath.startsWith("fonts.families.")) return false;
	return jsonPath.endsWith(".family") || /(title|pretitle|subtitle)Family$/.test(jsonPath);
}

function isFontNamedWeightPath(jsonPath) {
	return /^fonts\.weights\.(regular|medium|bold)$/.test(jsonPath);
}

function isFontRoleWeightPath(jsonPath) {
	if (jsonPath.startsWith("fonts.weights.")) return false;
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
	return jsonPath.endsWith(".borderRadius") && !jsonPath.startsWith("border.radius.");
}

const BORDER_SIZE_STEPS = ["none", "sm", "md"];
const BORDER_SIZE_STEP_SET = new Set(BORDER_SIZE_STEPS);

function isBorderSizeStep(value) {
	return BORDER_SIZE_STEP_SET.has(String(value));
}

function isBorderSizeRolePath(jsonPath) {
	return /\.borderSize\.(top|bottom|left|right)$/.test(jsonPath);
}

function isPixelDimensionPath(jsonPath) {
	return jsonPath === "slide.maxWidth";
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

const BRAND_SWATCH_KEYS = ["brand1", "brand2", "brand3", "brand4", "brand5", "brand6"];
const BRAND_SWATCH_KEY_SET = new Set(BRAND_SWATCH_KEYS);

function isBrandSwatchPath(jsonPath) {
	return /^colors\.brand\.brand[1-6]$/.test(jsonPath);
}

function isColorLiteralPath(jsonPath) {
	return (
		isBrandSwatchPath(jsonPath) ||
		/^colors\.status\.(positive|warning|negative|informative)\.(foreground|background|border)$/.test(
			jsonPath,
		) ||
		/^colors\.charts\.chart[1-4]$/.test(jsonPath)
	);
}

function isColorRolePath(jsonPath) {
	return (
		jsonPath === "colors.highlight" ||
		/^(cover|slide)\.(background|foreground)$/.test(jsonPath) ||
		/^(cover|slide)\.surface\.(background|foreground|border)$/.test(jsonPath)
	);
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
	if (BRAND_SWATCH_KEY_SET.has(refName)) {
		return `colors.brand.${refName}`;
	}
	if (
		/^status\.(positive|warning|negative|informative)\.(foreground|background|border)$/.test(
			refName,
		)
	) {
		return `colors.${refName}`;
	}
	if (/^charts\.chart[1-4]$/.test(refName)) {
		return `colors.${refName}`;
	}
	return null;
}

/**
 * Resolve a color role ref against the extended palette
 * (`colors.brand.*`, `colors.status.*`, `colors.charts.*`).
 * Accepts `"brand1"` / `"status.positive.foreground"` or
 * `{ "color": "brand1", "opacity": 0.18 }`.
 */
function resolveColorRef(brand, raw, jsonPath) {
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
			`${jsonPath} must be a palette ref string or { "color", "opacity"? } (got ${JSON.stringify(raw)})`,
		);
	}

	const palettePath = resolvePalettePath(refName);
	if (!palettePath) {
		throw new Error(
			`${jsonPath} unknown palette ref "${refName}" (use brand1–brand6, status.*.*, or charts.chart*)`,
		);
	}

	const literal = getPath(brand, palettePath);
	if (literal === undefined || literal === null) {
		throw new Error(`${jsonPath} references missing palette entry ${palettePath}`);
	}
	if (!isColorLiteral(literal)) {
		throw new Error(
			`${palettePath} must be rgb()/rgba()/#rrggbb (got ${JSON.stringify(literal)})`,
		);
	}

	if (opacity !== undefined) {
		return withOpacity(literal, opacity);
	}
	return literal;
}

const TOKEN_MAP = [
	["colors.brand.brand1", "--color-brand-1", "brand"],
	["colors.brand.brand2", "--color-brand-2"],
	["colors.brand.brand3", "--color-brand-3"],
	["colors.brand.brand4", "--color-brand-4"],
	["colors.brand.brand5", "--color-brand-5"],
	["colors.brand.brand6", "--color-brand-6"],

	["colors.highlight", "--color-highlight", "highlight"],

	["colors.status.positive.foreground", "--color-positive", "status"],
	["colors.status.positive.background", "--color-positive-bg"],
	["colors.status.positive.border", "--color-positive-border"],
	["colors.status.warning.foreground", "--color-warning"],
	["colors.status.warning.background", "--color-warning-bg"],
	["colors.status.warning.border", "--color-warning-border"],
	["colors.status.negative.foreground", "--color-negative"],
	["colors.status.negative.background", "--color-negative-bg"],
	["colors.status.negative.border", "--color-negative-border"],
	["colors.status.informative.foreground", "--color-informative"],
	["colors.status.informative.background", "--color-informative-bg"],
	["colors.status.informative.border", "--color-informative-border"],

	["colors.charts.chart1", "--color-chart-1", "charts"],
	["colors.charts.chart2", "--color-chart-2"],
	["colors.charts.chart3", "--color-chart-3"],
	["colors.charts.chart4", "--color-chart-4"],

	["fonts.families.display", "--font-family-display", "fonts — families"],
	["fonts.families.base", "--font-family-base"],

	["fonts.weights.regular", "--font-weight-regular", "fonts — weights"],
	["fonts.weights.medium", "--font-weight-medium"],
	["fonts.weights.bold", "--font-weight-bold"],

	["fonts.paragraphTitle.family", "--paragraph-title-font-family", "fonts — paragraph title"],
	["fonts.paragraphTitle.weight", "--paragraph-title-font-weight"],
	["fonts.paragraphTitle.sizeSm", "--paragraph-title-size-sm"],
	["fonts.paragraphTitle.sizeMd", "--paragraph-title-size-md"],
	["fonts.paragraphTitle.sizeLg", "--paragraph-title-size-lg"],

	["fonts.body.family", "--body-font-family", "fonts — body"],
	["fonts.body.weight", "--body-font-weight"],
	["fonts.body.sizeSm", "--body-size-sm"],
	["fonts.body.sizeMd", "--body-size-md"],
	["fonts.body.sizeLg", "--body-size-lg"],

	["border.radius.none", "--border-radius-none", "border — radius"],
	["border.radius.sm", "--border-radius-sm"],
	["border.radius.med", "--border-radius-med"],
	["border.radius.lg", "--border-radius-lg"],
	["border.radius.full", "--border-radius-full"],

	["border.size.none", "--border-size-none", "border — size"],
	["border.size.sm", "--border-size-sm"],
	["border.size.md", "--border-size-md"],

	["cover.background", "--color-cover-background", "cover"],
	["cover.foreground", "--color-cover-foreground"],
	["cover.surface.background", "--color-cover-surface-background"],
	["cover.surface.foreground", "--color-cover-surface-foreground"],
	["cover.surface.border", "--color-cover-surface-border"],
	["cover.title.family", "--cover-title-font-family"],
	["cover.title.weight", "--cover-title-font-weight"],

	["slide.background", "--color-slide-background", "slide"],
	["slide.foreground", "--color-slide-foreground"],
	["slide.surface.background", "--color-slide-surface-background"],
	["slide.surface.foreground", "--color-slide-surface-foreground"],
	["slide.surface.border", "--color-slide-surface-border"],
	["slide.pretitle.family", "--slide-pretitle-font-family"],
	["slide.pretitle.weight", "--slide-pretitle-font-weight"],
	["slide.pretitle.uppercase", "--slide-pretitle-text-transform"],
	["slide.pretitle.letterSpacing", "--slide-pretitle-letter-spacing"],
	["slide.pretitle.size", "--slide-pretitle-size"],
	["slide.title.gap", "--slide-title-gap"],
	["slide.title.family", "--slide-title-font-family"],
	["slide.title.weight", "--slide-title-font-weight"],
	["slide.title.sizeSm", "--slide-title-size-sm"],
	["slide.title.sizeMd", "--slide-title-size-md"],
	["slide.title.sizeLg", "--slide-title-size-lg"],
	["slide.subtitle.family", "--slide-subtitle-font-family"],
	["slide.subtitle.weight", "--slide-subtitle-font-weight"],
	["slide.subtitle.size", "--slide-subtitle-size"],
	["slide.maxWidth", "--slide-max-width"],
	["slide.header.paddingTop", "--slide-header-padding-top"],
	["slide.header.paddingRight", "--slide-header-padding-right"],
	["slide.header.paddingBottom", "--slide-header-padding-bottom"],
	["slide.header.paddingLeft", "--slide-header-padding-left"],
	["slide.content.paddingTop", "--slide-content-padding-top"],
	["slide.content.paddingRight", "--slide-content-padding-right"],
	["slide.content.paddingBottom", "--slide-content-padding-bottom"],
	["slide.content.paddingLeft", "--slide-content-padding-left"],
	["slide.footer.paddingTop", "--slide-footer-padding-top"],
	["slide.footer.paddingRight", "--slide-footer-padding-right"],
	["slide.footer.paddingBottom", "--slide-footer-padding-bottom"],
	["slide.footer.paddingLeft", "--slide-footer-padding-left"],

	["card.paddingSm", "--card-padding-sm", "card"],
	["card.paddingMd", "--card-padding-md"],
	["card.paddingLg", "--card-padding-lg"],
	["card.gapSm", "--card-gap-sm"],
	["card.gapMd", "--card-gap-md"],
	["card.gapLg", "--card-gap-lg"],
	["card.borderRadius", "--card-border-radius"],
	["card.borderSize.top", "--card-border-size-top"],
	["card.borderSize.bottom", "--card-border-size-bottom"],
	["card.borderSize.left", "--card-border-size-left"],
	["card.borderSize.right", "--card-border-size-right"],
	["card.title.family", "--card-title-font-family"],
	["card.title.weight", "--card-title-font-weight"],
	["card.title.sizeSm", "--card-title-size-sm"],
	["card.title.sizeMd", "--card-title-size-md"],
	["card.title.sizeLg", "--card-title-size-lg"],
	["card.pretitle.family", "--card-pretitle-font-family"],
	["card.pretitle.weight", "--card-pretitle-font-weight"],
	["card.pretitle.uppercase", "--card-pretitle-text-transform"],
	["card.pretitle.letterSpacing", "--card-pretitle-letter-spacing"],
	["card.pretitle.size", "--card-pretitle-size"],
	["card.metaPaddingTop", "--card-meta-padding-top"],

	["alert.paddingSm", "--alert-padding-sm", "alert"],
	["alert.paddingMd", "--alert-padding-md"],
	["alert.paddingLg", "--alert-padding-lg"],
	["alert.gap", "--alert-gap"],
	["alert.borderRadius", "--alert-border-radius"],
	["alert.borderSize.top", "--alert-border-size-top"],
	["alert.borderSize.bottom", "--alert-border-size-bottom"],
	["alert.borderSize.left", "--alert-border-size-left"],
	["alert.borderSize.right", "--alert-border-size-right"],

	["stack.gapSm", "--stack-gap-sm", "stack"],
	["stack.gapMd", "--stack-gap-md"],
	["stack.gapLg", "--stack-gap-lg"],
];

function getPath(obj, dottedPath) {
	return dottedPath.split(".").reduce((acc, key) => {
		return acc && typeof acc === "object" ? acc[key] : undefined;
	}, obj);
}

function toCssValue(jsonPath, value, brand) {
	if (isColorRolePath(jsonPath)) {
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
				`${jsonPath} must be a named family (${FONT_FAMILY_NAMES.join(", ")}) from fonts.families (got ${JSON.stringify(value)})`,
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
				`${jsonPath} must be a named weight (${FONT_WEIGHT_NAMES.join(", ")}) from fonts.weights (got ${JSON.stringify(value)})`,
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
	return value;
}

function buildBrandCss(brand) {
	const lines = [];
	for (const [jsonPath, cssVar, group] of TOKEN_MAP) {
		const raw = getPath(brand, jsonPath);
		if (raw === undefined || raw === null) continue;
		const value = toCssValue(jsonPath, raw, brand);
		if (group) {
			if (lines.length > 0) lines.push("");
			lines.push(`\t/* ${group} */`);
		}
		lines.push(`\t${cssVar}: ${value};`);
	}

	const brandName = brand.name || "brand";
	return [
		`/* AUTO-GENERATED from ${BRAND_FILENAME} for "${brandName}" — do not edit by hand. */`,
		`/* Regenerate: npm run generate-brand -- brands/<name> */`,
		"",
		":root {",
		lines.join("\n"),
		"}",
		"",
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
	resolveColorRef,
	isColorRolePath,
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

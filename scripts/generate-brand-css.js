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

/**
 * Maps brand-settings.json fields to CSS custom properties. This is the single
 * source of truth for which design-system globals a brand is allowed to override.
 * Each entry is a [dotted brand-settings.json path, --css-variable] pair.
 * Anything not listed here stays a shared design-system default (type scale,
 * global spacing scale, etc.).
 *
 * Font *named weights* (`fonts.weights.regular|medium|bold`) are CSS numbers
 * (400, 500, 600, 700, …) matching `@font-face` in design-system/tokens/fonts.css.
 * Role weights (`slideTitle.weight`, `card.title.weight`, …) and `<text weight>`
 * name one of those three. Font *sizes* are type-scale steps (800, 600, 400, …)
 * from design-system/tokens/typography.css — not pixel values.
 * Semantic *spacing* is a spacing-scale step (20, 16, "0-5", …) from
 * design-system/tokens/spacing.css — not pixel values.
 * `slide.maxWidth` is a pixel integer (default 1280) — the slide canvas cap.
 * Component *radius* names a `borderRadius` step (`med`, `none`, …).
 * Component *stroke* names a `borderSize` step (`none`, `sm`, `md`).
 *
 * Generic tokens are grouped by type (`colors`, `fonts.weights`, `fonts.body`,
 * `borderRadius` scale, `borderSize` scale). Component tokens are grouped by
 * component (`card`, `alert`, `slideTitle`, …). TOKEN_MAP order is the brand.css order.
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
	return /\.(size|sizeLg|sizeMd|sizeSm)$/.test(jsonPath);
}

function isSpacingStepPath(jsonPath) {
	return /\.(padding(Sm|Md|Lg|Top|Right|Bottom|Left)|gap(Sm|Md|Lg)?|metaPaddingTop|padding[XY](Title|Content))$/.test(
		jsonPath,
	);
}

function isFontNamedWeightPath(jsonPath) {
	return /^fonts\.weights\.(regular|medium|bold)$/.test(jsonPath);
}

function isFontRoleWeightPath(jsonPath) {
	return jsonPath.endsWith(".weight") && !jsonPath.startsWith("fonts.weights.");
}

const BORDER_RADIUS_STEPS = ["none", "sm", "med", "lg", "full"];
const BORDER_RADIUS_STEP_SET = new Set(BORDER_RADIUS_STEPS);

function isBorderRadiusStep(value) {
	return BORDER_RADIUS_STEP_SET.has(String(value));
}

function isBorderRadiusRolePath(jsonPath) {
	return jsonPath.endsWith(".borderRadius") && !jsonPath.startsWith("borderRadius.");
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

const TOKEN_MAP = [
	["colors.cover.background", "--color-cover-background", "cover"],
	["colors.cover.foreground", "--color-cover-foreground"],
	["colors.cover.surfaceBackground", "--color-cover-surface-background"],
	["colors.cover.surfaceForeground", "--color-cover-surface-foreground"],
	["colors.cover.surfaceBorder", "--color-cover-surface-border"],

	["colors.slide.background", "--color-slide-background", "slide"],
	["colors.slide.foreground", "--color-slide-foreground"],
	["colors.slide.surfaceBackground", "--color-slide-surface-background"],
	["colors.slide.surfaceForeground", "--color-slide-surface-foreground"],
	["colors.slide.surfaceBorder", "--color-slide-surface-border"],

	["colors.highlight", "--color-highlight", "highlight"],

	["colors.status.positive.color", "--color-positive", "status"],
	["colors.status.positive.background", "--color-positive-bg"],
	["colors.status.warning.color", "--color-warning"],
	["colors.status.warning.background", "--color-warning-bg"],
	["colors.status.negative.color", "--color-negative"],
	["colors.status.negative.background", "--color-negative-bg"],
	["colors.status.informative.color", "--color-informative"],
	["colors.status.informative.background", "--color-informative-bg"],

	["colors.charts.chart1", "--color-chart-1", "charts"],
	["colors.charts.chart2", "--color-chart-2"],
	["colors.charts.chart3", "--color-chart-3"],
	["colors.charts.chart4", "--color-chart-4"],

	["fonts.weights.regular", "--font-weight-regular", "fonts — weights"],
	["fonts.weights.medium", "--font-weight-medium"],
	["fonts.weights.bold", "--font-weight-bold"],

	["fonts.body.family", "--font-family-body", "fonts — body"],
	["fonts.body.weight", "--font-weight-body"],

	["borderRadius.none", "--border-radius-none", "border radius"],
	["borderRadius.sm", "--border-radius-sm"],
	["borderRadius.med", "--border-radius-med"],
	["borderRadius.lg", "--border-radius-lg"],
	["borderRadius.full", "--border-radius-full"],

	["borderSize.none", "--border-size-none", "border size"],
	["borderSize.sm", "--border-size-sm"],
	["borderSize.md", "--border-size-md"],

	["coverTitle.family", "--font-family-cover-title", "cover title"],
	["coverTitle.weight", "--font-weight-cover-title"],

	["slideTitle.gap", "--slide-title-gap", "slide title"],
	["slideTitle.family", "--font-family-slide-title"],
	["slideTitle.weight", "--font-weight-slide-title"],
	["slideTitle.sizeLg", "--slide-title-main-size-lg"],
	["slideTitle.sizeMd", "--slide-title-main-size-md"],
	["slideTitle.sizeSm", "--slide-title-main-size-sm"],
	["slideTitle.pre.family", "--font-family-slide-title-pre"],
	["slideTitle.pre.weight", "--font-weight-slide-title-pre"],
	["slideTitle.pre.size", "--slide-title-pre-size"],
	["slideTitle.sub.family", "--font-family-slide-title-sub"],
	["slideTitle.sub.weight", "--font-weight-slide-title-sub"],
	["slideTitle.sub.size", "--slide-title-sub-size"],

	["slide.maxWidth", "--slide-max-width", "slide chrome"],
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
	["card.borderRadius", "--border-radius-card"],
	["card.borderSize.top", "--card-border-size-top"],
	["card.borderSize.bottom", "--card-border-size-bottom"],
	["card.borderSize.left", "--card-border-size-left"],
	["card.borderSize.right", "--card-border-size-right"],
	["card.title.family", "--font-family-card-title"],
	["card.title.weight", "--font-weight-card-title"],
	["card.title.sizeLg", "--card-title-size-lg"],
	["card.title.sizeMd", "--card-title-size-md"],
	["card.title.sizeSm", "--card-title-size-sm"],
	["card.pretitle.family", "--font-family-card-pretitle"],
	["card.pretitle.weight", "--font-weight-card-pretitle"],
	["card.pretitle.size", "--card-pretitle-size"],
	["card.quickFact.metaPaddingTop", "--quick-fact-card-meta-padding-top"],

	["alert.paddingSm", "--alert-padding-sm", "alert"],
	["alert.paddingMd", "--alert-padding-md"],
	["alert.paddingLg", "--alert-padding-lg"],
	["alert.gap", "--alert-gap"],
	["alert.borderRadius", "--border-radius-alert"],
	["alert.borderSize.top", "--alert-border-size-top"],
	["alert.borderSize.bottom", "--alert-border-size-bottom"],
	["alert.borderSize.left", "--alert-border-size-left"],
	["alert.borderSize.right", "--alert-border-size-right"],

	["stack.gapSm", "--stack-gap-sm", "stack"],
	["stack.gapMd", "--stack-gap-md"],
	["stack.gapLg", "--stack-gap-lg"],

	["paragraphTitle.family", "--font-family-paragraph-title", "paragraph title"],
	["paragraphTitle.weight", "--font-weight-paragraph-title"],
	["paragraphTitle.sizeLg", "--paragraph-title-size-lg"],
	["paragraphTitle.sizeMd", "--paragraph-title-size-md"],
	["paragraphTitle.sizeSm", "--paragraph-title-size-sm"],

	["attributionBox.gap", "--attribution-box-gap", "attribution box"],
	["attributionBox.paddingYTitle", "--attribution-box-padding-y-title"],
	["attributionBox.paddingXTitle", "--attribution-box-padding-x-title"],
	["attributionBox.paddingYContent", "--attribution-box-padding-y-content"],
	["attributionBox.paddingXContent", "--attribution-box-padding-x-content"],
];

function getPath(obj, dottedPath) {
	return dottedPath.split(".").reduce((acc, key) => {
		return acc && typeof acc === "object" ? acc[key] : undefined;
	}, obj);
}

function toCssValue(jsonPath, value) {
	if (isFontSizePath(jsonPath)) {
		if (!isTypeScaleStep(value)) {
			throw new Error(
				`${jsonPath} must be a type-scale step (${TYPE_SCALE_STEPS.join(", ")}) from design-system/tokens/typography.css (got ${JSON.stringify(value)})`,
			);
		}
		return `var(--text-size-${value})`;
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
				`${jsonPath} must be a border-radius step (${BORDER_RADIUS_STEPS.join(", ")}) from borderRadius (got ${JSON.stringify(value)})`,
			);
		}
		return `var(--border-radius-${value})`;
	}
	if (isBorderSizeRolePath(jsonPath)) {
		if (!isBorderSizeStep(value)) {
			throw new Error(
				`${jsonPath} must be a border-size step (${BORDER_SIZE_STEPS.join(", ")}) from borderSize (got ${JSON.stringify(value)})`,
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
	return value;
}

function buildBrandCss(brand) {
	const lines = [];
	for (const [jsonPath, cssVar, group] of TOKEN_MAP) {
		const raw = getPath(brand, jsonPath);
		if (raw === undefined || raw === null) continue;
		const value = toCssValue(jsonPath, raw);
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
	isCssFontWeight,
	isFontWeightName,
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

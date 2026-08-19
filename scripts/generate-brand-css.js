#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const BRAND_FILENAME = "brand-settings.json";
const OUTPUT_FILENAME = "brand.css";

function isCssFontWeight(value) {
	const n = Number(value);
	return Number.isInteger(n) && n >= 100 && n <= 900 && n % 100 === 0;
}

/**
 * Maps brand-settings.json fields to CSS custom properties. This is the single
 * source of truth for which design-system globals a brand is allowed to override.
 * Each entry is a [dotted brand-settings.json path, --css-variable] pair.
 * Anything not listed here stays a shared design-system default (spacing, type
 * scale, etc.). Font weights in brand-settings.json are CSS numbers
 * (400, 500, 600, 700, …)
 * matching `@font-face` in design-system/tokens/fonts.css. Font *sizes* in
 * brand-settings.json are type-scale steps (800, 600, 400, …) from
 * design-system/tokens/typography.css — not pixel values.
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

function isFontSizePath(jsonPath) {
	return /^fonts\.[^.]+\.(size|sizeLg|sizeMd|sizeSm)$/.test(jsonPath);
}

const TOKEN_MAP = [
	["colors.cover.background", "--color-cover-background", "cover"],
	["colors.cover.foreground", "--color-cover-foreground"],
	["colors.cover.surfaceBackground", "--color-cover-surface-background"],
	["colors.cover.surfaceForeground", "--color-cover-surface-foreground"],

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

	["fonts.coverTitle.family", "--font-family-cover-title", "fonts — cover title"],
	["fonts.coverTitle.weight", "--font-weight-cover-title"],

	["fonts.slideTitle.family", "--font-family-slide-title", "fonts — slide title"],
	["fonts.slideTitle.weight", "--font-weight-slide-title"],
	["fonts.slideTitle.sizeLg", "--slide-title-main-size-lg"],
	["fonts.slideTitle.sizeMd", "--slide-title-main-size-md"],
	["fonts.slideTitle.sizeSm", "--slide-title-main-size-sm"],

	["fonts.slideTitlePre.family", "--font-family-slide-title-pre", "fonts — slide title pre"],
	["fonts.slideTitlePre.weight", "--font-weight-slide-title-pre"],
	["fonts.slideTitlePre.size", "--slide-title-pre-size"],

	["fonts.slideTitleSub.family", "--font-family-slide-title-sub", "fonts — slide title sub"],
	["fonts.slideTitleSub.weight", "--font-weight-slide-title-sub"],
	["fonts.slideTitleSub.size", "--slide-title-sub-size"],

	["fonts.cardTitle.family", "--font-family-card-title", "fonts — card title"],
	["fonts.cardTitle.weight", "--font-weight-card-title"],
	["fonts.cardTitle.sizeLg", "--card-title-size-lg"],
	["fonts.cardTitle.sizeMd", "--card-title-size-md"],
	["fonts.cardTitle.sizeSm", "--card-title-size-sm"],

	["fonts.cardPretitle.family", "--font-family-card-pretitle", "fonts — card pretitle"],
	["fonts.cardPretitle.weight", "--font-weight-card-pretitle"],
	["fonts.cardPretitle.size", "--card-pretitle-size"],

	["fonts.paragraphTitle.family", "--font-family-paragraph-title", "fonts — paragraph title"],
	["fonts.paragraphTitle.weight", "--font-weight-paragraph-title"],
	["fonts.paragraphTitle.sizeLg", "--paragraph-title-size-lg"],
	["fonts.paragraphTitle.sizeMd", "--paragraph-title-size-md"],
	["fonts.paragraphTitle.sizeSm", "--paragraph-title-size-sm"],

	["fonts.body.family", "--font-family-body", "fonts — body"],
	["fonts.body.weight", "--font-weight-body"],

	["borderRadius.none", "--border-radius-none", "border radius"],
	["borderRadius.sm", "--border-radius-sm"],
	["borderRadius.med", "--border-radius-med"],
	["borderRadius.lg", "--border-radius-lg"],
	["borderRadius.full", "--border-radius-full"],
	["borderRadius.card", "--border-radius-card"],
	["borderRadius.alert", "--border-radius-alert"],

	["borderSize.card.top", "--card-border-size-top", "border size"],
	["borderSize.card.bottom", "--card-border-size-bottom"],
	["borderSize.card.left", "--card-border-size-left"],
	["borderSize.card.right", "--card-border-size-right"],
	["borderSize.alert.top", "--alert-border-size-top"],
	["borderSize.alert.bottom", "--alert-border-size-bottom"],
	["borderSize.alert.left", "--alert-border-size-left"],
	["borderSize.alert.right", "--alert-border-size-right"],
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
	if (!/^fonts\.[^.]+\.weight$/.test(jsonPath)) return value;
	if (!isCssFontWeight(value)) {
		throw new Error(
			`${jsonPath} must be a CSS font-weight (400, 500, 600, 700, …) matching design-system/tokens/fonts.css (got ${JSON.stringify(value)})`,
		);
	}
	return String(Number(value));
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
	isCssFontWeight,
	isTypeScaleStep,
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

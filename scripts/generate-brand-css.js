#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const BRAND_FILENAME = "brand.json";
const OUTPUT_FILENAME = "brand.css";

/**
 * Maps brand.json fields to CSS custom properties. This is the single source of
 * truth for which design-system globals a brand is allowed to override. Each
 * entry is a [dotted brand.json path, --css-variable] pair. Anything not listed
 * here stays a shared design-system default (spacing, type scale, weights, etc.).
 */
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

	["fonts.slideTitle.family", "--font-family-slide-title", "fonts — slide title"],
	["fonts.slideTitle.sizeLg", "--slide-title-main-size-lg"],
	["fonts.slideTitle.sizeMd", "--slide-title-main-size-md"],
	["fonts.slideTitle.sizeSm", "--slide-title-main-size-sm"],

	["fonts.slideTitlePre.family", "--font-family-slide-title-pre", "fonts — slide title pre"],
	["fonts.slideTitlePre.size", "--slide-title-pre-size"],

	["fonts.slideTitleSub.family", "--font-family-slide-title-sub", "fonts — slide title sub"],
	["fonts.slideTitleSub.size", "--slide-title-sub-size"],

	["fonts.cardTitle.family", "--font-family-card-title", "fonts — card title"],
	["fonts.cardTitle.sizeLg", "--card-title-size-lg"],
	["fonts.cardTitle.sizeMd", "--card-title-size-md"],
	["fonts.cardTitle.sizeSm", "--card-title-size-sm"],

	["fonts.cardPretitle.family", "--font-family-card-pretitle", "fonts — card pretitle"],
	["fonts.cardPretitle.size", "--card-pretitle-size"],

	["fonts.paragraphTitle.family", "--font-family-paragraph-title", "fonts — paragraph title"],
	["fonts.paragraphTitle.sizeLg", "--paragraph-title-size-lg"],
	["fonts.paragraphTitle.sizeMd", "--paragraph-title-size-md"],
	["fonts.paragraphTitle.sizeSm", "--paragraph-title-size-sm"],

	["fonts.body.family", "--font-family-body", "fonts — body"],
	["fonts.body.sizeLg", "--body-size-lg"],
	["fonts.body.sizeMd", "--body-size-md"],
	["fonts.body.sizeSm", "--body-size-sm"],

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

function buildBrandCss(brand) {
	const lines = [];
	for (const [jsonPath, cssVar, group] of TOKEN_MAP) {
		const value = getPath(brand, jsonPath);
		if (value === undefined || value === null) continue;
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

module.exports = { generateBrandCss, buildBrandCss, TOKEN_MAP };

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

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
	["colors.primary", "--color-primary", "colors"],
	["colors.secondary", "--color-secondary"],
	["colors.tertiary", "--color-tertiary"],
	["colors.surface", "--color-surface"],
	["colors.surfaceOnPrimary", "--color-surface-on-primary"],
	["colors.text", "--color-text"],
	["colors.textOnPrimary", "--color-text-on-primary"],
	["colors.border", "--color-border"],
	["colors.positive", "--color-positive"],
	["colors.positiveBg", "--color-positive-bg"],
	["colors.warning", "--color-warning"],
	["colors.warningBg", "--color-warning-bg"],
	["colors.negative", "--color-negative"],
	["colors.negativeBg", "--color-negative-bg"],
	["colors.informative", "--color-informative"],
	["colors.informativeBg", "--color-informative-bg"],
	["colors.chart1", "--color-chart-1"],
	["colors.chart2", "--color-chart-2"],
	["colors.chart3", "--color-chart-3"],
	["colors.chart4", "--color-chart-4"],

	["fonts.display", "--font-family-display", "fonts"],
	["fonts.base", "--font-family-base"],

	["borderRadius.none", "--border-radius-none", "border radius"],
	["borderRadius.sm", "--border-radius-sm"],
	["borderRadius.med", "--border-radius-med"],
	["borderRadius.lg", "--border-radius-lg"],
	["borderRadius.full", "--border-radius-full"],

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

#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { TOKEN_MAP } = require("./generate-brand-css.js");

function usage() {
	console.error("Usage: node scripts/validate-brand.js <brand-directory>");
	console.error("Example: node scripts/validate-brand.js brands/riverton");
	process.exit(1);
}

function getPath(obj, dottedPath) {
	return dottedPath.split(".").reduce((acc, key) => {
		return acc && typeof acc === "object" ? acc[key] : undefined;
	}, obj);
}

function parseColor(value) {
	if (typeof value !== "string") return null;
	const rgb = value.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
	if (rgb) {
		return {
			r: Number(rgb[1]) / 255,
			g: Number(rgb[2]) / 255,
			b: Number(rgb[3]) / 255,
			a: rgb[4] === undefined ? 1 : Number(rgb[4]),
		};
	}
	const hex = value.match(/^#([0-9a-f]{6})$/i);
	if (hex) {
		const n = parseInt(hex[1], 16);
		return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a: 1 };
	}
	return null;
}

function lin(c) {
	return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function lum(rgb) {
	return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
}

function contrast(a, b) {
	const hi = Math.max(lum(a), lum(b));
	const lo = Math.min(lum(a), lum(b));
	return (hi + 0.05) / (lo + 0.05);
}

function compositeOn(fg, bg) {
	if (!fg || fg.a >= 1) return fg;
	const a = fg.a;
	return {
		r: fg.r * a + bg.r * (1 - a),
		g: fg.g * a + bg.g * (1 - a),
		b: fg.b * a + bg.b * (1 - a),
		a: 1,
	};
}

function validateBrand(brandDir) {
	const resolved = path.resolve(brandDir);
	const jsonPath = path.join(resolved, "brand.json");
	const slug = path.basename(resolved);
	const errors = [];
	const warnings = [];

	if (!fs.existsSync(jsonPath)) errors.push(`Missing ${jsonPath}`);
	if (errors.length) return { errors, warnings };

	const brand = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
	if (!brand.name) errors.push("brand.json is missing name");
	const logoFile = brand.logo || `${slug}-logo.svg`;
	const logoPath = path.join(resolved, logoFile);

	for (const [jsonPathKey] of TOKEN_MAP) {
		if (getPath(brand, jsonPathKey) === undefined) {
			errors.push(`Missing ${jsonPathKey}`);
		}
	}

	const colors = {};
	for (const key of [
		"primary",
		"secondary",
		"tertiary",
		"surface",
		"text",
		"textOnPrimary",
	]) {
		const raw = getPath(brand, `colors.${key}`);
		const parsed = parseColor(raw);
		if (!parsed) {
			errors.push(`colors.${key} is not rgb()/rgba()/#hex: ${raw}`);
		} else {
			colors[key] = parsed;
		}
	}

	if (colors.text && colors.tertiary) {
		const ratio = contrast(colors.text, colors.tertiary);
		if (ratio < 4.5) {
			errors.push(`text on tertiary contrast ${ratio.toFixed(2)} < 4.5`);
		}
	}
	if (colors.textOnPrimary && colors.primary) {
		const ratio = contrast(colors.textOnPrimary, colors.primary);
		if (ratio < 4.5) {
			errors.push(`textOnPrimary on primary contrast ${ratio.toFixed(2)} < 4.5`);
		}
	}
	if (colors.text && colors.surface) {
		const ink = compositeOn(colors.text, colors.surface);
		const ratio = contrast(ink, colors.surface);
		if (ratio < 4.5) {
			errors.push(`text on surface contrast ${ratio.toFixed(2)} < 4.5`);
		}
	}

	if (!fs.existsSync(logoPath)) {
		errors.push(`Missing ${logoFile}`);
	} else {
		const svg = fs.readFileSync(logoPath, "utf8");
		if (!/currentColor/.test(svg)) {
			warnings.push(`${logoFile} does not use currentColor; Figma fill binding to color/text-strong will not match HTML.`);
		}
		if (!/<symbol[\s\S]*id=/.test(svg)) {
			warnings.push(`${logoFile} has no <symbol id>; deck <use href> sprites expect one.`);
		}
	}

	return { errors, warnings, brand };
}

function main() {
	const brandDir = process.argv[2];
	if (!brandDir) usage();
	const { errors, warnings, brand } = validateBrand(brandDir);
	if (brand) console.log(`Brand: ${brand.name}`);
	for (const warning of warnings) console.warn(`warning: ${warning}`);
	if (errors.length) {
		for (const error of errors) console.error(`error: ${error}`);
		process.exit(1);
	}
	console.log("OK");
}

module.exports = { validateBrand };

if (require.main === module) {
	try {
		main();
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
}

#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
	TOKEN_MAP,
	isCssFontWeight,
	isFontWeightName,
	isFontNamedWeightPath,
	isFontRoleWeightPath,
	isTypeScaleStep,
	isFontSizePath,
	isSpacingStepPath,
	isSpacingScaleStep,
	isBorderRadiusRolePath,
	isBorderRadiusStep,
	isBorderSizeRolePath,
	isBorderSizeStep,
	isPixelDimensionPath,
	isPixelDimension,
	TYPE_SCALE_STEPS,
	SPACING_SCALE_STEPS,
	BORDER_RADIUS_STEPS,
	BORDER_SIZE_STEPS,
	FONT_WEIGHT_NAMES,
	BRAND_FILENAME,
} = require("./generate-brand-css.js");

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
	const jsonPath = path.join(resolved, BRAND_FILENAME);
	const slug = path.basename(resolved);
	const errors = [];
	const warnings = [];

	if (!fs.existsSync(jsonPath)) errors.push(`Missing ${jsonPath}`);
	if (errors.length) return { errors, warnings };

	const brand = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
	if (!brand.name) errors.push(`${BRAND_FILENAME} is missing name`);
	const logoFile = brand.logo || `${slug}-logo.svg`;
	const logoInvertedFile = logoFile.replace(/\.svg$/i, "-inverted.svg");
	const logoPath = path.join(resolved, logoFile);
	const logoInvertedPath = path.join(resolved, logoInvertedFile);

	for (const [jsonPathKey] of TOKEN_MAP) {
		if (getPath(brand, jsonPathKey) === undefined) {
			errors.push(`Missing ${jsonPathKey}`);
		}
	}

	for (const [jsonPathKey] of TOKEN_MAP) {
		if (isFontNamedWeightPath(jsonPathKey)) {
			const raw = getPath(brand, jsonPathKey);
			if (raw === undefined) continue;
			if (!isCssFontWeight(raw)) {
				errors.push(
					`${jsonPathKey} must be a CSS font-weight (400, 500, 600, 700, …) matching design-system/tokens/fonts.css (got ${JSON.stringify(raw)})`,
				);
			}
			continue;
		}
		if (isFontRoleWeightPath(jsonPathKey)) {
			const raw = getPath(brand, jsonPathKey);
			if (raw === undefined) continue;
			if (!isFontWeightName(raw)) {
				errors.push(
					`${jsonPathKey} must be a named weight (${FONT_WEIGHT_NAMES.join(", ")}) from fonts.weights (got ${JSON.stringify(raw)})`,
				);
			}
		}
	}

	for (const [jsonPathKey] of TOKEN_MAP) {
		if (!isFontSizePath(jsonPathKey)) continue;
		const raw = getPath(brand, jsonPathKey);
		if (raw === undefined) continue;
		if (!isTypeScaleStep(raw)) {
			errors.push(
				`${jsonPathKey} must be a type-scale step (${TYPE_SCALE_STEPS.join(", ")}) from design-system/tokens/typography.css (got ${JSON.stringify(raw)})`,
			);
		}
	}

	for (const [jsonPathKey] of TOKEN_MAP) {
		if (!isSpacingStepPath(jsonPathKey)) continue;
		const raw = getPath(brand, jsonPathKey);
		if (raw === undefined) continue;
		if (!isSpacingScaleStep(raw)) {
			errors.push(
				`${jsonPathKey} must be a spacing-scale step (${SPACING_SCALE_STEPS.join(", ")}) from design-system/tokens/spacing.css (got ${JSON.stringify(raw)})`,
			);
		}
	}

	for (const [jsonPathKey] of TOKEN_MAP) {
		if (!isBorderRadiusRolePath(jsonPathKey)) continue;
		const raw = getPath(brand, jsonPathKey);
		if (raw === undefined) continue;
		if (!isBorderRadiusStep(raw)) {
			errors.push(
				`${jsonPathKey} must be a border-radius step (${BORDER_RADIUS_STEPS.join(", ")}) from borderRadius (got ${JSON.stringify(raw)})`,
			);
		}
	}

	for (const [jsonPathKey] of TOKEN_MAP) {
		if (!isBorderSizeRolePath(jsonPathKey)) continue;
		const raw = getPath(brand, jsonPathKey);
		if (raw === undefined) continue;
		if (!isBorderSizeStep(raw)) {
			errors.push(
				`${jsonPathKey} must be a border-size step (${BORDER_SIZE_STEPS.join(", ")}) from borderSize (got ${JSON.stringify(raw)})`,
			);
		}
	}

	for (const [jsonPathKey] of TOKEN_MAP) {
		if (!isPixelDimensionPath(jsonPathKey)) continue;
		const raw = getPath(brand, jsonPathKey);
		if (raw === undefined) continue;
		if (!isPixelDimension(raw)) {
			errors.push(
				`${jsonPathKey} must be a positive integer pixel value (got ${JSON.stringify(raw)})`,
			);
		}
	}

	const pairs = [
		["colors.slide.foreground", "colors.slide.background", "slide foreground on slide background"],
		["colors.cover.foreground", "colors.cover.background", "cover foreground on cover background"],
		["colors.slide.surfaceForeground", "colors.slide.surfaceBackground", "slide surface foreground on slide surface background"],
		["colors.cover.surfaceForeground", "colors.cover.surfaceBackground", "cover surface foreground on cover surface background"],
	];

	for (const [fgPath, bgPath, label] of pairs) {
		const fgRaw = getPath(brand, fgPath);
		const bgRaw = getPath(brand, bgPath);
		const fg = parseColor(fgRaw);
		const bg = parseColor(bgRaw);
		if (!fg) errors.push(`${fgPath} is not rgb()/rgba()/#hex: ${fgRaw}`);
		if (!bg) errors.push(`${bgPath} is not rgb()/rgba()/#hex: ${bgRaw}`);
		if (fg && bg) {
			const ink = compositeOn(fg, bg);
			const ratio = contrast(ink, bg);
			if (ratio < 4.5) {
				errors.push(`${label} contrast ${ratio.toFixed(2)} < 4.5`);
			}
		}
	}

	function checkLogoSvg(file, filePath) {
		if (!fs.existsSync(filePath)) {
			errors.push(`Missing ${file}`);
			return;
		}
		const svg = fs.readFileSync(filePath, "utf8");
		if (!/<svg[^>]*viewBox=/i.test(svg)) {
			errors.push(`${file} needs a viewBox on the root <svg> so it can be used as an <img>.`);
		}
		if (/currentColor/.test(svg)) {
			warnings.push(`${file} uses currentColor; bake fills so brand colors are not overwritten.`);
		}
		if (/<symbol[\s\S]*id=/.test(svg)) {
			warnings.push(`${file} is a <symbol> sprite; use a standalone SVG with baked fills.`);
		}
	}

	checkLogoSvg(logoFile, logoPath);
	checkLogoSvg(logoInvertedFile, logoInvertedPath);

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

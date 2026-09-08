#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
	TOKEN_MAP,
	isCssFontWeight,
	isFontWeightName,
	isFontFamilyName,
	isFontNamedFamilyPath,
	isFontRoleFamilyPath,
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
	FONT_FAMILY_NAMES,
	SEMANTIC_COLOR_VARIANTS,
	SEMANTIC_COLOR_TONES,
	semanticColorGroupKey,
	isPretitleUppercasePath,
	isPretitleUppercaseBoolean,
	isPretitleLetterSpacingPath,
	isPretitleLetterSpacing,
	isBrandSwatchPath,
	isColorLiteralPath,
	isColorLiteral,
	isColorRolePath,
	resolveColorRef,
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
	if (!brand.basic || !brand.basic.name) {
		errors.push(`${BRAND_FILENAME} is missing basic.name`);
	}
	const logoFile = (brand.basic && brand.basic.logo) || `${slug}-logo.svg`;
	const logoInvertedFile = logoFile.replace(/\.svg$/i, "-inverted.svg");
	const logoPath = path.join(resolved, logoFile);
	const logoInvertedPath = path.join(resolved, logoInvertedFile);

	for (const [jsonPathKey] of TOKEN_MAP) {
		if (isBrandSwatchPath(jsonPathKey)) continue;
		if (getPath(brand, jsonPathKey) === undefined) {
			errors.push(`Missing ${jsonPathKey}`);
		}
	}

	const palette = brand.palette;
	if (!palette || typeof palette !== "object" || !palette.brand || typeof palette.brand !== "object") {
		errors.push("Missing palette.brand (need at least one of 1–6)");
	} else {
		const present = Object.keys(palette.brand).filter((k) => /^[1-6]$/.test(k));
		if (present.length === 0) {
			errors.push("palette.brand must define at least one of 1–6");
		}
	}

	for (const [jsonPathKey] of TOKEN_MAP) {
		if (!isColorLiteralPath(jsonPathKey)) continue;
		const raw = getPath(brand, jsonPathKey);
		if (raw === undefined) continue;
		if (!isColorLiteral(raw)) {
			errors.push(
				`${jsonPathKey} must be rgb()/rgba()/#rrggbb (got ${JSON.stringify(raw)})`,
			);
		}
	}

	for (const [jsonPathKey] of TOKEN_MAP) {
		if (!isColorRolePath(jsonPathKey)) continue;
		const raw = getPath(brand, jsonPathKey);
		if (raw === undefined) continue;
		try {
			resolveColorRef(brand, raw, jsonPathKey);
		} catch (error) {
			errors.push(error.message);
		}
	}

	for (const [jsonPathKey] of TOKEN_MAP) {
		if (isFontNamedFamilyPath(jsonPathKey)) {
			const raw = getPath(brand, jsonPathKey);
			if (raw === undefined) continue;
			if (typeof raw !== "string" || raw.trim() === "") {
				errors.push(
					`${jsonPathKey} must be a CSS font stack (got ${JSON.stringify(raw)})`,
				);
			}
			continue;
		}
		if (isFontRoleFamilyPath(jsonPathKey)) {
			const raw = getPath(brand, jsonPathKey);
			if (raw === undefined) continue;
			if (!isFontFamilyName(raw)) {
				errors.push(
					`${jsonPathKey} must be a named family (${FONT_FAMILY_NAMES.join(", ")}) from font.family (got ${JSON.stringify(raw)})`,
				);
			}
			continue;
		}
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
					`${jsonPathKey} must be a named weight (${FONT_WEIGHT_NAMES.join(", ")}) from font.weight (got ${JSON.stringify(raw)})`,
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
				`${jsonPathKey} must be a border-radius step (${BORDER_RADIUS_STEPS.join(", ")}) from border.radius (got ${JSON.stringify(raw)})`,
			);
		}
	}

	for (const [jsonPathKey] of TOKEN_MAP) {
		if (!isBorderSizeRolePath(jsonPathKey)) continue;
		const raw = getPath(brand, jsonPathKey);
		if (raw === undefined) continue;
		if (!isBorderSizeStep(raw)) {
			errors.push(
				`${jsonPathKey} must be a border-size step (${BORDER_SIZE_STEPS.join(", ")}) from border.size (got ${JSON.stringify(raw)})`,
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

	for (const [jsonPathKey] of TOKEN_MAP) {
		if (!isPretitleUppercasePath(jsonPathKey)) continue;
		const raw = getPath(brand, jsonPathKey);
		if (raw === undefined) continue;
		if (!isPretitleUppercaseBoolean(raw)) {
			errors.push(
				`${jsonPathKey} must be a boolean (true = uppercase, false = no transform) (got ${JSON.stringify(raw)})`,
			);
		}
	}

	for (const [jsonPathKey] of TOKEN_MAP) {
		if (!isPretitleLetterSpacingPath(jsonPathKey)) continue;
		const raw = getPath(brand, jsonPathKey);
		if (raw === undefined) continue;
		if (!isPretitleLetterSpacing(raw)) {
			errors.push(
				`${jsonPathKey} must be a percentage string such as "2%" (got ${JSON.stringify(raw)})`,
			);
		}
	}

	const pairs = [
		["slide.canvas.foreground", "slide.canvas.background", "slide canvas foreground on slide canvas background"],
		["cover.canvas.foreground", "cover.canvas.background", "cover canvas foreground on cover canvas background"],
		["slide.surface.foreground", "slide.surface.background", "slide surface foreground on slide surface background"],
		["cover.surface.foreground", "cover.surface.background", "cover surface foreground on cover surface background"],
	];

	for (const [fgPath, bgPath, label] of pairs) {
		const fgRaw = getPath(brand, fgPath);
		const bgRaw = getPath(brand, bgPath);
		let fgResolved;
		let bgResolved;
		try {
			fgResolved = resolveColorRef(brand, fgRaw, fgPath);
		} catch (error) {
			errors.push(error.message);
		}
		try {
			bgResolved = resolveColorRef(brand, bgRaw, bgPath);
		} catch (error) {
			errors.push(error.message);
		}
		const fg = parseColor(fgResolved);
		const bg = parseColor(bgResolved);
		if (fgResolved && !fg) errors.push(`${fgPath} resolved to non-color: ${fgResolved}`);
		if (bgResolved && !bg) errors.push(`${bgPath} resolved to non-color: ${bgResolved}`);
		if (fg && bg) {
			const ink = compositeOn(fg, bg);
			const ratio = contrast(ink, bg);
			if (ratio < 4.5) {
				errors.push(`${label} contrast ${ratio.toFixed(2)} < 4.5`);
			}
		}
	}

	let slideBgResolved;
	try {
		slideBgResolved = resolveColorRef(
			brand,
			getPath(brand, "slide.canvas.background"),
			"slide.canvas.background",
		);
	} catch (error) {
		errors.push(error.message);
	}
	const slideBg = parseColor(slideBgResolved);

	for (const variant of SEMANTIC_COLOR_VARIANTS) {
		for (const tone of SEMANTIC_COLOR_TONES) {
			const group = semanticColorGroupKey(variant);
			const fgPath = `${group}.${tone}.foregroundStrong`;
			const bgPath = `${group}.${tone}.backgroundBase`;
			const fg = parseColor(getPath(brand, fgPath));
			const bg = parseColor(getPath(brand, bgPath));
			if (!fg) errors.push(`${fgPath} is not a parseable color`);
			if (!bg) errors.push(`${bgPath} is not a parseable color`);
			if (fg && bg) {
				const canvas =
					bg.a < 1 && slideBg ? slideBg : bg.a < 1 ? { r: 1, g: 1, b: 1, a: 1 } : bg;
				const fill = compositeOn(bg, canvas);
				const ink = compositeOn(fg, fill);
				const ratio = contrast(ink, fill);
				if (ratio < 4.5) {
					errors.push(
						`${group}.${tone} foregroundStrong on backgroundBase contrast ${ratio.toFixed(2)} < 4.5`,
					);
				}
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
	if (brand) console.log(`Brand: ${(brand.basic && brand.basic.name) || slug}`);
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

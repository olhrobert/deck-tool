const fs = require("fs");
const path = require("path");

const brandCss = require("../../generate-brand-css.js");

const ROOT = path.join(__dirname, "..", "..", "..");
const TOKENS = path.join(ROOT, "design-system", "tokens");

const FONT_ROLES = ["title", "heading", "stat", "text", "label"];
const COLOR_SCOPES = [
	"FRAME_FILL",
	"SHAPE_FILL",
	"TEXT_FILL",
	"STROKE_COLOR",
];

function getPath(obj, dottedPath) {
	return brandCss.getPath(obj, dottedPath);
}

function loadBrand(brandDir) {
	const resolved = path.isAbsolute(brandDir)
		? brandDir
		: path.join(ROOT, brandDir);
	const settingsPath = path.join(resolved, "brand-settings.json");
	if (!fs.existsSync(settingsPath)) {
		throw new Error(`No brand-settings.json in ${resolved}`);
	}
	return {
		dir: resolved,
		slug: path.basename(resolved),
		settings: JSON.parse(fs.readFileSync(settingsPath, "utf8")),
	};
}

function cssVarForJsonPath(jsonPath) {
	const hit = brandCss.TOKEN_MAP.find((entry) => entry[0] === jsonPath);
	if (!hit || !hit[1]) {
		throw new Error(`TOKEN_MAP has no CSS variable for ${jsonPath}`);
	}
	return hit[1];
}

function parseFirstFamily(stack) {
	if (typeof stack !== "string" || stack.trim() === "") {
		throw new Error(`Font stack must be a string (got ${JSON.stringify(stack)})`);
	}
	return stack.split(",")[0].trim().replace(/^["']|["']$/g, "");
}

function parsePx(value) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value !== "string") return null;
	const match = value.trim().match(/^([0-9.]+)px$/i);
	return match ? Number(match[1]) : null;
}

function parseTokenScale(filePath, prefix) {
	const css = fs.readFileSync(filePath, "utf8");
	const map = {};
	const re = new RegExp(`--${prefix}-([^:\\s]+):\\s*([0-9.]+)px`, "g");
	let match;
	while ((match = re.exec(css))) {
		map[match[1]] = Number(match[2]);
	}
	return map;
}

function spacingScale() {
	return parseTokenScale(path.join(TOKENS, "spacing.css"), "spacing");
}

function typeScale() {
	return parseTokenScale(path.join(TOKENS, "typography.css"), "text-size");
}

function spacingPx(step) {
	const px = spacingScale()[String(step)];
	if (px === undefined) {
		throw new Error(`Unknown spacing step ${JSON.stringify(step)}`);
	}
	return px;
}

function typeSizePx(step) {
	const px = typeScale()[String(step)];
	if (px === undefined) {
		throw new Error(`Unknown type-scale step ${JSON.stringify(step)}`);
	}
	return px;
}

function borderRadiusPx(brand, step) {
	const raw = getPath(brand, `foundations.border.radius.${step}`);
	const px = parsePx(raw);
	if (px === null) {
		throw new Error(
			`foundations.border.radius.${step} must be px (got ${JSON.stringify(raw)})`,
		);
	}
	return px;
}

function borderSizePx(brand, step) {
	const raw = getPath(brand, `foundations.border.size.${step}`);
	const px = parsePx(raw);
	if (px === null) {
		throw new Error(
			`foundations.border.size.${step} must be px (got ${JSON.stringify(raw)})`,
		);
	}
	return px;
}

function figmaColor(cssValue) {
	const channels = brandCss.parseColorChannels(cssValue);
	if (!channels) {
		throw new Error(`Cannot parse color ${JSON.stringify(cssValue)}`);
	}
	return {
		r: channels.r / 255,
		g: channels.g / 255,
		b: channels.b / 255,
		a: channels.a,
	};
}

function cssToFigmaName(cssVar) {
	return String(cssVar).replace(/^--/, "");
}

function unsuffixTheme(cssVar) {
	return String(cssVar).replace(/-(light|dark)$/, "");
}

function paletteRefToVariableName(ref) {
	if (typeof ref !== "string") return null;
	if (ref.startsWith("brand.")) {
		return `color-palette-brand-${ref.slice("brand.".length)}`;
	}
	if (ref.startsWith("semantic.")) {
		return `color-semantic-${ref.slice("semantic.".length)}`;
	}
	if (ref.startsWith("chart.")) {
		return `color-palette-chart-${ref.slice("chart.".length)}`;
	}
	return null;
}

function paintBinding(raw) {
	if (typeof raw === "string") {
		if (brandCss.isColorLiteral(raw)) {
			return { variable: null, color: figmaColor(raw), opacity: 1 };
		}
		const variable = paletteRefToVariableName(raw);
		if (!variable) {
			throw new Error(`Unknown palette ref ${JSON.stringify(raw)}`);
		}
		return { variable, opacity: 1 };
	}
	if (raw && typeof raw === "object" && typeof raw.color === "string") {
		const base = paintBinding(raw.color);
		return {
			...base,
			opacity: raw.opacity === undefined ? 1 : raw.opacity,
		};
	}
	throw new Error(`Invalid paint value ${JSON.stringify(raw)}`);
}

function resolveFontRole(brand, role) {
	const spec = getPath(brand, `foundations.font.${role}`);
	if (!spec || !brandCss.isFontFamilyName(spec.family)) {
		throw new Error(`foundations.font.${role}.family must be display|base`);
	}
	if (!brandCss.isFontWeightName(spec.weight)) {
		throw new Error(`foundations.font.${role}.weight must be a named weight`);
	}
	const stack = getPath(brand, `foundations.font.family.${spec.family}`);
	const weight = getPath(brand, `foundations.font.weight.${spec.weight}`);
	return {
		family: parseFirstFamily(stack),
		weight: Number(weight),
	};
}

function colorVariable({ jsonPath, settings }) {
	const raw = getPath(settings, jsonPath);
	if (raw === undefined || raw === null) {
		throw new Error(`Missing ${jsonPath}`);
	}
	const cssVar = cssVarForJsonPath(jsonPath);
	const name = cssToFigmaName(cssVar);
	const codeSyntax = `var(${cssVar})`;
	if (typeof raw === "string" && !brandCss.isColorLiteral(raw)) {
		const alias = paletteRefToVariableName(raw);
		if (!alias) {
			throw new Error(`${jsonPath} unknown palette ref ${JSON.stringify(raw)}`);
		}
		return {
			name,
			resolvedType: "COLOR",
			scopes: COLOR_SCOPES,
			codeSyntax: { WEB: codeSyntax },
			alias,
			value: null,
		};
	}
	const literal = brandCss.resolveColorRef(settings, raw, jsonPath);
	return {
		name,
		resolvedType: "COLOR",
		scopes: COLOR_SCOPES,
		codeSyntax: { WEB: codeSyntax },
		alias: null,
		value: figmaColor(literal),
	};
}

function buildBrandVariables(settings) {
	const variables = [];

	for (const key of ["1", "2", "3", "4", "5", "6"]) {
		const jsonPath = `foundations.color.brand.${key}`;
		if (getPath(settings, jsonPath) == null) continue;
		variables.push(
			colorVariable({
				jsonPath,
				settings,
			}),
		);
	}

	for (const key of brandCss.SEMANTIC_HUE_KEYS) {
		variables.push(
			colorVariable({
				jsonPath: `foundations.color.semantic.${key}`,
				settings,
			}),
		);
	}

	for (const key of ["1", "2", "3", "4"]) {
		const jsonPath = `foundations.color.chart.${key}`;
		if (getPath(settings, jsonPath) == null) continue;
		variables.push(
			colorVariable({
				jsonPath,
				settings,
			}),
		);
	}

	for (const key of brandCss.TONE_KEYS) {
		const jsonPath = `foundations.tone.${key}`;
		const value = getPath(settings, jsonPath);
		if (typeof value !== "number") {
			throw new Error(`${jsonPath} must be a number`);
		}
		variables.push({
			name: `tone-${key}`,
			resolvedType: "FLOAT",
			scopes: ["OPACITY"],
			codeSyntax: { WEB: `var(${cssVarForJsonPath(jsonPath)})` },
			alias: null,
			value: value * 100,
		});
	}

	for (const role of FONT_ROLES) {
		const spec = getPath(settings, `foundations.font.${role}`);
		if (!spec || !brandCss.isFontFamilyName(spec.family)) {
			throw new Error(`foundations.font.${role}.family must be display|base`);
		}
		if (!brandCss.isFontWeightName(spec.weight)) {
			throw new Error(`foundations.font.${role}.weight must be a named weight`);
		}
		variables.push({
			name: `font-${role}-family`,
			resolvedType: "STRING",
			scopes: ["FONT_FAMILY"],
			codeSyntax: {
				WEB: `var(${cssVarForJsonPath(`foundations.font.${role}.family`)})`,
			},
			alias: `font-family-${spec.family}`,
			value: null,
		});
		variables.push({
			name: `font-${role}-weight`,
			resolvedType: "FLOAT",
			scopes: ["FONT_WEIGHT"],
			codeSyntax: {
				WEB: `var(${cssVarForJsonPath(`foundations.font.${role}.weight`)})`,
			},
			alias: `font-weight-${spec.weight}`,
			value: null,
		});
	}

	return {
		collection: { name: "Brand", mode: "Value" },
		variables,
	};
}

module.exports = {
	ROOT,
	FONT_ROLES,
	loadBrand,
	cssVarForJsonPath,
	cssToFigmaName,
	unsuffixTheme,
	parseFirstFamily,
	parsePx,
	spacingScale,
	typeScale,
	spacingPx,
	typeSizePx,
	borderRadiusPx,
	borderSizePx,
	figmaColor,
	paletteRefToVariableName,
	paintBinding,
	resolveFontRole,
	buildBrandVariables,
	getPath,
};

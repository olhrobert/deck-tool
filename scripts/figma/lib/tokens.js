const fs = require("fs");
const path = require("path");

const brandCss = require("../../generate-brand-css.js");
const {
	ROOT,
	getPath,
	cssToFigmaName,
	unsuffixTheme,
	parseFirstFamily,
	parsePx,
	spacingScale,
	typeScale,
	figmaColor,
	paletteRefToVariableName,
	buildBrandVariables,
} = require("./brand.js");

const TOKENS = path.join(ROOT, "design-system", "tokens");

const COLOR_SCOPES = [
	"FRAME_FILL",
	"SHAPE_FILL",
	"TEXT_FILL",
	"STROKE_COLOR",
];
const GAP_SCOPES = ["GAP"];
const RADIUS_SCOPES = ["CORNER_RADIUS"];
const STROKE_FLOAT_SCOPES = ["STROKE_FLOAT"];
const SIZE_SCOPES = ["WIDTH_HEIGHT"];
const FONT_SIZE_SCOPES = ["FONT_SIZE"];
const LETTER_SCOPES = ["LETTER_SPACING"];
const LINE_SCOPES = ["LINE_HEIGHT"];
const SCALE_SCOPES = ["GAP", "WIDTH_HEIGHT", "FONT_SIZE"];

function themeFromCss(cssVar) {
	if (cssVar.endsWith("-dark")) return "Dark";
	if (cssVar.endsWith("-light")) return "Light";
	return null;
}

function colorOpacity(raw) {
	if (raw && typeof raw === "object" && typeof raw.opacity === "number") {
		return raw.opacity;
	}
	return 1;
}

function modeValueFromColorRaw(settings, jsonPath, raw) {
	if (raw && typeof raw === "object" && typeof raw.color === "string") {
		const alias = paletteRefToVariableName(raw.color);
		const opacity = colorOpacity(raw);
		const literal = brandCss.resolveColorRef(settings, raw, jsonPath);
		return {
			alias,
			opacity,
			value: alias && opacity === 1 ? null : figmaColor(literal),
		};
	}
	if (typeof raw === "string" && !brandCss.isColorLiteral(raw)) {
		const alias = paletteRefToVariableName(raw);
		if (alias) return { alias, opacity: 1, value: null };
	}
	const literal = brandCss.resolveColorRef(settings, raw, jsonPath);
	return { alias: null, opacity: 1, value: figmaColor(literal) };
}

function finalizeColorModes(light, dark) {
	const lightOp = light.opacity == null ? 1 : light.opacity;
	const darkOp = dark.opacity == null ? 1 : dark.opacity;
	const sharedPaintOpacity = lightOp === darkOp && lightOp !== 1 ? lightOp : 1;

	function forMode(entry, opacity) {
		if (entry.alias && (opacity === 1 || sharedPaintOpacity !== 1)) {
			return { alias: entry.alias, value: null };
		}
		return { alias: null, value: entry.value };
	}

	return {
		Light: forMode(light, lightOp),
		Dark: forMode(dark, darkOp),
		paintOpacity: sharedPaintOpacity,
	};
}

function spacingCollection() {
	const scale = spacingScale();
	return {
		name: "Spacing",
		modes: ["Value"],
		variables: Object.entries(scale).map(([step, px]) => ({
			name: `spacing-${step}`,
			resolvedType: "FLOAT",
			scopes: SCALE_SCOPES,
			codeSyntax: { WEB: `var(--spacing-${step})` },
			alias: null,
			value: px,
		})),
	};
}

function lineHeightExtras() {
	const css = fs.readFileSync(path.join(TOKENS, "typography.css"), "utf8");
	const extras = [];
	const seen = new Set();
	const re = /--([a-z0-9-]+-lineheight):\s*([0-9.]+)/g;
	let match;
	while ((match = re.exec(css))) {
		const cssVar = `--${match[1]}`;
		const name = cssToFigmaName(cssVar);
		if (seen.has(name)) continue;
		seen.add(name);
		extras.push({
			name,
			resolvedType: "FLOAT",
			scopes: LINE_SCOPES,
			codeSyntax: { WEB: `var(${cssVar})` },
			alias: null,
			value: Math.round(Number(match[2]) * 100),
		});
	}
	if (!seen.has("text-lineheight")) {
		extras.push({
			name: "text-lineheight",
			resolvedType: "FLOAT",
			scopes: LINE_SCOPES,
			codeSyntax: { WEB: "1.2" },
			alias: null,
			value: 120,
		});
	}
	return extras;
}

function typographyCollection(settings) {
	const scale = typeScale();
	const variables = Object.entries(scale).map(([step, px]) => ({
		name: `text-size-${step}`,
		resolvedType: "FLOAT",
		scopes: FONT_SIZE_SCOPES,
		codeSyntax: { WEB: `var(--text-size-${step})` },
		alias: null,
		value: px,
	}));

	for (const name of brandCss.FONT_FAMILY_NAMES) {
		const stack = getPath(settings, `foundations.font.family.${name}`);
		variables.push({
			name: `font-family-${name}`,
			resolvedType: "STRING",
			scopes: ["FONT_FAMILY"],
			codeSyntax: { WEB: `var(--font-family-${name})` },
			alias: null,
			value: parseFirstFamily(stack),
		});
	}
	for (const name of brandCss.FONT_WEIGHT_NAMES) {
		const weight = getPath(settings, `foundations.font.weight.${name}`);
		variables.push({
			name: `font-weight-${name}`,
			resolvedType: "FLOAT",
			scopes: ["FONT_WEIGHT"],
			codeSyntax: { WEB: `var(--font-weight-${name})` },
			alias: null,
			value: Number(weight),
		});
	}

	variables.push(...lineHeightExtras());

	return { name: "Typography", modes: ["Value"], variables };
}

function shapeCollection(settings) {
	const variables = [];
	for (const step of brandCss.BORDER_RADIUS_STEPS) {
		const raw = getPath(settings, `foundations.border.radius.${step}`);
		const px = parsePx(raw);
		if (px === null) {
			throw new Error(
				`foundations.border.radius.${step} must be px (got ${JSON.stringify(raw)})`,
			);
		}
		variables.push({
			name: `border-radius-${step}`,
			resolvedType: "FLOAT",
			scopes: RADIUS_SCOPES,
			codeSyntax: { WEB: `var(--border-radius-${step})` },
			alias: null,
			value: px,
		});
	}
	for (const step of brandCss.BORDER_SIZE_STEPS) {
		const raw = getPath(settings, `foundations.border.size.${step}`);
		const px = parsePx(raw);
		if (px === null) {
			throw new Error(
				`foundations.border.size.${step} must be px (got ${JSON.stringify(raw)})`,
			);
		}
		variables.push({
			name: `border-size-${step}`,
			resolvedType: "FLOAT",
			scopes: STROKE_FLOAT_SCOPES,
			codeSyntax: { WEB: `var(--border-size-${step})` },
			alias: null,
			value: px,
		});
	}
	return { name: "Shape", modes: ["Value"], variables };
}

function brandCollection(settings) {
	return {
		name: "Brand",
		modes: ["Value"],
		variables: buildBrandVariables(settings).variables,
	};
}

function isThemedTokenMapEntry(jsonPath, cssVar) {
	if (!cssVar) return false;
	if (!/-(light|dark)$/.test(cssVar)) return false;
	return (
		brandCss.isCardColorPath(jsonPath) ||
		brandCss.isCalloutColorPath(jsonPath) ||
		brandCss.isBadgeColorPath(jsonPath) ||
		brandCss.isStampColorPath(jsonPath) ||
		brandCss.isColorRolePath(jsonPath)
	);
}

function colorCollection(settings) {
	const grouped = new Map();
	for (const [jsonPath, cssVar] of brandCss.TOKEN_MAP) {
		if (!isThemedTokenMapEntry(jsonPath, cssVar)) continue;
		const theme = themeFromCss(cssVar);
		const unsuffixed = unsuffixTheme(cssVar);
		if (!grouped.has(unsuffixed)) {
			grouped.set(unsuffixed, { cssVar: unsuffixed, modes: {} });
		}
		const raw = getPath(settings, jsonPath);
		if (raw === undefined || raw === null) continue;
		grouped.get(unsuffixed).modes[theme] = modeValueFromColorRaw(
			settings,
			jsonPath,
			raw,
		);
	}

	const surfaceBg = getPath(settings, "components.slide.surface.background");
	const surfaceFg = getPath(settings, "components.slide.surface.foreground");
	if (surfaceBg != null) {
		const entry = modeValueFromColorRaw(
			settings,
			"components.slide.surface.background",
			surfaceBg,
		);
		grouped.set("--color-slide-surface-background", {
			cssVar: "--color-slide-surface-background",
			modes: { Light: entry, Dark: entry },
		});
	}
	if (surfaceFg != null) {
		const entry = modeValueFromColorRaw(
			settings,
			"components.slide.surface.foreground",
			surfaceFg,
		);
		grouped.set("--color-slide-surface-foreground", {
			cssVar: "--color-slide-surface-foreground",
			modes: { Light: entry, Dark: entry },
		});
	}

	const variables = [];
	for (const group of grouped.values()) {
		if (!group.modes.Light && !group.modes.Dark) continue;
		const light = group.modes.Light || group.modes.Dark;
		const dark = group.modes.Dark || group.modes.Light;
		const finalized = finalizeColorModes(light, dark);
		const variable = {
			name: cssToFigmaName(group.cssVar),
			resolvedType: "COLOR",
			scopes: COLOR_SCOPES,
			codeSyntax: { WEB: `var(${group.cssVar})` },
			values: { Light: finalized.Light, Dark: finalized.Dark },
		};
		if (finalized.paintOpacity !== 1) {
			variable.paintOpacity = finalized.paintOpacity;
		}
		variables.push(variable);
	}

	return { name: "Color", modes: ["Light", "Dark"], variables };
}

function shouldSkipComponentPath(jsonPath, cssVar) {
	if (!cssVar) return true;
	if (jsonPath.startsWith("foundations.")) return true;
	if (brandCss.isColorThemePath(jsonPath)) return true;
	if (brandCss.isCardLayoutPath(jsonPath)) return true;
	if (brandCss.isPretitleUppercasePath(jsonPath)) return true;
	if (brandCss.isSlidePretitleDefaultPath(jsonPath)) return true;
	if (brandCss.isBadgeBorderPath(jsonPath)) return true;
	if (brandCss.isAttributionBoxDefaultPath(jsonPath)) return true;
	if (isThemedTokenMapEntry(jsonPath, cssVar)) return true;
	if (
		jsonPath === "components.slide.surface.background" ||
		jsonPath === "components.slide.surface.foreground"
	) {
		return true;
	}
	return false;
}

function componentAliasForToken(jsonPath, cssVar, raw) {
	const name = cssToFigmaName(cssVar);
	const codeSyntax = { WEB: `var(${cssVar})` };

	if (brandCss.isFontRoleRefPath(jsonPath)) {
		if (!brandCss.isFontStyleRoleName(raw)) return [];
		return [
			{
				name: `${name}-family`,
				resolvedType: "STRING",
				scopes: ["FONT_FAMILY"],
				codeSyntax: { WEB: `var(${cssVar}-family)` },
				alias: `font-${raw}-family`,
				value: null,
			},
			{
				name: `${name}-weight`,
				resolvedType: "FLOAT",
				scopes: ["FONT_WEIGHT"],
				codeSyntax: { WEB: `var(${cssVar}-weight)` },
				alias: `font-${raw}-weight`,
				value: null,
			},
		];
	}

	if (brandCss.isSpacingStepPath(jsonPath)) {
		const sizeToken =
			jsonPath === "components.badge.icon.size" ||
			jsonPath === "components.stamp.defaultSize";
		return [
			{
				name,
				resolvedType: "FLOAT",
				scopes: sizeToken ? SIZE_SCOPES : GAP_SCOPES,
				codeSyntax,
				alias: `spacing-${raw}`,
				value: null,
			},
		];
	}

	if (brandCss.isFontSizePath(jsonPath)) {
		return [
			{
				name,
				resolvedType: "FLOAT",
				scopes: FONT_SIZE_SCOPES,
				codeSyntax,
				alias: `text-size-${raw}`,
				value: null,
			},
		];
	}

	if (brandCss.isBorderRadiusRolePath(jsonPath)) {
		return [
			{
				name,
				resolvedType: "FLOAT",
				scopes: RADIUS_SCOPES,
				codeSyntax,
				alias: `border-radius-${raw}`,
				value: null,
			},
		];
	}

	if (brandCss.isBorderSizeRolePath(jsonPath)) {
		return [
			{
				name,
				resolvedType: "FLOAT",
				scopes: STROKE_FLOAT_SCOPES,
				codeSyntax,
				alias: `border-size-${raw}`,
				value: null,
			},
		];
	}

	if (brandCss.isPixelDimensionPath(jsonPath)) {
		return [
			{
				name,
				resolvedType: "FLOAT",
				scopes: SIZE_SCOPES,
				codeSyntax,
				alias: null,
				value: Number(raw),
			},
		];
	}

	if (brandCss.isPretitleLetterSpacingPath(jsonPath)) {
		const percent = String(raw).endsWith("%")
			? Number(String(raw).slice(0, -1))
			: Number(raw);
		return [
			{
				name,
				resolvedType: "FLOAT",
				scopes: LETTER_SCOPES,
				codeSyntax,
				alias: null,
				value: percent,
			},
		];
	}

	if (brandCss.isStampScalePath(jsonPath)) {
		return [
			{
				name,
				resolvedType: "FLOAT",
				scopes: SIZE_SCOPES,
				codeSyntax,
				alias: null,
				value: Number(raw),
			},
		];
	}

	return null;
}

function cardMetaSizeAlias() {
	return {
		name: "card-meta-size",
		resolvedType: "FLOAT",
		scopes: FONT_SIZE_SCOPES,
		codeSyntax: { WEB: "var(--card-meta-size)" },
		alias: "text-size-300",
		value: null,
	};
}

function componentCollection(settings) {
	const variables = [];
	const seen = new Set();

	for (const [jsonPath, cssVar] of brandCss.TOKEN_MAP) {
		if (shouldSkipComponentPath(jsonPath, cssVar)) continue;
		const raw = getPath(settings, jsonPath);
		if (raw === undefined || raw === null) continue;
		const entries = componentAliasForToken(jsonPath, cssVar, raw);
		if (!entries) continue;
		for (const entry of entries) {
			if (seen.has(entry.name)) continue;
			seen.add(entry.name);
			variables.push(entry);
		}
	}

	const meta = cardMetaSizeAlias();
	if (!seen.has(meta.name)) variables.push(meta);

	return { name: "Component", modes: ["Value"], variables };
}

function buildAllCollections(settings) {
	const collections = [
		spacingCollection(),
		typographyCollection(settings),
		shapeCollection(settings),
		brandCollection(settings),
		colorCollection(settings),
		componentCollection(settings),
	];
	const seen = new Set();
	for (const collection of collections) {
		for (const variable of collection.variables) {
			if (seen.has(variable.name)) {
				throw new Error(
					`Duplicate Figma variable name ${JSON.stringify(variable.name)}`,
				);
			}
			seen.add(variable.name);
		}
	}
	return { collections };
}

module.exports = {
	buildAllCollections,
	cssToFigmaName,
	unsuffixTheme,
};

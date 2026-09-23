#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const { loadBrand, getPath, cssToFigmaName } = require("./lib/brand.js");
const { parseFragment, findChild, textContent, toAutoLayout } = require("./lib/html.js");
const { generatePlugin } = require("./generate-plugin.js");

const DEFAULT_BRAND = "brands/gratia";
const ROOT = path.join(__dirname, "..", "..");
const COMPONENTS_DIR = path.join(ROOT, "design-system", "components");
const OUT_DIR = path.join(__dirname, "components");

const CARD_VARIANTS = [
	"neutral",
	"emphasis",
	"positive",
	"warning",
	"negative",
	"informative",
];
const CALLOUT_VARIANTS = [
	"neutral",
	"positive",
	"warning",
	"negative",
	"informative",
];

function usage() {
	console.error("Usage: node scripts/figma/build-component.js <name> [brand-directory]");
	console.error("Supported names: card, badge, stamp, callout, analyst, all");
	console.error("Default brand-directory: brands/gratia");
	process.exit(1);
}

function componentHtml(name) {
	return path.join(COMPONENTS_DIR, name, `${name}.html`);
}

function rawOpacity(raw) {
	if (raw && typeof raw === "object" && typeof raw.opacity === "number") {
		return raw.opacity;
	}
	return 1;
}

function uniformPaintOpacity(lightRaw, darkRaw) {
	const light = rawOpacity(lightRaw);
	const dark = rawOpacity(darkRaw);
	return light === dark && light !== 1 ? light : 1;
}

function paintFor(settings, jsonPrefix, variant, cssVar) {
	const light = getPath(settings, `${jsonPrefix}.${variant}.light`);
	const dark = getPath(settings, `${jsonPrefix}.${variant}.dark`);
	return {
		variable: cssToFigmaName(cssVar),
		opacity: uniformPaintOpacity(light, dark),
	};
}

function parseRoot(name) {
	const html = fs.readFileSync(componentHtml(name), "utf8");
	const tree = parseFragment(html);
	const root =
		findChild(tree, name) ||
		(tree.children || []).find((child) => child.tag === name);
	if (!root) {
		throw new Error(`${name}.html has no <${name}> root`);
	}
	return root;
}

function buildCard(settings) {
	const cardNode = parseRoot("card");
	const autoLayout = toAutoLayout(cardNode, {
		defaultGapStep: String(getPath(settings, "components.card.gap.sm") ?? "2"),
	});

	const uppercase = getPath(settings, "components.card.pretitle.uppercase");
	const body = findChild(cardNode, "text");
	const bodySize = (body && body.attrs && body.attrs.size) || "350";
	const pretitle = findChild(cardNode, "card-pretitle");
	const title = findChild(cardNode, "card-title");
	const meta = findChild(cardNode, "card-meta");

	const layout = {
		width: 320,
		direction: "VERTICAL",
		padding: cssToFigmaName("--card-padding-md"),
		gap: cssToFigmaName("--card-gap-sm"),
		radius: cssToFigmaName("--card-border-radius"),
		strokeTop: cssToFigmaName("--card-border-size-top"),
		strokeBottom: cssToFigmaName("--card-border-size-bottom"),
		strokeLeft: cssToFigmaName("--card-border-size-left"),
		strokeRight: cssToFigmaName("--card-border-size-right"),
		metaPaddingTop: cssToFigmaName("--card-meta-padding-top"),
		slots: [
			{
				id: "pretitle",
				name: "pretitle",
				fontFamily: cssToFigmaName("--card-pretitle-font-family"),
				fontWeight: cssToFigmaName("--card-pretitle-font-weight"),
				fontSize: cssToFigmaName("--card-pretitle-size"),
				lineHeight: "text-lineheight",
				letterSpacing: cssToFigmaName("--card-pretitle-letter-spacing"),
				opacity: "tone-subtle",
				textCase: uppercase === true ? "UPPER" : "ORIGINAL",
				characters: textContent(pretitle) || "Optional pretitle",
				textProperty: "Pretitle",
				booleanProperty: "Show pretitle",
				booleanDefault: true,
			},
			{
				id: "title",
				name: "title",
				fontFamily: cssToFigmaName("--card-title-font-family"),
				fontWeight: cssToFigmaName("--card-title-font-weight"),
				fontSize: cssToFigmaName("--card-title-size-md"),
				lineHeight: cssToFigmaName("--card-title-lineheight"),
				letterSpacing: null,
				opacity: "tone-strong",
				textCase: "ORIGINAL",
				characters: textContent(title) || "The title of this card",
				textProperty: "Title",
			},
			{
				id: "text",
				name: "text",
				fontFamily: "font-text-family",
				fontWeight: "font-text-weight",
				fontSize: `text-size-${bodySize}`,
				lineHeight: "text-lineheight",
				letterSpacing: null,
				opacity: "tone-base",
				textCase: "ORIGINAL",
				characters:
					textContent(body) ||
					"Description copy of this card. Can be several sentences long.",
				textProperty: "Description",
			},
			{
				id: "meta",
				name: "meta",
				fontFamily: cssToFigmaName("--card-meta-font-family"),
				fontWeight: cssToFigmaName("--card-meta-font-weight"),
				fontSize: "card-meta-size",
				lineHeight: cssToFigmaName("--card-meta-lineheight"),
				letterSpacing: null,
				opacity: "tone-subtle",
				textCase: "ORIGINAL",
				characters: textContent(meta) || "Supporting detail.",
				textProperty: "Meta",
				booleanProperty: "Show meta",
				booleanDefault: true,
			},
		],
	};

	const variants = CARD_VARIANTS.map((variant) => ({
		name: `Variant=${variant}`,
		variant,
		fill: paintFor(
			settings,
			"components.card.background",
			variant,
			`--card-${variant}-background`,
		),
		stroke: paintFor(
			settings,
			"components.card.border.subtle",
			variant,
			`--card-${variant}-border-subtle`,
		),
		foreground: paintFor(
			settings,
			"components.card.foreground",
			variant,
			`--card-${variant}-foreground`,
		),
	}));

	return {
		name: "Card",
		brandLayout: getPath(settings, "components.card.defaultLayout") || "basic",
		autoLayout,
		layout,
		variants,
	};
}

function buildBadge(settings) {
	const badgeNode = parseRoot("badge");
	const autoLayout = toAutoLayout(badgeNode, { defaultGapStep: "1" });
	const label = findChild(badgeNode, "badge-text");
	const leading = (badgeNode.children || []).find(
		(child) => child.tag === "badge-icon" && child.attrs["data-slot"] === "leading",
	);
	const trailing = (badgeNode.children || []).find(
		(child) => child.tag === "badge-icon" && child.attrs["data-slot"] === "trailing",
	);

	const layout = {
		direction: "HORIZONTAL",
		width: "hug",
		height: "hug",
		primaryAxisAlign: "CENTER",
		counterAxisAlign: "CENTER",
		paddingTop: cssToFigmaName("--badge-padding-block"),
		paddingBottom: cssToFigmaName("--badge-padding-block"),
		paddingLeft: cssToFigmaName("--badge-padding-inline"),
		paddingRight: cssToFigmaName("--badge-padding-inline"),
		gap: "spacing-1",
		radius: cssToFigmaName("--badge-border-radius"),
		strokeWeight: "border-size-none",
		labelPad: "spacing-0-5",
		iconSize: cssToFigmaName("--badge-icon-size"),
		slots: [
			{
				id: "leading",
				name: "leading",
				kind: "icon",
				icon: (leading && leading.attrs && leading.attrs.icon) || "checkbox-circle-fill",
				booleanProperty: "Show leading",
				booleanDefault: true,
				swapProperty: "Leading",
			},
			{
				id: "label",
				name: "label",
				kind: "text",
				fontFamily: cssToFigmaName("--badge-text-font-family"),
				fontWeight: cssToFigmaName("--badge-text-font-weight"),
				fontSize: cssToFigmaName("--badge-text-size"),
				lineHeight: "text-lineheight",
				letterSpacing: null,
				opacity: "tone-strong",
				textCase: "ORIGINAL",
				characters: textContent(label) || "Text",
				textProperty: "Label",
				nowrap: true,
			},
			{
				id: "trailing",
				name: "trailing",
				kind: "icon",
				icon: (trailing && trailing.attrs && trailing.attrs.icon) || "arrow-right-s-line",
				booleanProperty: "Show trailing",
				booleanDefault: true,
				swapProperty: "Trailing",
			},
		],
	};

	const variants = CARD_VARIANTS.map((variant) => ({
		name: `Variant=${variant}`,
		variant,
		fill: paintFor(
			settings,
			"components.badge.background",
			variant,
			`--badge-${variant}-background`,
		),
		stroke: paintFor(
			settings,
			"components.badge.border.color",
			variant,
			`--badge-${variant}-border`,
		),
		foreground: paintFor(
			settings,
			"components.badge.foreground",
			variant,
			`--badge-${variant}-foreground`,
		),
	}));

	return { name: "Badge", autoLayout, layout, variants };
}

function buildStamp(settings) {
	const stampNode = parseRoot("stamp");
	const autoLayout = toAutoLayout(stampNode, { defaultGapStep: "0" });
	const mark = findChild(stampNode, "stamp-text");

	const layout = {
		direction: "HORIZONTAL",
		width: cssToFigmaName("--stamp-default-size"),
		height: cssToFigmaName("--stamp-default-size"),
		primaryAxisAlign: "CENTER",
		counterAxisAlign: "CENTER",
		gap: null,
		radius: cssToFigmaName("--stamp-border-radius"),
		size: cssToFigmaName("--stamp-default-size"),
		textScale: cssToFigmaName("--stamp-text-scale"),
		iconScale: cssToFigmaName("--stamp-icon-scale"),
		slots: [
			{
				id: "mark",
				name: "mark",
				kind: "text",
				fontFamily: cssToFigmaName("--stamp-text-font-family"),
				fontWeight: cssToFigmaName("--stamp-text-font-weight"),
				fontSize: null,
				lineHeightPercent: 100,
				letterSpacing: null,
				opacity: "tone-strong",
				textCase: "ORIGINAL",
				characters: textContent(mark) || "1",
				textProperty: "Mark",
				nowrap: true,
				align: "CENTER",
			},
			{
				id: "icon",
				name: "icon",
				kind: "icon",
				icon: "star-fill",
				swapProperty: "Icon",
			},
		],
	};

	const types = ["mark", "icon"];
	const variants = [];
	for (const type of types) {
		for (const variant of CARD_VARIANTS) {
			variants.push({
				name: `Variant=${variant}, Type=${type}`,
				variant,
				type,
				fill: paintFor(
					settings,
					"components.stamp.background",
					variant,
					`--stamp-${variant}-background`,
				),
				stroke: null,
				foreground: paintFor(
					settings,
					"components.stamp.foreground",
					variant,
					`--stamp-${variant}-foreground`,
				),
			});
		}
	}

	return {
		name: "Stamp",
		autoLayout,
		layout,
		variants,
		typeOrder: types,
		variantOrder: CARD_VARIANTS,
	};
}

function buildCallout(settings) {
	const calloutNode = parseRoot("callout");
	const autoLayout = toAutoLayout(calloutNode, {
		defaultGapStep: String(getPath(settings, "components.callout.gap.sm") ?? "2"),
	});
	const title = findChild(calloutNode, "callout-title");
	const description = findChild(calloutNode, "callout-description");

	const layout = {
		width: 320,
		direction: "VERTICAL",
		padding: cssToFigmaName("--callout-padding-md"),
		gap: cssToFigmaName("--callout-gap-sm"),
		radius: "border-radius-none",
		strokeTop: "border-size-none",
		strokeBottom: "border-size-none",
		strokeLeft: cssToFigmaName("--callout-stripe-width"),
		strokeRight: "border-size-none",
		slots: [
			{
				id: "title",
				name: "title",
				kind: "text",
				fontFamily: cssToFigmaName("--callout-title-font-family"),
				fontWeight: cssToFigmaName("--callout-title-font-weight"),
				fontSize: cssToFigmaName("--callout-title-size"),
				lineHeight: "text-lineheight",
				letterSpacing: null,
				opacity: "tone-strong",
				textCase: "ORIGINAL",
				characters: textContent(title) || "Title",
				textProperty: "Title",
			},
			{
				id: "description",
				name: "description",
				kind: "text",
				fontFamily: cssToFigmaName("--callout-description-font-family"),
				fontWeight: cssToFigmaName("--callout-description-font-weight"),
				fontSize: cssToFigmaName("--callout-description-size"),
				lineHeight: "text-lineheight",
				letterSpacing: null,
				opacity: "tone-base",
				textCase: "ORIGINAL",
				characters: textContent(description) || "Description",
				textProperty: "Description",
			},
		],
	};

	const variants = CALLOUT_VARIANTS.map((variant) => ({
		name: `Variant=${variant}`,
		variant,
		fill: paintFor(
			settings,
			"components.callout.background",
			variant,
			`--callout-${variant}-background`,
		),
		stroke: paintFor(
			settings,
			"components.callout.stripe.color",
			variant,
			`--callout-${variant}-stripe`,
		),
		foreground: paintFor(
			settings,
			"components.callout.foreground",
			variant,
			`--callout-${variant}-foreground`,
		),
	}));

	return { name: "Callout", autoLayout, layout, variants };
}

function buildAnalyst(settings) {
	const analystNode = parseRoot("analyst");
	const autoLayout = toAutoLayout(analystNode, { defaultGapStep: "4" });

	const layout = {
		width: 320,
		coverHeight: 320,
		direction: "VERTICAL",
		radius: cssToFigmaName("--card-border-radius"),
		strokeTop: cssToFigmaName("--card-border-size-top"),
		strokeBottom: cssToFigmaName("--card-border-size-bottom"),
		strokeLeft: cssToFigmaName("--card-border-size-left"),
		strokeRight: cssToFigmaName("--card-border-size-right"),
		overlay: { left: "spacing-4", bottom: "spacing-4" },
		bodyGap: "spacing-2-5",
		identityGap: "spacing-4",
		locationGap: "spacing-1-5",
		locationPadBottom: "spacing-1",
		tagsGap: "spacing-2",
		iconSize: cssToFigmaName("--badge-icon-size"),
		locationIcon: "earth-fill",
		photoFill: { r: 0, g: 0, b: 0, opacity: 0.1 },
		logoStroke: {
			variable: cssToFigmaName("--card-neutral-border-subtle"),
			opacity: 0.2,
		},
		slots: [
			{
				id: "name",
				name: "name",
				kind: "text",
				fontFamily: "font-heading-family",
				fontWeight: "font-heading-weight",
				fontSize: "text-size-400",
				lineHeight: "text-lineheight",
				opacity: "tone-strong",
				characters: "Name",
				textProperty: "Name",
			},
			{
				id: "role",
				name: "role",
				kind: "text",
				fontFamily: "font-text-family",
				fontWeight: "font-text-weight",
				fontSize: "text-size-300",
				lineHeight: "text-lineheight",
				opacity: "tone-base",
				characters: "Role",
				textProperty: "Role",
			},
			{
				id: "location",
				name: "location",
				kind: "text",
				fontFamily: "font-text-family",
				fontWeight: "font-text-weight",
				fontSize: "text-size-300",
				lineHeight: "text-lineheight",
				opacity: "tone-subtle",
				characters: "Location",
				textProperty: "Location",
			},
			{
				id: "photo",
				name: "photo",
				kind: "text",
				fontFamily: "font-text-family",
				fontWeight: "font-text-weight",
				fontSize: "text-size-200",
				lineHeight: "text-lineheight",
				opacity: "tone-subtle",
				characters: "Photo",
				fill: {
					variable: cssToFigmaName("--color-slide-foreground"),
					opacity: 1,
				},
			},
			{
				id: "logo-label",
				name: "logo-label",
				kind: "text",
				fontFamily: "font-text-family",
				fontWeight: "font-text-weight",
				fontSize: "text-size-200",
				lineHeight: "text-lineheight",
				opacity: "tone-subtle",
				characters: "Logo",
				fill: {
					variable: cssToFigmaName("--color-slide-foreground"),
					opacity: 1,
				},
			},
		],
	};

	const sizes = [
		{
			name: "lg",
			padding: cssToFigmaName("--card-padding-md"),
			logoSize: "spacing-10",
		},
		{
			name: "sm",
			padding: cssToFigmaName("--card-padding-sm"),
			logoSize: "spacing-7",
		},
	];

	const paint = {
		fill: paintFor(
			settings,
			"components.card.background",
			"neutral",
			"--card-neutral-background",
		),
		stroke: paintFor(
			settings,
			"components.card.border.subtle",
			"neutral",
			"--card-neutral-border-subtle",
		),
		foreground: paintFor(
			settings,
			"components.card.foreground",
			"neutral",
			"--card-neutral-foreground",
		),
	};

	return {
		name: "Analyst",
		nested: { badge: "Badge", mediaSlot: "Media-slot" },
		autoLayout,
		layout,
		sizes,
		paint,
	};
}

const BUILDERS = {
	card: buildCard,
	badge: buildBadge,
	stamp: buildStamp,
	callout: buildCallout,
	analyst: buildAnalyst,
};

function writeComponent(name, settings, slug) {
	const builder = BUILDERS[name];
	const payload = {
		brand: slug,
		component: name,
		...builder(settings),
	};
	fs.mkdirSync(OUT_DIR, { recursive: true });
	const outPath = path.join(OUT_DIR, `${name}.json`);
	fs.writeFileSync(outPath, `${JSON.stringify(payload, null, "\t")}\n`);
	return path.relative(ROOT, outPath);
}

function main() {
	const name = process.argv[2];
	const brandArg = process.argv[3];
	if (!name || name === "--help" || name === "-h") usage();
	const names = name === "all" ? Object.keys(BUILDERS) : [name];
	if (names.some((item) => !BUILDERS[item])) usage();

	const { slug, settings } = loadBrand(brandArg || DEFAULT_BRAND);
	const written = names.map((item) => writeComponent(item, settings, slug));
	generatePlugin();
	for (const file of written) console.log(`Wrote ${file}`);
	console.log("Updated scripts/figma/plugin/code.js");
}

try {
	main();
} catch (error) {
	console.error(error.message);
	process.exit(1);
}

#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const { loadBrand, getPath } = require("./lib/brand.js");
const { parseFragment, findChild, textContent } = require("./lib/html.js");
const { generatePlugin } = require("./generate-plugin.js");

const DEFAULT_BRAND = "brands/gratia";
const ROOT = path.join(__dirname, "..", "..");
const PRESETS_DIR = path.join(ROOT, "presets");
const OUT_DIR = path.join(__dirname, "templates");

const PAGE_ORDER = [
	"TITLE SLIDES",
	"CHAPTER SLIDES",
	"CONTENT SLIDES",
	"GRATIA SLIDES",
];

const CHROME = {
	"header-container": {
		name: "header",
		prefix: "slide-header-padding",
		fillVertical: false,
	},
	"content-container": {
		name: "content",
		prefix: "slide-content-padding",
		fillVertical: true,
	},
	"footer-container": {
		name: "footer",
		prefix: "slide-footer-padding",
		fillVertical: false,
	},
};

const CARD_INSTANCE_TAGS = new Set([
	"card-pretitle",
	"card-title",
	"card-meta",
	"text",
]);

const FAMILY = {
	title: { family: "font-title-family", weight: "font-title-weight" },
	heading: { family: "font-heading-family", weight: "font-heading-weight" },
	stat: { family: "font-stat-family", weight: "font-stat-weight" },
	label: { family: "font-label-family", weight: "font-label-weight" },
	text: { family: "font-text-family", weight: "font-text-weight" },
	display: { family: "font-family-display", weight: "font-weight-regular" },
	base: { family: "font-family-base", weight: "font-text-weight" },
};

const LINEHEIGHT_PERCENT = {
	single: 100,
	sm: 110,
	md: 120,
	lg: 150,
};

const WEIGHT_VAR = {
	regular: "font-weight-regular",
	medium: "font-weight-medium",
	bold: "font-weight-bold",
};

function usage() {
	console.error("Usage: node scripts/figma/build-template.js <preset-id> [brand-directory]");
	console.error("Pass a preset id, or `all` for every preset that has HTML.");
	console.error("Default brand-directory: brands/gratia");
	process.exit(1);
}

function decode(value) {
	return String(value || "")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, " ")
		.trim();
}

function copy(value) {
	return decode(textContent(value));
}

function classes(node) {
	return String((node.attrs && node.attrs.class) || "")
		.split(/\s+/)
		.filter(Boolean);
}

function elements(node) {
	return (node.children || []).filter((child) => child.tag && child.tag !== "#text");
}

function findSlot(node, slot) {
	const walk = (current) => {
		if (!current || current.tag === "#text") return null;
		if (current.attrs && current.attrs["data-slot"] === slot) return current;
		for (const child of current.children || []) {
			const hit = walk(child);
			if (hit) return hit;
		}
		return null;
	};
	return walk(node);
}

function gapVar(gap) {
	if (gap == null || gap === true) return "spacing-4";
	return `spacing-${gap}`;
}

function horizontalSize(width, fallback = "HUG") {
	if (width === "fill") return "FILL";
	if (width === "hug") return "HUG";
	return fallback;
}

function verticalSize(height, fallback = "HUG") {
	if (height === "fill") return "FILL";
	if (height === "hug") return "HUG";
	return fallback;
}

function spacingRef(raw) {
	const value = String(raw || "").trim();
	if (!value) return null;
	const token = value.match(/^var\(--spacing-([^)]+)\)$/);
	if (token) return `spacing-${token[1]}`;
	if (value === "0" || value === "0px") return 0;
	const px = value.match(/^([\d.]+)px$/i);
	if (px) return Number(px[1]);
	return null;
}

function parseStyle(raw) {
	const out = {};
	if (!raw || typeof raw !== "string") return out;
	for (const part of raw.split(";")) {
		const idx = part.indexOf(":");
		if (idx < 0) continue;
		const key = part.slice(0, idx).trim();
		const val = part.slice(idx + 1).trim();
		if (key === "width" && /px$/i.test(val)) out.widthPx = parseFloat(val);
		if (key === "height" && /px$/i.test(val)) out.heightPx = parseFloat(val);
		if (key === "color") {
			const color = val.match(/var\(--([a-z0-9-]+)\)/i);
			if (color) out.fillVariable = color[1];
		}
		if (key === "aspect-ratio") {
			const ratio = val.split("/").map((item) => parseFloat(item.trim()));
			if (ratio.length === 2 && ratio[0] && ratio[1]) {
				out.aspectRatio = ratio[0] / ratio[1];
			}
		}
		if (key === "padding") {
			const bits = val.split(/\s+/).map(spacingRef);
			if (bits.length === 1) {
				out.padding = { top: bits[0], right: bits[0], bottom: bits[0], left: bits[0] };
			} else if (bits.length === 2) {
				out.padding = { top: bits[0], right: bits[1], bottom: bits[0], left: bits[1] };
			} else if (bits.length === 3) {
				out.padding = { top: bits[0], right: bits[1], bottom: bits[2], left: bits[1] };
			} else if (bits.length >= 4) {
				out.padding = { top: bits[0], right: bits[1], bottom: bits[2], left: bits[3] };
			}
		}
	}
	return out;
}

function applyClassPadding(padding, cls) {
	const setAll = (value) => {
		padding.top = value;
		padding.right = value;
		padding.bottom = value;
		padding.left = value;
	};
	for (const name of cls) {
		const all = name.match(/^p-(\d+(?:-\d+)?)$/);
		if (all) setAll(`spacing-${all[1]}`);
		const x = name.match(/^px-(\d+(?:-\d+)?)$/);
		if (x) {
			padding.left = `spacing-${x[1]}`;
			padding.right = `spacing-${x[1]}`;
		}
		const t = name.match(/^pt-(\d+(?:-\d+)?)$/);
		if (t) padding.top = `spacing-${t[1]}`;
		const r = name.match(/^pr-(\d+(?:-\d+)?)$/);
		if (r) padding.right = `spacing-${r[1]}`;
		const b = name.match(/^pb-(\d+(?:-\d+)?)$/);
		if (b) padding.bottom = `spacing-${b[1]}`;
		const l = name.match(/^pl-(\d+(?:-\d+)?)$/);
		if (l) padding.left = `spacing-${l[1]}`;
	}
	return padding;
}

function classGap(cls) {
	for (const name of cls) {
		const hit = name.match(/^gap-(\d+(?:-\d+)?)$/);
		if (hit) return `spacing-${hit[1]}`;
	}
	return null;
}

function isRow(node) {
	const cls = classes(node);
	if (node.tag === "stack") return node.attrs.direction === "row";
	if (cls.includes("flex-col")) return false;
	if (cls.includes("flex-row")) return true;
	return cls.includes("flex") && !cls.includes("flex-col");
}

function chromePadding(prefix, cls) {
	const padding = {
		top: `${prefix}-top`,
		right: `${prefix}-right`,
		bottom: `${prefix}-bottom`,
		left: `${prefix}-left`,
	};
	return applyClassPadding(padding, cls);
}

function applyLayout(spec, node, extras = {}) {
	const cls = classes(node);
	const style = parseStyle(node.attrs.style);
	if (cls.includes("w-full")) spec.layoutSizingHorizontal = "FILL";
	if (cls.includes("h-full")) spec.layoutSizingVertical = "FILL";
	if (cls.includes("flex-1") || cls.includes("grow")) {
		if ((extras.parentMode || spec.layoutMode) === "HORIZONTAL") {
			spec.layoutSizingHorizontal = "FILL";
		} else {
			spec.layoutSizingVertical = "FILL";
		}
	}
	if (cls.includes("w-1-3")) spec.fraction = "1-3";
	if (cls.includes("max-w-md")) spec.maxWidth = 600;
	if (cls.includes("aspect-square")) spec.aspectSquare = true;
	if (cls.includes("overflow-hidden")) spec.clipsContent = true;
	if (cls.includes("rounded")) spec.radius = "card-border-radius";
	if (cls.includes("border")) {
		spec.stroke = { variable: "divider-color", opacity: 1 };
		spec.strokeTop = "border-size-sm";
		spec.strokeRight = "border-size-sm";
		spec.strokeBottom = "border-size-sm";
		spec.strokeLeft = "border-size-sm";
		spec.strokeAlign = "INSIDE";
	}
	if (cls.includes("justify-center")) spec.primaryAxisAlignItems = "CENTER";
	if (cls.includes("justify-between")) spec.primaryAxisAlignItems = "SPACE_BETWEEN";
	if (cls.includes("justify-start")) spec.primaryAxisAlignItems = "MIN";
	if (cls.includes("items-center")) spec.counterAxisAlignItems = "CENTER";
	if (cls.includes("items-start")) spec.counterAxisAlignItems = "MIN";
	if (cls.includes("text-center") && spec.type !== "text") {
		spec.counterAxisAlignItems = spec.layoutMode === "VERTICAL" ? "CENTER" : spec.counterAxisAlignItems;
		spec.primaryAxisAlignItems =
			spec.layoutMode === "HORIZONTAL" ? "CENTER" : spec.primaryAxisAlignItems;
	}
	const padding = applyClassPadding({}, cls);
	if (style.padding) Object.assign(padding, style.padding);
	if (Object.keys(padding).length > 0) spec.padding = { ...(spec.padding || {}), ...padding };
	if (style.widthPx) spec.widthPx = style.widthPx;
	if (style.heightPx) spec.heightPx = style.heightPx;
	if (style.aspectRatio) spec.aspectRatio = style.aspectRatio;
	if (cls.includes("absolute")) {
		spec.layoutPositioning = "ABSOLUTE";
		spec.constraints = {
			horizontal: cls.includes("left-0") && cls.includes("right-0") ? "STRETCH" : "MIN",
			vertical: cls.includes("bottom-0") ? "MAX" : "MIN",
		};
		if (spec.constraints.horizontal === "STRETCH") spec.layoutSizingHorizontal = "FILL";
	}
	return spec;
}

function pretTypeFromHtml(group, ctx) {
	const badgePre = elements(group).find(
		(child) => child.tag === "badge" && child.attrs["data-slot"] === "pre",
	);
	if (badgePre) return { type: "badge", node: badgePre };
	const pret = findChild(group, "slide-pretitle");
	if (pret) return { type: ctx.pretitleDefault, node: pret };
	return null;
}

function mapSlideTitleGroup(node, ctx) {
	const title = findChild(node, "slide-title") || (node.tag === "slide-title" ? node : null);
	const subtitle = findChild(node, "slide-subtitle");
	const size = (title && title.attrs.size) || "md";
	const align = node.attrs.align || (classes(node).includes("text-center") ? "center" : "left");
	const pret = node.tag === "slide-title-group" ? pretTypeFromHtml(node, ctx) : null;
	const overrides = [];
	if (pret) {
		overrides.push({
			name: "pretitle",
			swap: {
				component: "Slide-pretitle",
				variant: `Type=${pret.type === "badge" ? "badge" : "label"}`,
			},
			characters: copy(pret.node),
		});
	} else {
		overrides.push({ name: "pretitle", visible: false });
	}
	if (title) overrides.push({ name: "title", characters: copy(title) });
	if (subtitle) overrides.push({ name: "subtitle", characters: copy(subtitle) });
	else overrides.push({ name: "subtitle", visible: false });
	const spec = {
		type: "instance",
		name: "slide-title-group",
		component: "Slide-title",
		variant: `Size=${size}, Align=${align}`,
		layoutSizingHorizontal: "FILL",
		layoutSizingVertical: "HUG",
		overrides,
	};
	applyLayout(spec, node);
	return spec;
}

function mapCard(node, ctx, extras) {
	const kids = elements(node);
	const catalog = kids.every((child) => CARD_INSTANCE_TAGS.has(child.tag));
	if (catalog) {
		const variant = node.attrs.variant || "neutral";
		const pret = findChild(node, "card-pretitle");
		const title = findChild(node, "card-title");
		const body = findChild(node, "text");
		const meta = findChild(node, "card-meta");
		const overrides = [];
		if (pret) overrides.push({ name: "pretitle", characters: copy(pret) });
		else overrides.push({ name: "pretitle", visible: false });
		if (title) overrides.push({ name: "title", characters: copy(title) });
		if (body) overrides.push({ name: "text", characters: copy(body) });
		else overrides.push({ name: "text", visible: false });
		if (meta) overrides.push({ name: "meta", characters: copy(meta) });
		else overrides.push({ name: "meta", visible: false });
		const spec = {
			type: "instance",
			name: "card",
			component: "Card",
			variant: `Variant=${variant}`,
			layoutSizingHorizontal:
				node.attrs.width === "fill" || extras.fillInRow ? "FILL" : horizontalSize(node.attrs.width),
			layoutSizingVertical: verticalSize(node.attrs.height),
			overrides,
		};
		applyLayout(spec, node, extras);
		return spec;
	}

	const variant = node.attrs.variant || "neutral";
	const pad = node.attrs.padding || "md";
	const spec = {
		type: "autoLayout",
		name: "card",
		role: "cardFrame",
		layoutMode: "VERTICAL",
		fill: { variable: `card-${variant}-background`, opacity: 1 },
		stroke: { variable: `card-${variant}-border-subtle`, opacity: 0.2 },
		strokeAlign: "INSIDE",
		radius: "card-border-radius",
		strokeTop: "card-border-size-top",
		strokeRight: "card-border-size-right",
		strokeBottom: "card-border-size-bottom",
		strokeLeft: "card-border-size-left",
		padding: {
			top: `card-padding-${pad}`,
			right: `card-padding-${pad}`,
			bottom: `card-padding-${pad}`,
			left: `card-padding-${pad}`,
		},
		itemSpacing: "card-gap-sm",
		layoutSizingHorizontal:
			node.attrs.width === "fill" || extras.fillInRow ? "FILL" : horizontalSize(node.attrs.width),
		layoutSizingVertical: verticalSize(node.attrs.height),
		clipsContent: true,
		children: kids.map((child) => mapNode(child, ctx, extras)).filter(Boolean),
	};
	applyLayout(spec, node, extras);
	return spec;
}

function mapSlideFooter(node) {
	const notes = findChild(node, "slide-footer-notes");
	const meta = findChild(node, "slide-footer-meta");
	const overrides = [];
	if (notes) overrides.push({ name: "notes", characters: copy(notes) });
	if (meta) {
		const title = findChild(meta, "slide-footer-title");
		const chapter = findChild(meta, "slide-footer-chapter");
		const page = findChild(meta, "slide-footer-page");
		if (title) overrides.push({ name: "deck-title", characters: copy(title) });
		if (chapter) overrides.push({ name: "chapter", characters: copy(chapter) });
		if (page) overrides.push({ name: "page", characters: copy(page) });
	}
	return {
		type: "instance",
		name: "slide-footer",
		component: "Slide-footer",
		layoutSizingHorizontal: "FILL",
		layoutSizingVertical: "HUG",
		overrides,
	};
}

function mapStamp(node) {
	const icon = findChild(node, "stamp-icon");
	const mark = findChild(node, "stamp-text");
	const size = node.attrs.size;
	const props = {
		"Show icon": Boolean(icon),
		"Show mark": Boolean(mark),
	};
	if (mark) props.Mark = copy(mark);
	return {
		type: "instance",
		name: "stamp",
		component: "Stamp",
		variant: `Variant=${node.attrs.variant || "neutral"}`,
		props,
		sizeVar: size ? `spacing-${size}` : null,
		layoutSizingHorizontal: "FIXED",
		layoutSizingVertical: "FIXED",
	};
}

function mapBadge(node) {
	const icon = findChild(node, "badge-icon");
	const label = findChild(node, "badge-text") || node;
	return {
		type: "instance",
		name: node.attrs["data-slot"] || "badge",
		component: "Badge",
		variant: `Variant=${node.attrs.variant || "neutral"}`,
		props: {
			Label: copy(label),
			"Show leading": Boolean(icon),
			"Show trailing": false,
		},
		layoutSizingHorizontal: "HUG",
		layoutSizingVertical: "HUG",
	};
}

function mapDivider(node) {
	const vertical = node.attrs.orientation === "vertical";
	return {
		type: "instance",
		name: "divider",
		component: "Divider",
		variant: vertical ? "Orientation=vertical" : "Orientation=horizontal",
		layoutSizingHorizontal: vertical ? "HUG" : "FILL",
		layoutSizingVertical: vertical ? "FILL" : "HUG",
	};
}

function mediaSlotVariant(node) {
	const size = node.attrs.size;
	const paddingNone = node.attrs.padding === "none";
	if (size) return `Type=logo, Size=${size}`;
	if (paddingNone || node.attrs.border === "false") return "Type=flush";
	return "Type=well";
}

function mapMediaSlot(node) {
	const style = parseStyle(node.attrs.style);
	const spec = {
		type: "instance",
		name: node.attrs["data-slot"] || "media-slot",
		component: "Media-slot",
		variant: mediaSlotVariant(node),
		layoutSizingHorizontal: style.widthPx
			? "FIXED"
			: horizontalSize(node.attrs.width, "FILL"),
		layoutSizingVertical: classes(node).includes("aspect-square")
			? "FIXED"
			: verticalSize(node.attrs.height, "FILL"),
	};
	applyLayout(spec, node);
	return spec;
}

function mapCoverTitle(node) {
	const align =
		node.attrs.align || (classes(node).includes("text-center") ? "center" : "left");
	const spec = {
		type: "instance",
		name: "cover-title",
		component: "Cover-title",
		variant: `Size=${node.attrs.size || "md"}, Align=${align}`,
		layoutSizingHorizontal: "HUG",
		layoutSizingVertical: "HUG",
		overrides: [
			{
				characters: copy(node),
			},
		],
	};
	applyLayout(spec, node);
	return spec;
}

function mapAttributionBox(node) {
	const credit = findSlot(node, "credit") || findChild(node, "text");
	return {
		type: "instance",
		name: "attribution-box",
		component: "Attribution-box",
		layoutSizingHorizontal: "HUG",
		layoutSizingVertical: "HUG",
		overrides: credit ? [{ characters: copy(credit) }] : [],
	};
}

function mapBrandLogo(node, ctx) {
	const src = String(node.attrs.src || "");
	const brand = /riverton/i.test(src) ? "Riverton" : "Gratia";
	const theme = /inverted/i.test(src) || ctx.colorTheme === "dark" ? "dark" : "light";
	const style = parseStyle(node.attrs.style);
	const spec = {
		type: "instance",
		name: node.attrs["data-slot"] || "brand-logo",
		component: "Brand-logo",
		variant: `Brand=${brand}, Theme=${theme}`,
		layoutSizingHorizontal: "HUG",
		layoutSizingVertical: "HUG",
	};
	if (style.heightPx) spec.heightPx = style.heightPx;
	applyLayout(spec, node);
	return spec;
}

function mapImg(node, ctx) {
	if (node.attrs["data-logo"] != null && node.attrs["data-logo"] !== "false") {
		return mapBrandLogo(node, ctx);
	}
	const spec = {
		type: "instance",
		name: node.attrs["data-slot"] || "image",
		component: "Media-slot",
		variant: "Type=flush",
		layoutSizingHorizontal: horizontalSize(node.attrs.width, "FILL"),
		layoutSizingVertical: "HUG",
	};
	applyLayout(spec, node);
	return spec;
}

function mapAnalyst(node) {
	const tags = findSlot(node, "tags");
	const tagLabels = tags
		? elements(tags)
				.filter((child) => child.tag === "badge")
				.map((badge) => copy(findChild(badge, "badge-text") || badge))
		: [];
	const overrides = [];
	const name = findSlot(node, "name");
	const role = findSlot(node, "role");
	const location = findSlot(node, "location");
	const specLabel = findSlot(node, "specialization");
	if (name) overrides.push({ name: "name", characters: copy(name) });
	if (role) overrides.push({ name: "role", characters: copy(role) });
	if (location) overrides.push({ name: "location", characters: copy(location) });
	if (specLabel) {
		overrides.push({
			name: "specialization",
			characters: copy(findChild(specLabel, "badge-text") || specLabel),
		});
	}
	return {
		type: "instance",
		name: "analyst",
		component: "Analyst",
		variant: `Size=${node.attrs.size || "lg"}`,
		layoutSizingHorizontal: "FILL",
		layoutSizingVertical: "HUG",
		overrides,
		tagLabels,
		colorTheme: node.attrs["color-theme"] || null,
	};
}

function mapText(node, extras = {}) {
	const familyKey = node.attrs.family || "text";
	const role = FAMILY[familyKey] || FAMILY.text;
	const size = node.attrs.size || "400";
	const tone = node.attrs.tone || "base";
	const context = node.attrs.context || "slide";
	const style = parseStyle(node.attrs.style);
	const cls = classes(node);
	const fillVariable =
		style.fillVariable ||
		(context === "surface" ? "color-slide-surface-foreground" : "color-slide-foreground");
	const spec = {
		type: "text",
		name: node.attrs["data-slot"] || "text",
		characters: copy(node),
		fontFamily: role.family,
		fontWeight: WEIGHT_VAR[node.attrs.weight] || role.weight,
		fontSize: `text-size-${size}`,
		fill: { variable: fillVariable, opacity: 1 },
		opacity: style.fillVariable ? null : `tone-${tone}`,
		layoutSizingHorizontal: cls.includes("w-full") || extras.parentFill ? "FILL" : "HUG",
		layoutSizingVertical: "HUG",
		textAlign: cls.includes("text-center")
			? "CENTER"
			: cls.includes("text-left")
				? "LEFT"
				: "LEFT",
	};
	if (node.attrs.lineheight && LINEHEIGHT_PERCENT[node.attrs.lineheight]) {
		spec.lineHeightPercent = LINEHEIGHT_PERCENT[node.attrs.lineheight];
	} else {
		spec.lineHeight = "text-lineheight";
	}
	applyLayout(spec, node, extras);
	return spec;
}

function frameName(node, kids) {
	if (node.attrs && node.attrs["data-slot"]) return node.attrs["data-slot"];
	if (kids.length > 0 && kids.every((child) => child.tag === "card")) return "cards";
	if (node.tag === "stack") return "stack";
	return "frame";
}

function mapFrame(node, ctx, extras = {}) {
	const kids = elements(node);
	const row = isRow(node);
	const fillRow = row && (node.attrs.width === "fill" || classes(node).includes("w-full"));
	const columns = node.attrs.columns ? Number(node.attrs.columns) : null;
	const wrap = node.attrs.wrap === "true" || node.attrs.wrap === true || Boolean(columns);
	const spec = {
		type: "autoLayout",
		name: frameName(node, kids),
		layoutMode: columns ? "HORIZONTAL" : row ? "HORIZONTAL" : "VERTICAL",
		itemSpacing: node.attrs.gap != null ? gapVar(node.attrs.gap) : classGap(classes(node)) || 0,
		layoutSizingHorizontal: horizontalSize(
			node.attrs.width,
			classes(node).includes("w-full") || classes(node).includes("h-full") ? "FILL" : extras.parentFill ? "FILL" : "HUG",
		),
		layoutSizingVertical: verticalSize(
			node.attrs.height,
			classes(node).includes("h-full") || classes(node).includes("flex-1") || classes(node).includes("grow")
				? "FILL"
				: "HUG",
		),
		children: [],
	};
	if (wrap) spec.layoutWrap = "WRAP";
	if (columns) spec.columns = columns;
	applyLayout(spec, node, extras);
	if (kids.some((child) => classes(child).includes("mt-auto"))) {
		spec.primaryAxisAlignItems = "SPACE_BETWEEN";
	}
	const childExtras = {
		parentMode: spec.layoutMode,
		parentFill: spec.layoutSizingHorizontal === "FILL",
		fillInRow: fillRow || Boolean(columns),
	};
	spec.children = kids.map((child) => mapNode(child, ctx, childExtras)).filter(Boolean);
	return spec;
}

function mapChrome(node, ctx) {
	const spec = CHROME[node.tag];
	const cls = classes(node);
	const frame = {
		type: "frame",
		name: spec.name,
		role: node.tag,
		layoutMode: "VERTICAL",
		padding: chromePadding(spec.prefix, cls),
		layoutSizingHorizontal: "FILL",
		layoutSizingVertical: spec.fillVertical ? "FILL" : "HUG",
		children: elements(node).map((child) =>
			mapNode(child, ctx, { parentFill: true, parentMode: "VERTICAL" }),
		),
	};
	applyLayout(frame, node, { parentMode: "VERTICAL" });
	if (spec.fillVertical) frame.layoutSizingVertical = "FILL";
	frame.layoutSizingHorizontal = "FILL";
	return frame;
}

function mapNode(node, ctx, extras = {}) {
	if (!node || node.tag === "#text") return null;
	if (CHROME[node.tag]) return mapChrome(node, ctx);
	if (node.tag === "slide-title-group" || node.tag === "slide-title") {
		return mapSlideTitleGroup(node, ctx);
	}
	if (node.tag === "card") return mapCard(node, ctx, extras);
	if (node.tag === "slide-footer") return mapSlideFooter(node);
	if (node.tag === "stamp") return mapStamp(node);
	if (node.tag === "badge") return mapBadge(node);
	if (node.tag === "divider") return mapDivider(node);
	if (node.tag === "media-slot") return mapMediaSlot(node);
	if (node.tag === "cover-title") return mapCoverTitle(node);
	if (node.tag === "attribution-box") return mapAttributionBox(node);
	if (node.tag === "analyst") return mapAnalyst(node);
	if (node.tag === "text") return mapText(node, extras);
	if (node.tag === "img") return mapImg(node, ctx);
	if (node.tag === "stack" || node.tag === "div") return mapFrame(node, ctx, extras);
	if (
		node.tag === "stamp-icon" ||
		node.tag === "stamp-text" ||
		node.tag === "badge-icon" ||
		node.tag === "badge-text" ||
		node.tag === "slide-subtitle" ||
		node.tag === "slide-pretitle" ||
		node.tag === "slide-footer-notes" ||
		node.tag === "slide-footer-meta" ||
		node.tag === "slide-footer-title" ||
		node.tag === "slide-footer-chapter" ||
		node.tag === "slide-footer-page" ||
		node.tag === "card-pretitle" ||
		node.tag === "card-title" ||
		node.tag === "card-meta"
	) {
		return null;
	}
	throw new Error(`Unsupported template tag <${node.tag}> in ${ctx.id}`);
}

function buildTree(slide, ctx) {
	return {
		type: "component",
		layoutMode: "VERTICAL",
		itemSpacing: 0,
		children: elements(slide)
			.map((child) => mapNode(child, ctx, { parentFill: true, parentMode: "VERTICAL" }))
			.filter(Boolean),
	};
}

function readSidecar(mdPath) {
	const raw = fs.readFileSync(mdPath, "utf8");
	const match = raw.match(/^---\n([\s\S]*?)\n---/);
	if (!match) return null;
	const block = match[1];
	const field = (name) => {
		const hit = block.match(new RegExp(`^${name}:\\s*(.+)$`, "m"));
		return hit ? hit[1].trim() : null;
	};
	const id = field("id");
	if (!id) return null;
	return {
		id,
		intent: field("intent"),
		kind: field("kind"),
		brand: field("brand"),
		mdPath,
		htmlPath: mdPath.replace(/\.md$/, ".html"),
	};
}

function walkMd(dir, out = []) {
	if (!fs.existsSync(dir)) return out;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) walkMd(full, out);
		else if (entry.name.endsWith(".md") && entry.name !== "README.md") {
			const sidecar = readSidecar(full);
			if (sidecar) out.push(sidecar);
		}
	}
	return out;
}

function templateSection(preset) {
	if (preset.brand === "gratia" || /[/\\]brands[/\\]gratia[/\\]/.test(preset.htmlPath)) {
		return "GRATIA SLIDES";
	}
	if (preset.kind === "title" || preset.id.startsWith("title-slide")) return "TITLE SLIDES";
	if (preset.kind === "chapter" || preset.id.startsWith("chapter-slide")) {
		return "CHAPTER SLIDES";
	}
	return "CONTENT SLIDES";
}

/** Each preset owns a Figma page named after its id. */
function templatePage(preset) {
	return preset.id;
}

function htmlPresets() {
	return walkMd(PRESETS_DIR)
		.filter((item) => fs.existsSync(item.htmlPath))
		.sort((a, b) => {
			const section = PAGE_ORDER.indexOf(templateSection(a)) - PAGE_ORDER.indexOf(templateSection(b));
			if (section !== 0) return section;
			return a.id.localeCompare(b.id);
		});
}

function findPreset(id) {
	const hit = htmlPresets().find((item) => item.id === id) || walkMd(PRESETS_DIR).find((item) => item.id === id);
	if (!hit) throw new Error(`No preset sidecar with id ${JSON.stringify(id)}`);
	if (!fs.existsSync(hit.htmlPath)) {
		throw new Error(`Preset HTML missing: ${hit.htmlPath}`);
	}
	return hit;
}

function findSlide(tree) {
	const visit = (node) => {
		if (!node || node.tag === "#text") return null;
		if (node.tag === "slide") return node;
		for (const child of node.children || []) {
			const hit = visit(child);
			if (hit) return hit;
		}
		return null;
	};
	return visit(tree);
}

function buildTemplate(id, settings, slug) {
	const preset = findPreset(id);
	const html = fs.readFileSync(preset.htmlPath, "utf8");
	const slide = findSlide(parseFragment(html));
	if (!slide) throw new Error(`${preset.htmlPath} has no <slide>`);
	const pretitleDefault = getPath(settings, "components.slideTitle.pretitle.default") || "text";
	const colorTheme = slide.attrs["color-theme"] || null;
	return {
		brand: slug,
		id,
		name: id,
		page: templatePage(preset),
		intent: preset.intent,
		kind: preset.kind,
		width: "slide-max-width",
		height: 800,
		fill: { variable: "color-slide-background", opacity: 1 },
		colorTheme,
		tree: buildTree(slide, { pretitleDefault, id, colorTheme }),
	};
}

function writeTemplate(id, settings, slug) {
	const payload = buildTemplate(id, settings, slug);
	fs.mkdirSync(OUT_DIR, { recursive: true });
	const outPath = path.join(OUT_DIR, `${id}.json`);
	fs.writeFileSync(outPath, `${JSON.stringify(payload, null, "\t")}\n`);
	return path.relative(ROOT, outPath);
}

function main() {
	const name = process.argv[2];
	const brandArg = process.argv[3];
	if (!name || name === "--help" || name === "-h") usage();
	const presets = htmlPresets();
	const ids = name === "all" ? presets.map((item) => item.id) : [name];
	if (name !== "all" && !presets.some((item) => item.id === name)) {
		if (walkMd(PRESETS_DIR).some((item) => item.id === name)) {
			console.error(`Preset ${JSON.stringify(name)} has no HTML.`);
			process.exit(1);
		}
		usage();
	}

	const { slug, settings } = loadBrand(brandArg || DEFAULT_BRAND);
	const written = ids.map((id) => writeTemplate(id, settings, slug));
	generatePlugin();
	for (const file of written) console.log(`Wrote ${file}`);
	console.log("Updated scripts/figma/plugin/code.js");
}

try {
	main();
} catch (error) {
	console.error(error.stack || error.message || error);
	process.exit(1);
}

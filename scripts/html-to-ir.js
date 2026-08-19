#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const VOID_TAGS = new Set([
	"img",
	"br",
	"hr",
	"meta",
	"link",
	"input",
	"use",
	"path",
]);
const SKIP_TAGS = new Set([
	"html",
	"head",
	"body",
	"meta",
	"link",
	"title",
	"script",
	"style",
	"nav",
	"button",
	"span",
	"doctype",
	"deck",
]);

const COPY_SIZE = {
	lg: "400",
	base: "350",
	sm: "300",
	xs: "250",
	"2xs": "225",
	"3xs": "200",
};

function usage() {
	console.error("Usage: node scripts/html-to-ir.js <deck-directory> [--out file]");
	console.error("Example: node scripts/html-to-ir.js decks/riverton-project-charter");
	process.exit(1);
}

function collapseText(value) {
	return value.replace(/\s+/g, " ").trim();
}

function parseAttrs(raw) {
	const attrs = {};
	const re = /([:@]?[\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
	let match;
	while ((match = re.exec(raw))) {
		attrs[match[1]] = match[2] !== undefined ? match[2] : match[3] !== undefined ? match[3] : match[4] !== undefined ? match[4] : true;
	}
	return attrs;
}

function tokenize(html) {
	const tokens = [];
	let i = 0;
	while (i < html.length) {
		if (html.startsWith("<!--", i)) {
			const end = html.indexOf("-->", i + 4);
			i = end === -1 ? html.length : end + 3;
			continue;
		}
		if (html.startsWith("<!DOCTYPE", i) || html.startsWith("<!doctype", i)) {
			const end = html.indexOf(">", i);
			i = end === -1 ? html.length : end + 1;
			continue;
		}
		if (html[i] === "<") {
			const end = html.indexOf(">", i);
			if (end === -1) break;
			const raw = html.slice(i + 1, end);
			i = end + 1;
			if (raw.startsWith("/")) {
				tokens.push({ kind: "close", tag: raw.slice(1).trim().toLowerCase() });
			} else {
				const selfClosing = raw.endsWith("/");
				const body = selfClosing ? raw.slice(0, -1).trim() : raw.trim();
				const space = body.search(/\s/);
				const tag = (space === -1 ? body : body.slice(0, space)).toLowerCase();
				const attrRaw = space === -1 ? "" : body.slice(space);
				tokens.push({
					kind: "open",
					tag,
					attrs: parseAttrs(attrRaw),
					selfClosing: selfClosing || VOID_TAGS.has(tag),
				});
			}
			continue;
		}
		const next = html.indexOf("<", i);
		const text = html.slice(i, next === -1 ? html.length : next);
		i = next === -1 ? html.length : next;
		if (text.length) tokens.push({ kind: "text", value: text });
	}
	return tokens;
}

function toForest(tokens) {
	const root = { tag: "#document", attrs: {}, children: [] };
	const stack = [root];
	for (const token of tokens) {
		const parent = stack[stack.length - 1];
		if (token.kind === "text") {
			parent.children.push({ type: "text", value: token.value });
			continue;
		}
		if (token.kind === "open") {
			const node = { tag: token.tag, attrs: token.attrs, children: [] };
			parent.children.push(node);
			if (!token.selfClosing) stack.push(node);
			continue;
		}
		if (token.kind === "close") {
			for (let i = stack.length - 1; i > 0; i -= 1) {
				if (stack[i].tag === token.tag) {
					stack.length = i;
					break;
				}
			}
		}
	}
	return root;
}

function classList(node) {
	return String((node.attrs && node.attrs.class) || "")
		.split(/\s+/)
		.filter(Boolean);
}

function hasClass(node, name) {
	return classList(node).includes(name);
}

function attr(node, name, fallback) {
	if (!node.attrs || node.attrs[name] === undefined) return fallback;
	return node.attrs[name];
}

function findChild(node, tag) {
	return (node.children || []).find((child) => child.tag === tag);
}

function collectText(node) {
	if (!node) return "";
	if (node.type === "text") return node.value || "";
	return (node.children || []).map(collectText).join(" ");
}

function spacingToken(value) {
	return `spacing/${value}`;
}

function parseUtilityLayout(node) {
	const classes = classList(node);
	const layout = {
		type: "frame",
		name: node.tag === "div" ? "Frame" : node.tag,
		layout: hasClass(node, "flex-col") ? "VERTICAL" : hasClass(node, "flex") || hasClass(node, "inline-flex") ? "HORIZONTAL" : "NONE",
		children: [],
	};

	for (const cls of classes) {
		const gap = cls.match(/^gap-(\d+(?:-\d+)?)$/);
		if (gap) layout.itemSpacing = spacingToken(gap[1]);
		const p = cls.match(/^p-(\d+(?:-\d+)?)$/);
		if (p) {
			const token = spacingToken(p[1]);
			layout.paddingTop = token;
			layout.paddingRight = token;
			layout.paddingBottom = token;
			layout.paddingLeft = token;
		}
		const px = cls.match(/^px-(\d+(?:-\d+)?)$/);
		if (px) {
			layout.paddingLeft = spacingToken(px[1]);
			layout.paddingRight = spacingToken(px[1]);
		}
		const py = cls.match(/^py-(\d+(?:-\d+)?)$/);
		if (py) {
			layout.paddingTop = spacingToken(py[1]);
			layout.paddingBottom = spacingToken(py[1]);
		}
		const pt = cls.match(/^pt-(\d+(?:-\d+)?)$/);
		if (pt) layout.paddingTop = spacingToken(pt[1]);
		const pr = cls.match(/^pr-(\d+(?:-\d+)?)$/);
		if (pr) layout.paddingRight = spacingToken(pr[1]);
		const pb = cls.match(/^pb-(\d+(?:-\d+)?)$/);
		if (pb) layout.paddingBottom = spacingToken(pb[1]);
		const pl = cls.match(/^pl-(\d+(?:-\d+)?)$/);
		if (pl) layout.paddingLeft = spacingToken(pl[1]);
	}

	if (hasClass(node, "justify-between")) layout.primaryAxisAlignItems = "SPACE_BETWEEN";
	else if (hasClass(node, "justify-center")) layout.primaryAxisAlignItems = "CENTER";
	else if (hasClass(node, "justify-end")) layout.primaryAxisAlignItems = "MAX";
	else if (hasClass(node, "justify-start")) layout.primaryAxisAlignItems = "MIN";

	if (hasClass(node, "items-center")) layout.counterAxisAlignItems = "CENTER";
	else if (hasClass(node, "items-start")) layout.counterAxisAlignItems = "MIN";
	else if (hasClass(node, "items-end")) layout.counterAxisAlignItems = "MAX";

	if (hasClass(node, "grow") || hasClass(node, "flex-1") || hasClass(node, "w-full")) {
		layout.layoutSizingHorizontal = "FILL";
	}
	if (hasClass(node, "h-full") || hasClass(node, "grow") || hasClass(node, "flex-1")) {
		layout.layoutSizingVertical = "FILL";
	}
	if (hasClass(node, "shrink-0")) {
		layout.layoutSizingHorizontal = layout.layoutSizingHorizontal || "HUG";
		layout.layoutSizingVertical = layout.layoutSizingVertical || "HUG";
	}

	if (hasClass(node, "border-t")) {
		layout.strokeTopWeight = 1;
		layout.strokeColor = "color/slide-surface-border";
	}

	if (attr(node, "width") === "fill") layout.layoutSizingHorizontal = "FILL";
	if (attr(node, "width") === "hug") layout.layoutSizingHorizontal = "HUG";
	if (attr(node, "height") === "fill") layout.layoutSizingVertical = "FILL";
	if (attr(node, "height") === "hug") layout.layoutSizingVertical = "HUG";

	return layout;
}

function colorFromNode(node) {
	const classes = classList(node);
	for (const cls of classes) {
		if (cls.startsWith("color-")) return cls.replace(/^color-/, "color/").replace(/_/g, "-");
	}
	const tone = attr(node, "tone");
	if (tone === "strong") return "color/slide-foreground-strong";
	if (tone === "subtle") return "color/slide-foreground-subtle";
	if (tone === "base") return "color/slide-foreground-base";
	return "color/slide-foreground-base";
}

function normalizeSize(size) {
	let value = String(size || "400");
	if (value === "sm") value = "350";
	if (value === "base") value = "400";
	return value;
}

function weightToken(weight) {
	if (weight === "bold" || weight === "strong") return "weight/bold";
	if (weight === "medium") return "weight/medium";
	return "weight/regular";
}

const FAMILY_MAP = {
	"cover-title": "family/cover-title",
	"slide-title": "family/slide-title",
	"card-title": "family/card-title",
	"paragraph-title": "family/paragraph-title",
	body: "family/body",
	heading: "family/slide-title",
	display: "family/slide-title",
	base: "family/body",
};

function familyToken(family) {
	return FAMILY_MAP[family] || "family/body";
}

function typeTokens({
	family = "body",
	weight = "regular",
	size = "400",
	lineHeight = "md",
	letterSpacing = "base",
} = {}) {
	return {
		family: familyToken(family),
		weight: weightToken(weight),
		size: `size/${normalizeSize(size)}`,
		lineHeight: `lineheight/${lineHeight}`,
		letterSpacing: `letterspacing/${letterSpacing}`,
	};
}

function typeFromTextNode(node) {
	return typeTokens({
		family: attr(node, "family", "body"),
		weight: attr(node, "weight", "regular"),
		size: attr(node, "size", "400"),
	});
}

function typeFromCopyNode(node) {
	const sizeKey = String(attr(node, "size", "base")).toLowerCase();
	return typeTokens({
		family: "body",
		weight: attr(node, "weight") === "strong" ? "bold" : "medium",
		size: COPY_SIZE[sizeKey] || "350",
	});
}

function isQfcCard(node) {
	return (node.children || []).some((child) =>
		["quick-fact-card-pretitle", "quick-fact-card-title", "quick-fact-card-meta"].includes(child.tag),
	);
}

function iconKind(node) {
	const blob = JSON.stringify(node);
	if (blob.includes("14.8284") && blob.includes("10.5858")) return "out-of-scope";
	if (blob.includes("11.0026") && blob.includes("11.7574")) return "in-scope";
	return null;
}

function isListItemRow(node) {
	if (node.tag !== "div") return false;
	if (!hasClass(node, "flex") || !hasClass(node, "items-center")) return false;
	return Boolean(iconKind(node)) && Boolean(findChild(node, "text") || findChild(node, "copy"));
}

function logoFromSvg(node, warnings) {
	const label = attr(node, "aria-label", "Logo");
	const hrefNode = (node.children || []).find((child) => child.tag === "use");
	const href = hrefNode ? String(attr(hrefNode, "href", attr(hrefNode, "xlink:href", ""))) : "";
	const style = String(attr(node, "style", ""));
	const heightMatch = style.match(/height:\s*([\d.]+)px/i);
	const viewBox = String(attr(node, "viewBox", "0 0 76 16")).split(/\s+/);
	const vbW = Number(viewBox[2]) || 76;
	const vbH = Number(viewBox[3]) || 16;
	const height = heightMatch ? Number(heightMatch[1]) : vbH;
	const width = (vbW / vbH) * height;
	let component = "component/logo-placeholder";
	if (/riverton-logo/.test(href) || /riverton/i.test(label)) component = "component/logo-riverton";
	else if (/gratia-logo/.test(href) || /gratia/i.test(label)) component = "component/logo-gratia-brand";
	else if (/placeholder-logo/.test(href)) {
		component = "component/logo-placeholder";
		warnings.push("Placeholder logo in slide; swap for a brand logo component before publishing.");
	}
	return {
		type: "instance",
		component,
		name: `${label} logo`,
		width,
		height,
		layoutSizingHorizontal: "FIXED",
		layoutSizingVertical: "FIXED",
	};
}

function walk(node, warnings) {
	if (!node || node.type === "text") return null;
	if (SKIP_TAGS.has(node.tag)) {
		const kids = (node.children || []).map((child) => walk(child, warnings)).filter(Boolean);
		if (kids.length === 1) return kids[0];
		if (!kids.length) return null;
		return { type: "frame", name: node.tag, layout: "VERTICAL", children: kids };
	}

	if (node.tag === "text") {
		const characters = collapseText(collectText(node));
		if (!characters) return null;
		return {
			type: "text",
			name: "Text",
			characters,
			typography: typeFromTextNode(node),
			color: colorFromNode(node),
		};
	}

	if (node.tag === "copy") {
		const characters = collapseText(collectText(node));
		if (!characters) return null;
		return {
			type: "text",
			name: "Copy",
			characters,
			typography: typeFromCopyNode(node),
			color: colorFromNode(node),
		};
	}

	if (node.tag === "svg") {
		const kind = iconKind(node);
		if (kind) {
			return {
				type: "instance",
				component: kind === "in-scope" ? "component/icon-check" : "component/icon-close",
				width: 16,
				height: 16,
			};
		}
		return logoFromSvg(node, warnings);
	}

	if (node.tag === "img") {
		const src = String(attr(node, "src", ""));
		if (/gratia-logo/.test(src)) {
			return { type: "instance", component: "component/logo-gratia", name: "Gratia" };
		}
		warnings.push(`Unmapped <img src="${src}">`);
		return null;
	}

	if (node.tag === "section-title") {
		return {
			type: "instance",
			component: "componentset/section-title",
			name: "Section Title",
			properties: {
				size: attr(node, "size", "md"),
				Title: collapseText(collectText(node)),
			},
			layoutSizingHorizontal: "FILL",
			layoutSizingVertical: "HUG",
		};
	}

	if (node.tag === "slide-title") {
		const pre = findChild(node, "slide-title-pre");
		const main = findChild(node, "slide-title-main");
		const sub = findChild(node, "slide-title-sub");
		const size = attr(main, "size", attr(node, "size", "md"));
		return {
			type: "instance",
			component: "componentset/slide-title",
			name: "Slide Title",
			properties: {
				size,
				Main: collapseText(collectText(main || node)),
				Pre: collapseText(collectText(pre)),
				Sub: collapseText(collectText(sub)),
				"Show pre": Boolean(pre && collapseText(collectText(pre))),
				"Show sub": Boolean(sub && collapseText(collectText(sub))),
			},
			layoutSizingHorizontal: "FILL",
			layoutSizingVertical: "HUG",
			note: "Always set size; Figma defaultVariant is lg, CSS default is md.",
		};
	}

	if (node.tag === "attribution-box-separator") {
		return { type: "instance", component: "component/attribution-box-separator", name: "Separator" };
	}

	if (node.tag === "attribution-box") {
		const variant = attr(node, "variant", "title");
		const slot = (node.children || []).map((child) => walk(child, warnings)).filter(Boolean);
		for (const child of slot) {
			if (child.type === "text") {
				child.typography = typeTokens({
					family: "body",
					weight: "regular",
					size: variant === "title" ? "300" : "200",
				});
				child.color = variant === "title" ? "color/slide-surface-foreground-base" : "color/slide-surface-foreground-subtle";
			}
		}
		return {
			type: "instance",
			component: "componentset/attribution-box",
			name: "Attribution",
			properties: { variant },
			slot,
			layoutSizingHorizontal: "HUG",
			layoutSizingVertical: "HUG",
			note: "Fill slot on a top-level instance, then reparent into the footer/cover. Do not remove() nested slot children.",
		};
	}

	if (node.tag === "card" && isQfcCard(node)) {
		const pre = findChild(node, "quick-fact-card-pretitle");
		const title = findChild(node, "quick-fact-card-title");
		const meta = findChild(node, "quick-fact-card-meta");
		return {
			type: "instance",
			component: "component/quick-fact-card",
			name: "Quick Fact Card",
			properties: {
				Pretitle: collapseText(collectText(pre)),
				Title: collapseText(collectText(title)),
				Meta: collapseText(collectText(meta)),
				"Show meta": Boolean(meta && collapseText(collectText(meta))),
			},
			layoutSizingHorizontal: attr(node, "width", "fill") === "fill" ? "FILL" : "HUG",
			layoutSizingVertical: "HUG",
		};
	}

	if (node.tag === "card") {
		return {
			type: "instance",
			component: "componentset/card",
			name: "Card",
			properties: {
				padding: attr(node, "padding", "md"),
				gap: attr(node, "gap", "md"),
			},
			slot: (node.children || []).map((child) => walk(child, warnings)).filter(Boolean),
			layoutSizingHorizontal: attr(node, "width", "fill") === "fill" ? "FILL" : "HUG",
			layoutSizingVertical: "HUG",
			note: "Always set padding/gap; Figma defaultVariant is sm/sm, CSS default is md/md.",
		};
	}

	if (node.tag === "alert") {
		const frame = parseUtilityLayout(node);
		frame.name = "Alert";
		frame.layout = "VERTICAL";
		frame.fill = "color/slide-surface-background";
		frame.strokeColor = attr(node, "variant")
			? `color/${attr(node, "variant")}`
			: "color/highlight";
		frame.children = (node.children || []).map((child) => {
			if (child.tag === "alert-title") {
				return {
					type: "text",
					name: "Alert title",
					characters: collapseText(collectText(child)),
					typography: typeTokens({ family: "heading", weight: "bold", size: "500" }),
					color: "color/slide-surface-foreground-strong",
				};
			}
			if (child.tag === "alert-description") {
				return {
					type: "text",
					name: "Alert description",
					characters: collapseText(collectText(child)),
					typography: typeTokens({ family: "body", weight: "regular", size: "400" }),
					color: "color/slide-surface-foreground-base",
				};
			}
			return walk(child, warnings);
		}).filter(Boolean);
		return frame;
	}

	if (isListItemRow(node)) {
		return {
			type: "instance",
			component: "componentset/list-item",
			name: "List Item",
			properties: {
				kind: iconKind(node),
				Label: collapseText(collectText(findChild(node, "text") || findChild(node, "copy"))),
			},
			layoutSizingHorizontal: "FILL",
			layoutSizingVertical: "HUG",
		};
	}

	if (node.tag === "slide") {
		const kids = (node.children || []).map((child) => walk(child, warnings)).filter(Boolean);
		if (kids.length === 1) return kids[0];
		return { type: "frame", name: "Slide root", layout: "VERTICAL", children: kids };
	}

	if (node.tag === "slide-header" || node.tag === "slide-content" || node.tag === "slide-footer") {
		const slotName = node.tag.replace("slide-", "");
		return {
			type: "slot",
			name: slotName.charAt(0).toUpperCase() + slotName.slice(1),
			children: (node.children || []).map((child) => walk(child, warnings)).filter(Boolean),
		};
	}

	const frame = parseUtilityLayout(node);
	frame.children = (node.children || [])
		.map((child) => walk(child, warnings))
		.filter(Boolean);
	if (!frame.children.length && frame.layout === "NONE") return null;
	if (frame.children.length === 1 && frame.layout === "NONE" && !frame.itemSpacing && !frame.paddingTop) {
		return frame.children[0];
	}
	return frame;
}

function parseSlide(html, source, warnings) {
	const forest = toForest(tokenize(html));
	const slides = [];
	function findSlides(node) {
		if (node.tag === "slide") slides.push(node);
		for (const child of node.children || []) findSlides(child);
	}
	findSlides(forest);
	if (slides.length !== 1) {
		throw new Error(`${source}: expected 1 <slide>, found ${slides.length}`);
	}
	const slide = slides[0];
	const hasChrome = (slide.children || []).some((child) =>
		["slide-header", "slide-content", "slide-footer"].includes(child.tag),
	);
	const isCover = hasClass(slide, "bg-cover");
	const ir = {
		source,
		surface: isCover ? "cover" : "default",
		chrome: hasChrome ? "slide" : "cover",
		size: { width: 1280, height: 800 },
	};
	if (!hasChrome) {
		ir.fill = isCover ? "color/cover-background" : "color/slide-background";
		ir.root = walk(slide, warnings);
		ir.note = "Cover/title slides must not instance the Slide component; header/content/footer padding would be wrong.";
	} else {
		ir.component = "componentset/slide";
		ir.properties = { surface: isCover ? "primary" : "default" };
		ir.slots = {};
		for (const child of slide.children || []) {
			const mapped = walk(child, warnings);
			if (mapped && mapped.type === "slot") ir.slots[mapped.name.toLowerCase()] = mapped.children;
		}
	}
	return ir;
}

function parseDeck(deckDir) {
	const resolved = path.resolve(deckDir);
	const manifestPath = path.join(resolved, "slides.json");
	if (!fs.existsSync(manifestPath)) {
		throw new Error(`Missing slides.json in ${resolved}`);
	}
	const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
	const warnings = [];
	const slides = (manifest.slides || []).map((filename) => {
		const filePath = path.join(resolved, filename);
		const html = fs.readFileSync(filePath, "utf8");
		return parseSlide(html, filename, warnings);
	});
	return {
		title: manifest.title || path.basename(resolved),
		brand: manifest.brand || null,
		deck: path.relative(ROOT, resolved) || path.basename(resolved),
		slides,
		warnings,
	};
}

function main() {
	const args = process.argv.slice(2);
	if (!args[0]) usage();
	const outIndex = args.indexOf("--out");
	const outPath = outIndex !== -1 ? args[outIndex + 1] : null;
	const ir = parseDeck(args[0]);
	const json = `${JSON.stringify(ir, null, "\t")}\n`;
	if (outPath) {
		fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
		fs.writeFileSync(outPath, json, "utf8");
		console.error(`Wrote ${outPath} (${ir.slides.length} slides, ${ir.warnings.length} warnings)`);
	} else {
		process.stdout.write(json);
	}
	if (ir.warnings.length) {
		for (const warning of ir.warnings) console.error(`warning: ${warning}`);
	}
}

module.exports = { parseDeck, parseSlide };

if (require.main === module) {
	try {
		main();
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
}

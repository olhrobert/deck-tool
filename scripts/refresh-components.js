#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { ROOT, discoverSlideFiles } = require("./compile-deck.js");

const COMPONENTS_DIR = path.join(ROOT, "design-system", "components");
const REGISTRY_PATH = path.join(COMPONENTS_DIR, "registry.json");
const VOID_TAGS = new Set([
	"area",
	"base",
	"br",
	"col",
	"embed",
	"hr",
	"img",
	"input",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr",
	"use",
	"path",
]);

function listDeckDirectories() {
	const decksDir = path.join(ROOT, "decks");
	if (!fs.existsSync(decksDir)) return [];
	return fs
		.readdirSync(decksDir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => path.join(decksDir, entry.name))
		.filter((deckDir) => discoverSlideFiles(deckDir).length > 0)
		.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function usage() {
	console.error("Usage: node scripts/refresh-components.js <deck-directory>");
	console.error("       node scripts/refresh-components.js --all");
	console.error("Example: node scripts/refresh-components.js decks/riverton-project-charter");
	process.exit(1);
}

function parseAttrs(raw) {
	const attrs = {};
	const attrOrder = [];
	const re =
		/([:@]?[\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
	let match;
	while ((match = re.exec(raw))) {
		const name = match[1];
		const value =
			match[2] !== undefined
				? match[2]
				: match[3] !== undefined
					? match[3]
					: match[4] !== undefined
						? match[4]
						: true;
		attrs[name] = value;
		attrOrder.push(name);
	}
	return { attrs, attrOrder };
}

function parseHtml(html) {
	const root = {
		type: "element",
		tag: "#document",
		attrs: {},
		attrOrder: [],
		children: [],
		start: 0,
		end: html.length,
	};
	const stack = [root];
	let i = 0;

	while (i < html.length) {
		if (html.startsWith("<!--", i)) {
			const end = html.indexOf("-->", i + 4);
			const close = end === -1 ? html.length : end + 3;
			stack[stack.length - 1].children.push({
				type: "comment",
				value: html.slice(i, close),
				start: i,
				end: close,
			});
			i = close;
			continue;
		}

		if (html.startsWith("<!DOCTYPE", i) || html.startsWith("<!doctype", i)) {
			const end = html.indexOf(">", i);
			const close = end === -1 ? html.length : end + 1;
			stack[stack.length - 1].children.push({
				type: "doctype",
				value: html.slice(i, close),
				start: i,
				end: close,
			});
			i = close;
			continue;
		}

		if (html[i] === "<") {
			const end = html.indexOf(">", i);
			if (end === -1) break;
			const raw = html.slice(i + 1, end);

			if (raw.startsWith("/")) {
				const tag = raw.slice(1).trim().split(/\s/)[0].toLowerCase();
				for (let s = stack.length - 1; s > 0; s -= 1) {
					if (stack[s].tag === tag) {
						stack[s].end = end + 1;
						stack.length = s;
						break;
					}
				}
				i = end + 1;
				continue;
			}

			const selfClosing = raw.endsWith("/");
			const body = (selfClosing ? raw.slice(0, -1) : raw).trim();
			const space = body.search(/\s/);
			const tag = (space === -1 ? body : body.slice(0, space)).toLowerCase();
			const attrRaw = space === -1 ? "" : body.slice(space);
			const { attrs, attrOrder } = parseAttrs(attrRaw);
			const voidTag = selfClosing || VOID_TAGS.has(tag);
			const node = {
				type: "element",
				tag,
				attrs,
				attrOrder,
				children: [],
				start: i,
				openEnd: end + 1,
				end: end + 1,
				selfClosing: voidTag,
			};
			stack[stack.length - 1].children.push(node);
			i = end + 1;
			if (voidTag) {
				node.end = i;
			} else {
				stack.push(node);
			}
			continue;
		}

		const next = html.indexOf("<", i);
		const close = next === -1 ? html.length : next;
		stack[stack.length - 1].children.push({
			type: "text",
			value: html.slice(i, close),
			start: i,
			end: close,
		});
		i = close;
	}

	return root;
}

function elementChildren(node) {
	return (node.children || []).filter((child) => child.type === "element");
}

function hasDescendantTag(node, tag) {
	for (const child of node.children || []) {
		if (child.type !== "element") continue;
		if (child.tag === tag) return true;
		if (hasDescendantTag(child, tag)) return true;
	}
	return false;
}

function findFirstDescendant(node, predicate, skip = new Set()) {
	for (const child of node.children || []) {
		if (child.type !== "element") continue;
		if (skip.has(child)) continue;
		if (predicate(child)) return child;
		const nested = findFirstDescendant(child, predicate, skip);
		if (nested) return nested;
	}
	return null;
}

function collectText(node) {
	if (!node) return "";
	if (node.type === "text") return node.value || "";
	return (node.children || []).map(collectText).join("");
}

function cloneNode(node) {
	if (node.type === "text") return { type: "text", value: node.value };
	if (node.type === "comment" || node.type === "doctype") {
		return { type: node.type, value: node.value };
	}
	return {
		type: "element",
		tag: node.tag,
		attrs: { ...(node.attrs || {}) },
		attrOrder: [...(node.attrOrder || [])],
		children: (node.children || []).map(cloneNode),
		selfClosing: node.selfClosing,
	};
}

function matchesSpec(node, spec) {
	if (node.type !== "element" || node.tag !== spec.tag) return false;
	if (spec.match && spec.match.has) {
		return spec.match.has.every((tag) => hasDescendantTag(node, tag));
	}
	if (spec.match && spec.match.attrs) {
		return Object.entries(spec.match.attrs).every(
			([name, value]) => node.attrs && node.attrs[name] === value,
		);
	}
	return true;
}

function collectHosts(node, specs, found = []) {
	if (node.type === "element" && node.tag !== "#document") {
		const spec = specs.find((item) => matchesSpec(node, item));
		if (spec) found.push({ node, spec });
	}
	for (const child of node.children || []) {
		collectHosts(child, specs, found);
	}
	return found;
}

function extractSlotsByAttr(node) {
	const slots = {};
	function walk(current) {
		if (current.type !== "element") return;
		const name = current.attrs && current.attrs["data-slot"];
		if (name) {
			slots[name] = current;
			return;
		}
		for (const child of current.children || []) walk(child);
	}
	for (const child of node.children || []) walk(child);
	return slots;
}

function extractSlotsByTag(node, spec) {
	const slots = {};
	const used = new Set();
	for (const slot of spec.slots || []) {
		const match = findFirstDescendant(
			node,
			(child) => child.tag === slot.tag,
			used,
		);
		if (match) {
			slots[slot.name] = match;
			used.add(match);
		}
	}
	return slots;
}

function extractAttributionTitle(node) {
	const slots = {};
	const children = elementChildren(node);
	const text = children.find((child) => child.tag === "text");
	const img = children.find((child) => child.tag === "img");
	if (text) slots.credit = text;
	if (img) slots.logo = img;
	return slots;
}

function extractAttributionContent(node) {
	const slots = {};
	const children = elementChildren(node);
	const texts = [];
	let img = null;
	let imgIndex = -1;

	children.forEach((child, index) => {
		if (child.tag === "img") {
			img = child;
			imgIndex = index;
		}
		if (child.tag === "text") texts.push({ child, index });
	});

	if (img) slots.logo = img;

	const before = texts
		.filter((item) => imgIndex === -1 || item.index < imgIndex)
		.map((item) => item.child);
	const after = texts
		.filter((item) => imgIndex !== -1 && item.index > imgIndex)
		.map((item) => item.child);

	if (after[0]) slots.page = after[0];

	if (before.length >= 2) {
		slots.disclaimer = before[0];
		slots["prepared-by"] = before[before.length - 1];
	} else if (before.length === 1) {
		const value = collectText(before[0]).trim().toLowerCase();
		if (value === "prepared by" || value.startsWith("prepared by")) {
			slots["prepared-by"] = before[0];
		} else {
			slots.disclaimer = before[0];
		}
	}

	return slots;
}

function extractSlots(node, spec) {
	const byAttr = extractSlotsByAttr(node);
	if (Object.keys(byAttr).length > 0) return byAttr;
	if (spec.infer === "attribution-title") return extractAttributionTitle(node);
	if (spec.infer === "attribution-content") {
		return extractAttributionContent(node);
	}
	return extractSlotsByTag(node, spec);
}

function isSlotNode(node) {
	return Boolean(node && node.type === "element" && node.attrs && node.attrs["data-slot"]);
}

function slotName(node) {
	return node.attrs["data-slot"];
}

function templateElementChildren(node) {
	return (node.children || []).filter((child) => child.type === "element");
}

function includedSlotNames(spec, instanceSlots) {
	const included = new Set();
	for (const slot of spec.slots || []) {
		if (instanceSlots[slot.name] || slot.required) included.add(slot.name);
	}
	return included;
}

function keepTemplateChild(templateChildren, index, included) {
	const child = templateChildren[index];
	if (isSlotNode(child)) return included.has(slotName(child));

	let before;
	let after;
	for (let i = index - 1; i >= 0; i -= 1) {
		if (isSlotNode(templateChildren[i])) {
			before = slotName(templateChildren[i]);
			break;
		}
	}
	for (let i = index + 1; i < templateChildren.length; i += 1) {
		if (isSlotNode(templateChildren[i])) {
			after = slotName(templateChildren[i]);
			break;
		}
	}

	if (before && after) return included.has(before) && included.has(after);
	if (before) return included.has(before);
	if (after) return included.has(after);
	return true;
}

function mergeSlotAttrs(instanceSlot, templateSlot) {
	const attrs = { ...(instanceSlot ? instanceSlot.attrs : templateSlot.attrs) };
	attrs["data-slot"] = templateSlot.attrs["data-slot"];
	delete attrs.start;
	const attrOrder = [
		...(instanceSlot && instanceSlot.attrOrder
			? instanceSlot.attrOrder.filter((name) => name !== "data-slot")
			: []),
		"data-slot",
	];
	if (!instanceSlot) {
		return {
			attrs: { ...templateSlot.attrs, "data-slot": templateSlot.attrs["data-slot"] },
			attrOrder: templateSlot.attrOrder.includes("data-slot")
				? [...templateSlot.attrOrder]
				: [...templateSlot.attrOrder, "data-slot"],
		};
	}
	return { attrs, attrOrder };
}

function rebuildHost(instance, spec, templateHost, warnings) {
	const instanceSlots = extractSlots(instance, spec);
	const included = includedSlotNames(spec, instanceSlots);
	const used = new Set(Object.values(instanceSlots));

	for (const slot of spec.slots || []) {
		if (slot.required && !instanceSlots[slot.name]) {
			warnings.push(
				`${spec.id}: missing required slot "${slot.name}" on <${spec.tag}>`,
			);
		}
	}

	const host = {
		type: "element",
		tag: templateHost.tag,
		attrs: { ...(instance.attrs || {}) },
		attrOrder: [...(instance.attrOrder || [])],
		children: [],
		selfClosing: false,
	};
	delete host.attrs["data-slot"];
	host.attrOrder = host.attrOrder.filter((name) => name !== "data-slot");

	const templateChildren = templateElementChildren(templateHost);
	templateChildren.forEach((tChild, index) => {
		if (!keepTemplateChild(templateChildren, index, included)) return;

		if (!isSlotNode(tChild)) {
			host.children.push(cloneNode(tChild));
			return;
		}

		const name = slotName(tChild);
		const instanceSlot = instanceSlots[name];
		const { attrs, attrOrder } = mergeSlotAttrs(instanceSlot, tChild);
		host.children.push({
			type: "element",
			tag: tChild.tag,
			attrs,
			attrOrder,
			children: instanceSlot
				? (instanceSlot.children || []).map(cloneNode)
				: (tChild.children || []).map(cloneNode),
			selfClosing: tChild.selfClosing,
		});
	});

	for (const child of elementChildren(instance)) {
		if (used.has(child)) continue;
		if (child.tag === "attribution-box-separator") continue;
		host.children.push(cloneNode(child));
	}

	return host;
}

function escapeAttr(value) {
	return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function serializeAttrs(node) {
	const names = [];
	const seen = new Set();
	for (const name of node.attrOrder || []) {
		if (node.attrs[name] === undefined || seen.has(name)) continue;
		names.push(name);
		seen.add(name);
	}
	for (const name of Object.keys(node.attrs || {})) {
		if (seen.has(name) || node.attrs[name] === undefined) continue;
		names.push(name);
	}

	let out = "";
	for (const name of names) {
		const value = node.attrs[name];
		if (value === true) out += ` ${name}`;
		else out += ` ${name}="${escapeAttr(value)}"`;
	}
	return out;
}

function isSignificant(node) {
	if (!node) return false;
	if (node.type === "element" || node.type === "comment") return true;
	if (node.type === "text") return Boolean(node.value && node.value.trim());
	return false;
}

function serializePretty(node, indent) {
	if (node.type === "text") return node.value;
	if (node.type === "comment" || node.type === "doctype") return node.value;

	const attrs = serializeAttrs(node);
	const voidTag = VOID_TAGS.has(node.tag) || node.selfClosing;
	if (voidTag) return `${indent}<${node.tag}${attrs} />`;

	const kids = (node.children || []).filter(isSignificant);
	if (kids.length === 0) {
		return `${indent}<${node.tag}${attrs}></${node.tag}>`;
	}

	if (kids.length === 1 && kids[0].type === "text") {
		const text = kids[0].value.replace(/\s+/g, " ").trim();
		return `${indent}<${node.tag}${attrs}>${text}</${node.tag}>`;
	}

	const inner = kids
		.map((child) =>
			child.type === "text"
				? `${indent}\t${child.value.trim()}`
				: serializePretty(child, `${indent}\t`),
		)
		.join("\n");
	return `${indent}<${node.tag}${attrs}>\n${inner}\n${indent}</${node.tag}>`;
}

function lineIndent(html, index) {
	const lineStart = html.lastIndexOf("\n", index - 1) + 1;
	const prefix = html.slice(lineStart, index);
	const match = prefix.match(/^[ \t]*/);
	return match ? match[0] : "";
}

function firstElement(node) {
	return (node.children || []).find((child) => child.type === "element");
}

function loadRegistry() {
	const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
	return (registry.components || []).map((spec) => {
		const templatePath = path.join(COMPONENTS_DIR, spec.template);
		const templateHtml = fs.readFileSync(templatePath, "utf8");
		const templateHost = firstElement(parseHtml(templateHtml));
		if (!templateHost) {
			throw new Error(`No host element in ${spec.template}`);
		}
		return { ...spec, templateHost };
	});
}

function refreshHtml(html, specs) {
	const warnings = [];
	let live = html;
	const root = parseHtml(live);
	const hosts = collectHosts(root, specs).sort(
		(a, b) => b.node.start - a.node.start,
	);
	const outermost = hosts.filter(({ node }) => {
		return !hosts.some(
			({ node: other }) =>
				other !== node &&
				other.start <= node.start &&
				other.end >= node.end,
		);
	});

	let changed = 0;
	for (const { node, spec } of outermost) {
		let start = node.start;
		let end = node.end;
		if (start >= end || start < 0 || end > live.length) continue;

		const fragment = live.slice(start, end);
		const parsed = firstElement(parseHtml(fragment));
		if (!parsed) continue;

		const rebuilt = rebuildHost(parsed, spec, spec.templateHost, warnings);
		const indent = lineIndent(live, start);
		const next = serializePretty(rebuilt, indent).slice(indent.length);
		const previous = live.slice(start, end);
		if (next === previous) continue;

		live = live.slice(0, start) + next + live.slice(end);
		changed += 1;
	}

	return { html: live, changed, warnings };
}

function refreshDeck(deckDir, specs, { dryRun = false } = {}) {
	const resolved = path.resolve(deckDir);
	const files = discoverSlideFiles(resolved);
	if (files.length === 0) {
		throw new Error(`No slide HTML files found in ${resolved}`);
	}

	let filesChanged = 0;
	let hostsChanged = 0;

	for (const filename of files) {
		const filePath = path.join(resolved, filename);
		const original = fs.readFileSync(filePath, "utf8");
		const result = refreshHtml(original, specs);
		hostsChanged += result.changed;
		for (const warning of result.warnings) {
			console.warn(`  ${filename}: ${warning}`);
		}
		if (result.html === original) continue;
		filesChanged += 1;
		if (!dryRun) fs.writeFileSync(filePath, result.html, "utf8");
		console.log(
			`  ${dryRun ? "Would update" : "Updated"} ${filename} (${result.changed} component${result.changed === 1 ? "" : "s"})`,
		);
	}

	if (filesChanged === 0) {
		console.log("  No component markup changes.");
	}

	return { filesChanged, hostsChanged };
}

function parseArgs(argv) {
	const args = argv.slice(2);
	const dryRun = args.includes("--dry-run");
	const all = args.includes("--all");
	const positional = args.filter((arg) => !arg.startsWith("--"));
	return { dryRun, all, positional };
}

if (require.main === module) {
	const { dryRun, all, positional } = parseArgs(process.argv);
	if (!all && positional.length === 0) usage();

	try {
		const specs = loadRegistry();
		const decks = all
			? listDeckDirectories()
			: positional.map((dir) => path.resolve(dir));

		if (decks.length === 0) {
			console.log("No decks found.");
			process.exit(0);
		}

		for (const deckDir of decks) {
			console.log(`[${path.basename(deckDir)}]`);
			refreshDeck(deckDir, specs, { dryRun });
		}
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
}

module.exports = {
	parseHtml,
	refreshHtml,
	refreshDeck,
	loadRegistry,
};

#!/usr/bin/env node
/**
 * Compare a Figma template snapshot to the generated IR.
 * Suggests HTML and mapper edits. Does not write either.
 *
 *   node scripts/figma/diff-template.js chapter-slide-02 scripts/figma/pull/out/chapter-slide-02.snapshot.json
 *   node scripts/figma/diff-template.js chapter-slide-02 snapshot.json --copy
 */

const fs = require("fs");
const path = require("path");

const TEMPLATES_DIR = path.join(__dirname, "templates");

const LAYOUT_PROPS = [
	"layoutSizingHorizontal",
	"layoutSizingVertical",
	"maxWidth",
	"itemSpacing",
	"padding",
	"primaryAxisAlignItems",
	"counterAxisAlignItems",
];

/**
 * Instance mappers that ignore width=/height= and hardcode sizing.
 * honorsWidth false → a FILL/HUG diff must change the mapper, not only the HTML.
 */
const INSTANCE_MAPPERS = {
	"cover-title": { fn: "mapCoverTitle", honorsWidth: true, defaultH: "HUG", defaultV: "HUG" },
	"attribution-box": { fn: "mapAttributionBox", honorsWidth: false, defaultH: "HUG", defaultV: "HUG" },
	badge: { fn: "mapBadge", honorsWidth: false, defaultH: "HUG", defaultV: "HUG" },
	"brand-logo": { fn: "mapBrandLogo", honorsWidth: false, defaultH: "HUG", defaultV: "HUG" },
	stamp: { fn: "mapStamp", honorsWidth: false, defaultH: "FIXED", defaultV: "FIXED" },
};

function usage() {
	console.error(
		"Usage: node scripts/figma/diff-template.js <template-id> <snapshot.json> [--copy]",
	);
}

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normSpace(value) {
	if (value == null || value === 0 || value === "0" || value === "spacing-0") return 0;
	return value;
}

function paddingEqual(ir, fig) {
	const sides = ["top", "right", "bottom", "left"];
	for (const side of sides) {
		const left = ir && ir[side] != null ? ir[side] : 0;
		const right = fig && fig[side] != null ? fig[side] : 0;
		if (normSpace(left) !== normSpace(right)) return false;
	}
	return true;
}

function valuesEqual(prop, ir, fig) {
	if (prop === "itemSpacing") return normSpace(ir) === normSpace(fig);
	if (prop === "padding") return paddingEqual(ir, fig);
	if (prop === "maxWidth") return (ir ?? null) === (fig ?? null);
	if (prop === "primaryAxisAlignItems" || prop === "counterAxisAlignItems") {
		return (ir || "MIN") === (fig || "MIN");
	}
	if (prop === "layoutSizingHorizontal" || prop === "layoutSizingVertical") {
		if (ir == null) return fig == null || fig === "HUG";
		return ir === fig;
	}
	return ir === fig;
}

function htmlTag(node) {
	if (!node) return "node";
	if (node.type === "text" || node.name === "text") return "text";
	if (node.name === "stack") return "stack";
	if (node.name === "frame") return "div";
	return node.name || "node";
}

function suggest(node, prop, figmaValue) {
	const tag = htmlTag(node);
	const mapper = INSTANCE_MAPPERS[node.name] || INSTANCE_MAPPERS[node.component];
	if (prop === "layoutSizingHorizontal" || prop === "layoutSizingVertical") {
		const axis = prop === "layoutSizingHorizontal" ? "width" : "height";
		const token = figmaValue === "FILL" ? "fill" : figmaValue === "HUG" ? "hug" : null;
		if (!token) {
			return `Figma ${axis} is ${figmaValue}. No width/height attribute for FIXED; say so and stop.`;
		}
		const html = `Set ${axis}="${token}" on <${tag}>.`;
		if (mapper && !mapper.honorsWidth) {
			const fallback = axis === "width" ? mapper.defaultH : mapper.defaultV;
			const helper = axis === "width" ? "horizontalSize" : "verticalSize";
			return `${html} Mapper: ${mapper.fn} hardcodes sizing. Use ${helper}(node.attrs.${axis}, "${fallback}") before trusting the attribute.`;
		}
		if (tag === "div") {
			return `${html} This frame is a layout div, not a <stack>. Prefer a class the mapper already reads (w-full, h-full, grow) or leave it a div.`;
		}
		return html;
	}
	if (prop === "maxWidth") {
		if (figmaValue === 600) return `Add class max-w-md on <${tag}> (mapper maps that class to maxWidth 600).`;
		if (figmaValue == null) return `Remove max-w-md (or other max-width) from <${tag}>.`;
		return `maxWidth ${figmaValue} has no token class. Do not invent one.`;
	}
	if (prop === "itemSpacing") {
		const step = String(figmaValue || "").match(/^spacing-(.+)$/);
		if (step && tag === "stack") return `Set gap="${step[1]}" on <stack>.`;
		if (normSpace(figmaValue) === 0 && tag === "stack") return `Set gap="0" on <stack>.`;
		return `itemSpacing is ${JSON.stringify(figmaValue)}. Map a spacing-* binding to gap on <stack>; leave unbound px alone.`;
	}
	if (prop === "padding") {
		return `Padding differs on <${tag}>. Prefer spacing classes the mapper already reads (p-*, px-*, pt-*, pr-*, pb-*, pl-*).`;
	}
	if (prop === "primaryAxisAlignItems") {
		if (figmaValue === "SPACE_BETWEEN") return `Add class justify-between on <${tag}>.`;
		if (figmaValue === "CENTER") return `Add class justify-center on <${tag}>.`;
		if (figmaValue === "MIN" || figmaValue == null) return `Remove justify-between / justify-center from <${tag}>.`;
		return `primaryAxisAlignItems ${figmaValue} — set the matching justify-* class if one exists.`;
	}
	if (prop === "counterAxisAlignItems") {
		if (figmaValue === "CENTER") return `Add class items-center on <${tag}>.`;
		if (figmaValue === "MIN" || figmaValue == null) return `Remove items-center from <${tag}> if it was only for this axis.`;
		return `counterAxisAlignItems ${figmaValue} — set the matching items-* class if one exists.`;
	}
	return "No HTML suggestion.";
}

function childLabel(node, index) {
	if (!node) return `#${index}`;
	return node.name || node.type || `#${index}`;
}

function walk(ir, fig, trail, rows, copy) {
	if (!ir && !fig) return;
	if (!ir || !fig) {
		rows.push({
			kind: "structural",
			path: trail.join(" > ") || "(root)",
			detail: !ir ? "Figma has a node the IR does not." : "IR has a node the snapshot does not.",
		});
		return;
	}
	if (ir.unsupported || fig.unsupported || (fig.type && ir.type && fig.type !== ir.type)) {
		rows.push({
			kind: "structural",
			path: trail.join(" > ") || "(root)",
			detail: `Type mismatch (IR ${ir.type || "?"}, Figma ${fig.type || "?"}). Left unchanged.`,
		});
		return;
	}
	if (ir.name && fig.name && ir.name !== fig.name) {
		rows.push({
			kind: "structural",
			path: trail.join(" > ") || "(root)",
			detail: `Name mismatch (IR ${ir.name}, Figma ${fig.name}). Left unchanged.`,
		});
		return;
	}

	for (const prop of LAYOUT_PROPS) {
		if (valuesEqual(prop, ir[prop], fig[prop])) continue;
		rows.push({
			kind: "property",
			path: trail.join(" > ") || "(root)",
			property: prop,
			ir: ir[prop] === undefined ? null : ir[prop],
			figma: fig[prop] === undefined ? null : fig[prop],
			suggestion: suggest(ir, prop, fig[prop] === undefined ? null : fig[prop]),
		});
	}

	if (copy && ir.type === "text" && (ir.characters || "") !== (fig.characters || "")) {
		rows.push({
			kind: "copy",
			path: trail.join(" > ") || "(root)",
			property: "characters",
			ir: ir.characters || "",
			figma: fig.characters || "",
			suggestion: "Copy differs. Apply only if this pull asked for copy.",
		});
	}

	const irKids = ir.children || [];
	const figKids = fig.children || [];
	if (ir.type === "instance" || fig.type === "instance") {
		if (irKids.length || figKids.length) {
			rows.push({
				kind: "structural",
				path: trail.join(" > "),
				detail: "Instance interiors are not part of the template IR. Ignored.",
			});
		}
		return;
	}
	const count = Math.max(irKids.length, figKids.length);
	if (irKids.length !== figKids.length) {
		rows.push({
			kind: "structural",
			path: `${trail.join(" > ") || "(root)"} children`,
			detail: `Child count IR ${irKids.length} (${irKids.map(childLabel).join(", ") || "—"}) vs Figma ${figKids.length} (${figKids.map(childLabel).join(", ") || "—"}). Pairing by index only where both exist.`,
		});
	}
	for (let index = 0; index < count; index += 1) {
		const left = irKids[index];
		const right = figKids[index];
		const label = childLabel(left || right, index);
		walk(left, right, trail.concat(label), rows, copy);
	}
}

function printRows(rows) {
	if (rows.length === 0) {
		console.log("No differences.");
		return;
	}
	rows.forEach((row, index) => {
		console.log(`${index + 1}. [${row.kind}] ${row.path}`);
		if (row.kind === "structural") {
			console.log(`   ${row.detail}`);
			return;
		}
		console.log(`   ${row.property}`);
		console.log(`   IR:    ${JSON.stringify(row.ir)}`);
		console.log(`   Figma: ${JSON.stringify(row.figma)}`);
		console.log(`   ${row.suggestion}`);
	});
}

function main() {
	const args = process.argv.slice(2).filter((arg) => arg !== "--");
	const copy = args.includes("--copy");
	const positional = args.filter((arg) => arg !== "--copy");
	if (positional.length < 2) {
		usage();
		process.exit(2);
	}
	const [id, snapshotPath] = positional;
	const irPath = path.join(TEMPLATES_DIR, `${id}.json`);
	if (!fs.existsSync(irPath)) {
		console.error(`Missing IR ${irPath}. Run build-template.js ${id} first.`);
		process.exit(2);
	}
	if (!fs.existsSync(snapshotPath)) {
		console.error(`Missing snapshot ${snapshotPath}.`);
		process.exit(2);
	}
	const ir = readJson(irPath);
	const snapshot = readJson(snapshotPath);
	if (snapshot.id && snapshot.id !== id && snapshot.name !== id) {
		console.error(`Snapshot ${snapshot.id || snapshot.name} does not match ${id}.`);
		process.exit(2);
	}
	const rows = [];
	walk(ir.tree, snapshot.tree, [], rows, copy);
	console.log(`${id}: ${rows.length} difference${rows.length === 1 ? "" : "s"}`);
	printRows(rows);
	process.exit(rows.length === 0 ? 0 : 1);
}

module.exports = { walk, suggest, valuesEqual };

if (require.main === module) main();

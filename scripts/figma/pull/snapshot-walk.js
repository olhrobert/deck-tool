/**
 * Read-only Figma walk. Emits a tree shaped like scripts/figma/templates/<id>.json `tree`.
 * Run only from an explicit pull (use_figma). Does not write the repo.
 *
 *   const { codeFor } = require("./scripts/figma/pull/snapshot-walk.js");
 *   // pass codeFor("57:258") as the use_figma `code` argument
 */

const WALK_BODY = `
async function variableName(alias) {
	if (!alias || !alias.id) return null;
	const variable = await figma.variables.getVariableByIdAsync(alias.id);
	return variable ? variable.name : null;
}

async function spacingValue(node, field) {
	const bound = node.boundVariables && node.boundVariables[field];
	const name = await variableName(bound);
	if (name) return name;
	if (!(field in node)) return null;
	const raw = node[field];
	if (raw == null) return null;
	return raw;
}

async function paddingOf(node) {
	const fields = {
		top: "paddingTop",
		right: "paddingRight",
		bottom: "paddingBottom",
		left: "paddingLeft",
	};
	const padding = {};
	for (const side of Object.keys(fields)) {
		const value = await spacingValue(node, fields[side]);
		if (value == null || value === 0) continue;
		padding[side] = value;
	}
	return Object.keys(padding).length > 0 ? padding : undefined;
}

async function snapshotNode(node) {
	const spec = { name: node.name };
	if (node.type === "COMPONENT") spec.type = "component";
	else if (node.type === "INSTANCE") spec.type = "instance";
	else if (node.type === "TEXT") spec.type = "text";
	else if (node.type === "FRAME") spec.type = "autoLayout";
	else return { name: node.name, type: node.type, unsupported: true };

	if (spec.type === "instance") {
		const main = node.mainComponent;
		const set = main && main.parent && main.parent.type === "COMPONENT_SET" ? main.parent : null;
		spec.component = set ? set.name : main ? main.name : null;
		if (set) spec.variant = main.name;
	}

	if (spec.type !== "text" && "layoutMode" in node && node.layoutMode && node.layoutMode !== "NONE") {
		spec.layoutMode = node.layoutMode;
	}
	if ("layoutSizingHorizontal" in node && node.layoutSizingHorizontal) {
		spec.layoutSizingHorizontal = node.layoutSizingHorizontal;
	}
	if ("layoutSizingVertical" in node && node.layoutSizingVertical) {
		spec.layoutSizingVertical = node.layoutSizingVertical;
	}
	if ("maxWidth" in node && typeof node.maxWidth === "number") spec.maxWidth = node.maxWidth;
	if (spec.type !== "text" && spec.type !== "instance" && "itemSpacing" in node) {
		const spacing = await spacingValue(node, "itemSpacing");
		spec.itemSpacing = spacing == null ? 0 : spacing;
	}
	if (spec.type !== "text") {
		const padding = await paddingOf(node);
		if (padding) spec.padding = padding;
		if ("primaryAxisAlignItems" in node && node.primaryAxisAlignItems && node.primaryAxisAlignItems !== "MIN") {
			spec.primaryAxisAlignItems = node.primaryAxisAlignItems;
		}
		if ("counterAxisAlignItems" in node && node.counterAxisAlignItems && node.counterAxisAlignItems !== "MIN") {
			spec.counterAxisAlignItems = node.counterAxisAlignItems;
		}
	}
	if (spec.type === "text") spec.characters = node.characters || "";

	if (spec.type !== "instance" && spec.type !== "text" && "children" in node) {
		const children = [];
		for (const child of node.children) {
			children.push(await snapshotNode(child));
		}
		spec.children = children;
	}
	return spec;
}

const root = await figma.getNodeByIdAsync(ROOT_ID);
if (!root) throw new Error("Node " + ROOT_ID + " was not found");
if (root.type !== "COMPONENT") {
	throw new Error("Pull a template COMPONENT. " + root.name + " is " + root.type);
}
const page = root.parent && root.parent.type === "PAGE" ? root.parent : null;
if (!page) throw new Error(root.name + " is not on a page");
if (page.name === "Components") {
	throw new Error("Components-page mains are out of scope. Pull a template page.");
}
const tree = await snapshotNode(root);
return { id: root.name, name: root.name, page: page.name, tree: tree };
`;

function codeFor(rootId) {
	const id = String(rootId || "").trim();
	if (!id) throw new Error("codeFor(rootId) needs a Figma node id");
	return `const ROOT_ID = ${JSON.stringify(id)};\n${WALK_BODY}`;
}

module.exports = { codeFor, WALK_BODY };

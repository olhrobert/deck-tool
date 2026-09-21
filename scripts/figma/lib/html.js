/**
 * Minimal HTML fragment parser for DeckTool canonical markup.
 * Converts <stack> (and flex roots like <card>) into an auto-layout tree.
 * <stack> is never a Figma component — only auto-layout frames.
 */

function parseAttrs(raw) {
	const attrs = {};
	if (!raw) return attrs;
	const re = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
	let match;
	while ((match = re.exec(raw))) {
		attrs[match[1]] = match[2] ?? match[3] ?? match[4] ?? true;
	}
	return attrs;
}

function parseFragment(html) {
	const input = String(html).replace(/<!--[\s\S]*?-->/g, "").trim();
	const tokens = [];
	const re = /<\/([a-zA-Z0-9-]+)\s*>|<([a-zA-Z0-9-]+)([^>]*)>|([^<]+)/g;
	let match;
	while ((match = re.exec(input))) {
		if (match[1]) {
			tokens.push({ kind: "close", tag: match[1].toLowerCase() });
		} else if (match[2]) {
			const tag = match[2].toLowerCase();
			const raw = match[3] || "";
			const selfClosing = /\/\s*$/.test(raw);
			tokens.push({
				kind: selfClosing ? "empty" : "open",
				tag,
				attrs: parseAttrs(raw.replace(/\/\s*$/, "")),
			});
		} else if (match[4] && match[4].trim()) {
			tokens.push({ kind: "text", text: match[4].replace(/\s+/g, " ").trim() });
		}
	}

	const root = { tag: "#fragment", attrs: {}, children: [] };
	const stack = [root];
	for (const token of tokens) {
		const parent = stack[stack.length - 1];
		if (token.kind === "open") {
			const node = { tag: token.tag, attrs: token.attrs, children: [] };
			parent.children.push(node);
			stack.push(node);
		} else if (token.kind === "empty") {
			parent.children.push({ tag: token.tag, attrs: token.attrs, children: [] });
		} else if (token.kind === "close") {
			if (stack.length === 1) continue;
			stack.pop();
		} else if (token.kind === "text") {
			parent.children.push({ tag: "#text", attrs: {}, children: [], text: token.text });
		}
	}
	return root;
}

function textContent(node) {
	if (!node) return "";
	if (node.tag === "#text") return node.text || "";
	return (node.children || []).map(textContent).join("");
}

function findChild(node, tag) {
	return (node.children || []).find((child) => child.tag === tag) || null;
}

function isFlexRoot(tag) {
	return (
		tag === "stack" ||
		tag === "card" ||
		tag === "badge" ||
		tag === "stamp" ||
		tag === "callout" ||
		tag === "analyst"
	);
}

function toAutoLayout(node, { defaultGapStep = "4" } = {}) {
	if (!node || node.tag === "#text") return null;
	if (node.tag === "#fragment") {
		const elements = (node.children || []).filter((child) => child.tag !== "#text");
		if (elements.length === 1) return toAutoLayout(elements[0], { defaultGapStep });
		return {
			type: "autoLayout",
			tag: "fragment",
			direction: "VERTICAL",
			gapStep: defaultGapStep,
			columns: null,
			wrap: false,
			width: "hug",
			height: "hug",
			children: elements
				.map((child) => toAutoLayout(child, { defaultGapStep }))
				.filter(Boolean),
		};
	}

	if (isFlexRoot(node.tag)) {
		const row =
			node.attrs.direction === "row" ||
			node.tag === "badge" ||
			node.tag === "stamp";
		const direction = row ? "HORIZONTAL" : "VERTICAL";
		return {
			type: "autoLayout",
			tag: node.tag,
			direction,
			gapStep:
				typeof node.attrs.gap === "string" ? node.attrs.gap : defaultGapStep,
			columns: node.attrs.columns ? String(node.attrs.columns) : null,
			wrap: node.attrs.wrap === "true" || node.attrs.wrap === true,
			width: node.attrs.width || "hug",
			height: node.attrs.height || "hug",
			attrs: node.attrs,
			children: (node.children || [])
				.filter((child) => child.tag !== "#text")
				.map((child) => toAutoLayout(child, { defaultGapStep }))
				.filter(Boolean),
		};
	}

	return {
		type: "text",
		tag: node.tag,
		attrs: node.attrs,
		characters: textContent(node),
	};
}

module.exports = {
	parseFragment,
	parseAttrs,
	textContent,
	findChild,
	toAutoLayout,
};

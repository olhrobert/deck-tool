const WEIGHT_STYLES = {
	100: ["Thin"],
	200: ["ExtraLight", "Extra Light", "UltraLight"],
	300: ["Light"],
	400: ["Regular"],
	500: ["Medium"],
	600: ["SemiBold", "Semi Bold", "DemiBold"],
	700: ["Bold"],
	800: ["ExtraBold", "Extra Bold"],
	900: ["Black"],
};

function fallbackPaint(binding) {
	if (binding && binding.color) {
		return {
			type: "SOLID",
			color: {
				r: binding.color.r,
				g: binding.color.g,
				b: binding.color.b,
			},
			opacity: binding.opacity == null ? 1 : binding.opacity,
		};
	}
	return {
		type: "SOLID",
		color: { r: 0, g: 0, b: 0 },
		opacity: binding && binding.opacity != null ? binding.opacity : 1,
	};
}

async function loadFamilyStyles(family, weights) {
	const available = await figma.listAvailableFontsAsync();
	const familyFonts = available.filter((font) => font.fontName.family === family);
	if (familyFonts.length === 0) {
		throw new Error(
			`Font "${family}" is not available in Figma. Install it, then re-run.`,
		);
	}
	const loaded = [];
	const missing = [];
	for (const weight of weights) {
		const candidates = WEIGHT_STYLES[weight] || ["Regular"];
		const hit = familyFonts.find((font) =>
			candidates.includes(font.fontName.style),
		);
		if (!hit) {
			missing.push(`${weight} (${candidates[0]})`);
			continue;
		}
		await figma.loadFontAsync(hit.fontName);
		loaded.push(hit.fontName);
	}
	if (missing.length > 0) {
		throw new Error(
			`Font "${family}" is missing styles: ${missing.join(", ")}.`,
		);
	}
	return loaded;
}

function styleForWeight(familyFonts, weight) {
	const candidates = WEIGHT_STYLES[weight] || ["Regular"];
	const hit = familyFonts.find((font) => candidates.includes(font.fontName.style));
	return hit ? hit.fontName : familyFonts[0].fontName;
}

function resolvedModeValue(variable, byId) {
	const modeId = Object.keys(variable.valuesByMode)[0];
	let current = variable.valuesByMode[modeId];
	const seen = new Set();
	while (current && current.type === "VARIABLE_ALIAS") {
		if (seen.has(current.id)) break;
		seen.add(current.id);
		const next = byId.get(current.id);
		if (!next) break;
		current = next.valuesByMode[Object.keys(next.valuesByMode)[0]];
	}
	return current;
}

function variableByName(byName, name) {
	const variable = byName.get(name);
	if (!variable) {
		throw new Error(`Variable "${name}" is missing. Sync variables first.`);
	}
	return variable;
}

function assignVariableValue(variable, modeId, entry, byName) {
	if (entry && entry.alias) {
		const target = byName.get(entry.alias);
		if (!target) {
			throw new Error(`Alias target missing: ${variable.name} → ${entry.alias}`);
		}
		variable.setValueForMode(modeId, {
			type: "VARIABLE_ALIAS",
			id: target.id,
		});
		return;
	}
	variable.setValueForMode(modeId, entry && entry.value != null ? entry.value : entry);
}

function ensureModes(collection, modeNames) {
	collection.renameMode(collection.modes[0].modeId, modeNames[0]);
	for (let index = 1; index < modeNames.length; index += 1) {
		const modeName = modeNames[index];
		if (!collection.modes.find((mode) => mode.name === modeName)) {
			collection.addMode(modeName);
		}
	}
	const modeIds = {};
	for (const mode of collection.modes) {
		modeIds[mode.name] = mode.modeId;
	}
	return modeIds;
}

async function loadFontsFromSpecs(specs, byName) {
	const families = new Set();
	const weights = new Set();
	for (const spec of specs) {
		if (spec.resolvedType === "STRING" && spec.scopes && spec.scopes.includes("FONT_FAMILY") && spec.value) {
			families.add(spec.value);
		}
		if (spec.resolvedType === "FLOAT" && spec.scopes && spec.scopes.includes("FONT_WEIGHT") && typeof spec.value === "number") {
			weights.add(spec.value);
		}
	}
	if (families.size === 0) {
		for (const variable of byName.values()) {
			if (!variable.scopes || !variable.scopes.includes("FONT_FAMILY")) continue;
			const value = resolvedModeValue(
				variable,
				new Map([...byName.values()].map((item) => [item.id, item])),
			);
			if (typeof value === "string") families.add(value);
		}
	}
	const weightList = weights.size ? [...weights] : [400, 500, 600];
	for (const family of families) {
		await loadFamilyStyles(family, weightList);
	}
}

async function syncCollection(spec, byName) {
	if (!spec || !spec.name || !Array.isArray(spec.variables)) {
		throw new Error("variables.json is missing a collection. Run figma:sync-variables.");
	}

	const collections = await figma.variables.getLocalVariableCollectionsAsync();
	let collection = collections.find((item) => item.name === spec.name);
	if (!collection) {
		collection = figma.variables.createVariableCollection(spec.name);
	}
	const modeIds = ensureModes(collection, spec.modes || ["Value"]);
	const defaultModeId = modeIds[spec.modes[0]];

	const locals = await figma.variables.getLocalVariablesAsync();
	for (const variable of locals) {
		if (
			variable.variableCollectionId === collection.id ||
			!byName.has(variable.name)
		) {
			byName.set(variable.name, variable);
		}
	}

	for (const item of spec.variables) {
		if (byName.has(item.name)) continue;
		for (const [existingName, variable] of [...byName]) {
			if (
				variable.variableCollectionId === collection.id &&
				existingName !== item.name &&
				existingName.replace(/\//g, "-") === item.name
			) {
				variable.name = item.name;
				byName.delete(existingName);
				byName.set(item.name, variable);
				break;
			}
		}
	}

	const created = [];
	const updated = [];
	for (const item of spec.variables) {
		let variable = byName.get(item.name);
		if (variable && variable.variableCollectionId !== collection.id) {
			variable = null;
		}
		if (variable && variable.resolvedType !== item.resolvedType) {
			variable.remove();
			byName.delete(item.name);
			variable = null;
		}
		if (!variable) {
			variable = figma.variables.createVariable(
				item.name,
				collection,
				item.resolvedType,
			);
			byName.set(item.name, variable);
			created.push(item.name);
		} else {
			updated.push(item.name);
		}
		variable.scopes = item.scopes;
		if (item.codeSyntax && item.codeSyntax.WEB) {
			variable.setVariableCodeSyntax("WEB", item.codeSyntax.WEB);
		}
	}

	await loadFontsFromSpecs(spec.variables, byName);

	for (const item of spec.variables) {
		const variable = byName.get(item.name);
		if (item.values) {
			for (const [modeName, entry] of Object.entries(item.values)) {
				const modeId = modeIds[modeName];
				if (!modeId) {
					throw new Error(`${spec.name} is missing mode ${modeName}`);
				}
				assignVariableValue(variable, modeId, entry, byName);
			}
		} else {
			assignVariableValue(
				variable,
				defaultModeId,
				{ alias: item.alias, value: item.value },
				byName,
			);
		}
	}

	return {
		collectionId: collection.id,
		modeIds,
		created: created.length,
		updated: updated.length,
		count: spec.variables.length,
	};
}

async function syncAllVariables(payload) {
	if (!payload || !Array.isArray(payload.collections)) {
		throw new Error("variables.json is missing. Run figma:sync-variables.");
	}
	const locals = await figma.variables.getLocalVariablesAsync();
	const byName = new Map();
	for (const variable of locals) {
		byName.set(variable.name, variable);
	}
	const results = [];
	for (const collection of payload.collections) {
		results.push({
			name: collection.name,
			...(await syncCollection(collection, byName)),
		});
	}
	const ids = {};
	for (const [name, variable] of byName) {
		ids[name] = variable.id;
	}
	return { collections: results, variableIds: ids };
}

function bindPaint(binding, byName) {
	const paint = fallbackPaint({
		...binding,
		opacity: 1,
	});
	if (!binding || !binding.variable) {
		paint.opacity = binding && binding.opacity != null ? binding.opacity : 1;
		return paint;
	}
	const bound = figma.variables.setBoundVariableForPaint(
		paint,
		"color",
		variableByName(byName, binding.variable),
	);
	return Object.assign({}, bound, {
		opacity: binding.opacity == null ? 1 : binding.opacity,
	});
}

function bindField(node, field, variableName, byName) {
	if (!variableName) return;
	node.setBoundVariable(field, variableByName(byName, variableName));
}

function percentFromVariable(byName, byId, name, fallback) {
	if (!name) return fallback;
	const value = resolvedModeValue(variableByName(byName, name), byId);
	return typeof value === "number" ? value : fallback;
}

function clearExistingNamed(page, name) {
	const removed = [];
	for (const node of [...page.children]) {
		if (
			(node.type === "COMPONENT_SET" || node.type === "COMPONENT") &&
			node.name === name
		) {
			removed.push(node.id);
			node.remove();
		}
	}
	return removed;
}

function clearExistingCard(page) {
	return clearExistingNamed(page, "Card");
}

function createAutoFrame(direction) {
	const frame = figma.createFrame();
	frame.layoutMode = direction;
	frame.fills = [];
	frame.strokes = [];
	frame.clipsContent = false;
	return frame;
}

const ICON_GLYPH_TYPES = new Set([
	"VECTOR",
	"BOOLEAN_OPERATION",
	"ELLIPSE",
	"POLYGON",
	"STAR",
	"LINE",
]);

function clearIconWrapperFills(node) {
	if (node.type === "FRAME" || node.type === "GROUP") {
		try {
			node.fills = [];
		} catch (error) {
			// Some SVG wrappers reject fills.
		}
	}
	if ("children" in node) {
		for (const child of node.children) {
			clearIconWrapperFills(child);
		}
	}
}

function bindFillsDeep(node, binding, byName) {
	if (ICON_GLYPH_TYPES.has(node.type) && "fills" in node && node.fills !== figma.mixed) {
		try {
			node.fills = [bindPaint(binding, byName)];
		} catch (error) {
			// Some SVG nodes reject fills.
		}
	}
	if ("children" in node) {
		for (const child of node.children) {
			bindFillsDeep(child, binding, byName);
		}
	}
}

function createIconNode(svg, name, sizePx) {
	const node = figma.createNodeFromSvg(svg);
	node.name = name;
	clearIconWrapperFills(node);
	node.resize(sizePx, sizePx);
	node.layoutSizingHorizontal = "FIXED";
	node.layoutSizingVertical = "FIXED";
	return node;
}

function layoutVariantSet(componentSet, variantOrder, origin, sizeOrder) {
	componentSet.x = origin.x;
	componentSet.y = origin.y;
	const colGap = 40;
	let cellWidth = 0;
	let cellHeight = 0;
	for (const child of componentSet.children) {
		cellWidth = Math.max(cellWidth, child.width);
		cellHeight = Math.max(cellHeight, child.height);
	}
	const rowGap = 40;
	for (const child of componentSet.children) {
		const props = Object.fromEntries(
			child.name.split(", ").map((part) => part.split("=")),
		);
		const col = Math.max(0, variantOrder.indexOf(props.Variant));
		const row = sizeOrder ? Math.max(0, sizeOrder.indexOf(props.Size)) : 0;
		child.x = col * (cellWidth + colGap);
		child.y = row * (cellHeight + rowGap);
	}
	let maxX = 0;
	let maxY = 0;
	for (const child of componentSet.children) {
		maxX = Math.max(maxX, child.x + child.width);
		maxY = Math.max(maxY, child.y + child.height);
	}
	componentSet.resizeWithoutConstraints(maxX + 40, maxY + 40);
}

const VARIANT_GROUP_PAD = 40;
const PAGE_COLUMN_GAP = 200;
const COMPONENT_PAGE_ORDER = [
	"Card",
	"Badge",
	"Stamp",
	"Callout",
	"Analyst",
	"Divider",
	"Media-slot",
	"Cover-title",
	"Slide-pretitle",
	"Slide-title",
	"Brand-logo",
	"Slide-footer",
	"Attribution-box",
	"Header-container",
	"Content-container",
	"Footer-container",
	"Slide",
	"Media-card",
];

function styleVariantGroup(componentSet, byName) {
	componentSet.layoutMode = "HORIZONTAL";
	componentSet.primaryAxisAlignItems = "MIN";
	componentSet.counterAxisAlignItems =
		componentSet.name === "Divider" ? "CENTER" : "MIN";
	componentSet.paddingTop = VARIANT_GROUP_PAD;
	componentSet.paddingRight = VARIANT_GROUP_PAD;
	componentSet.paddingBottom = VARIANT_GROUP_PAD;
	componentSet.paddingLeft = VARIANT_GROUP_PAD;
	componentSet.itemSpacing = VARIANT_GROUP_PAD;
	componentSet.fills = [
		bindPaint({ variable: "color-slide-background", opacity: 1 }, byName),
	];
	componentSet.strokes = [];
	componentSet.clipsContent = false;
	if (componentSet.name === "Slide-title" || componentSet.name === "Cover-title") {
		componentSet.layoutWrap = "WRAP";
		componentSet.counterAxisSpacing = VARIANT_GROUP_PAD;
		componentSet.layoutSizingHorizontal = "FIXED";
		componentSet.resize(2080, componentSet.height);
	} else {
		componentSet.layoutWrap = "NO_WRAP";
		componentSet.layoutSizingHorizontal = "HUG";
	}
	componentSet.layoutSizingVertical = "HUG";
}

function layoutComponentsColumn(page) {
	const children = [...page.children].sort((a, b) => {
		const ai = COMPONENT_PAGE_ORDER.indexOf(a.name);
		const bi = COMPONENT_PAGE_ORDER.indexOf(b.name);
		if (ai === -1 && bi === -1) return a.y - b.y;
		if (ai === -1) return 1;
		if (bi === -1) return -1;
		return ai - bi;
	});
	let y = 0;
	for (const child of children) {
		child.x = 0;
		child.y = y;
		y += child.height + PAGE_COLUMN_GAP;
	}
}

function scaledPx(byName, byId, sizeName, scaleName) {
	const size = resolvedModeValue(variableByName(byName, sizeName), byId);
	const scale = resolvedModeValue(variableByName(byName, scaleName), byId);
	return Number(size) * Number(scale);
}

function nextPagePosition(page) {
	let maxX = 0;
	for (const child of page.children) {
		maxX = Math.max(maxX, child.x + child.width);
	}
	return { x: maxX === 0 ? 80 : maxX + 80, y: 80 };
}

function localById(byName) {
	return new Map([...byName.values()].map((item) => [item.id, item]));
}

async function createCardVariant(spec, payload, byName, familyFonts) {
	const layout = payload.layout;
	const byId = localById(byName);
	const comp = figma.createComponent();
	comp.name = spec.name;
	comp.layoutMode = "VERTICAL";
	comp.primaryAxisAlignItems = "MIN";
	comp.counterAxisAlignItems = "MIN";
	comp.primaryAxisSizingMode = "AUTO";
	comp.counterAxisSizingMode = "FIXED";
	comp.resize(layout.width, 80);
	comp.layoutSizingHorizontal = "FIXED";
	comp.layoutSizingVertical = "HUG";
	comp.fills = [bindPaint(spec.fill, byName)];
	comp.strokes = [bindPaint(spec.stroke, byName)];
	comp.strokeAlign = "INSIDE";

	bindField(comp, "paddingTop", layout.padding, byName);
	bindField(comp, "paddingRight", layout.padding, byName);
	bindField(comp, "paddingBottom", layout.padding, byName);
	bindField(comp, "paddingLeft", layout.padding, byName);
	bindField(comp, "itemSpacing", layout.gap, byName);
	bindField(comp, "topLeftRadius", layout.radius, byName);
	bindField(comp, "topRightRadius", layout.radius, byName);
	bindField(comp, "bottomLeftRadius", layout.radius, byName);
	bindField(comp, "bottomRightRadius", layout.radius, byName);
	bindField(comp, "strokeTopWeight", layout.strokeTop, byName);
	bindField(comp, "strokeBottomWeight", layout.strokeBottom, byName);
	bindField(comp, "strokeLeftWeight", layout.strokeLeft, byName);
	bindField(comp, "strokeRightWeight", layout.strokeRight, byName);

	const slotNodes = {};
	for (const slot of layout.slots) {
		const text = figma.createText();
		const familyVar = variableByName(byName, slot.fontFamily);
		const weightVar = variableByName(byName, slot.fontWeight);
		const weight = resolvedModeValue(weightVar, byId);
		text.fontName = styleForWeight(familyFonts, weight);
		text.characters = slot.characters;
		text.lineHeight = {
			unit: "PERCENT",
			value: percentFromVariable(byName, byId, slot.lineHeight, 120),
		};
		text.letterSpacing = {
			unit: "PERCENT",
			value: percentFromVariable(byName, byId, slot.letterSpacing, 0),
		};
		text.textCase = slot.textCase || "ORIGINAL";
		text.fills = [bindPaint(spec.foreground, byName)];
		bindField(text, "fontFamily", slot.fontFamily, byName);
		bindField(text, "fontWeight", slot.fontWeight, byName);
		bindField(text, "fontSize", slot.fontSize, byName);
		bindField(text, "opacity", slot.opacity, byName);
		text.name = slot.name;

		if (slot.id === "meta") {
			const wrap = figma.createAutoLayout("VERTICAL");
			wrap.name = "meta-wrap";
			wrap.itemSpacing = 0;
			wrap.fills = [];
			comp.appendChild(wrap);
			wrap.layoutSizingHorizontal = "FILL";
			wrap.layoutSizingVertical = "HUG";
			bindField(wrap, "paddingTop", layout.metaPaddingTop, byName);
			wrap.appendChild(text);
			text.layoutSizingHorizontal = "FILL";
			text.textAutoResize = "HEIGHT";
			slotNodes[slot.id] = { text, wrap };
		} else {
			comp.appendChild(text);
			text.layoutSizingHorizontal = "FILL";
			text.textAutoResize = "HEIGHT";
			slotNodes[slot.id] = { text };
		}
	}

	return { comp, slotNodes };
}

function linkCardProperties(comp, slotNodes, payload, keys) {
	for (const slot of payload.layout.slots) {
		const nodes = slotNodes[slot.id];
		if (!nodes) continue;
		if (slot.textProperty) {
			nodes.text.componentPropertyReferences = {
				...(nodes.text.componentPropertyReferences || {}),
				characters: keys[slot.textProperty],
			};
		}
		if (slot.booleanProperty) {
			const target = nodes.wrap || nodes.text;
			target.componentPropertyReferences = {
				...(target.componentPropertyReferences || {}),
				visible: keys[slot.booleanProperty],
			};
		}
	}
}

async function buildCard(payload, variableIds) {
	if (!payload || !payload.layout || !Array.isArray(payload.variants)) {
		throw new Error("components/card.json is missing. Run figma:build-component -- card.");
	}

	const locals = await figma.variables.getLocalVariablesAsync();
	const byName = new Map();
	for (const variable of locals) {
		byName.set(variable.name, variable);
	}
	if (variableIds) {
		for (const [name, id] of Object.entries(variableIds)) {
			const variable = locals.find((item) => item.id === id);
			if (variable) byName.set(name, variable);
		}
	}

	const byId = localById(byName);
	const headingFamily = variableByName(byName, "font-family-base");
	const family = resolvedModeValue(headingFamily, byId);
	const weights = payload.layout.slots.map((slot) => {
		const weightVar = variableByName(byName, slot.fontWeight);
		return resolvedModeValue(weightVar, byId);
	});
	await loadFamilyStyles(family, [...new Set(weights.concat([400, 500, 600]))]);
	const available = await figma.listAvailableFontsAsync();
	const familyFonts = available.filter((font) => font.fontName.family === family);

	const page = figma.currentPage;
	page.name = "Components";
	const removed = clearExistingCard(page);

	const first = payload.variants[0];
	const base = await createCardVariant(first, payload, byName, familyFonts);
	const keys = {};
	for (const slot of payload.layout.slots) {
		if (slot.textProperty && !keys[slot.textProperty]) {
			keys[slot.textProperty] = base.comp.addComponentProperty(
				slot.textProperty,
				"TEXT",
				slot.characters,
			);
		}
		if (slot.booleanProperty && !keys[slot.booleanProperty]) {
			keys[slot.booleanProperty] = base.comp.addComponentProperty(
				slot.booleanProperty,
				"BOOLEAN",
				slot.booleanDefault !== false,
			);
		}
	}
	linkCardProperties(base.comp, base.slotNodes, payload, keys);

	const components = [base.comp];
	for (let index = 1; index < payload.variants.length; index += 1) {
		const spec = payload.variants[index];
		const clone = base.comp.clone();
		clone.name = spec.name;
		clone.fills = [bindPaint(spec.fill, byName)];
		clone.strokes = [bindPaint(spec.stroke, byName)];
		const texts = clone.findAll((node) => node.type === "TEXT");
		for (const text of texts) {
			text.fills = [bindPaint(spec.foreground, byName)];
		}
		components.push(clone);
	}

	const componentSet = figma.combineAsVariants(components, page);
	componentSet.name = payload.name;
	styleVariantGroup(componentSet, byName);
	layoutComponentsColumn(page);

	return {
		componentSetId: componentSet.id,
		variantCount: components.length,
		removedIds: removed,
		createdNodeIds: [componentSet.id, ...components.map((item) => item.id)],
	};
}

async function localsByName(variableIds) {
	const locals = await figma.variables.getLocalVariablesAsync();
	const byName = new Map();
	for (const variable of locals) {
		byName.set(variable.name, variable);
	}
	if (variableIds) {
		for (const [name, id] of Object.entries(variableIds)) {
			const variable = locals.find((item) => item.id === id);
			if (variable) byName.set(name, variable);
		}
	}
	return byName;
}

function applyTextSlot(text, slot, spec, byName, byId, familyFonts) {
	const weightVar = variableByName(byName, slot.fontWeight);
	const weight = resolvedModeValue(weightVar, byId);
	text.fontName = styleForWeight(familyFonts, weight);
	text.characters = slot.characters;
	text.lineHeight = {
		unit: "PERCENT",
		value:
			slot.lineHeightPercent != null
				? slot.lineHeightPercent
				: percentFromVariable(byName, byId, slot.lineHeight, 120),
	};
	text.letterSpacing = {
		unit: "PERCENT",
		value: percentFromVariable(byName, byId, slot.letterSpacing, 0),
	};
	text.textCase = slot.textCase || "ORIGINAL";
	text.textAlignHorizontal = slot.align || "LEFT";
	text.fills = [bindPaint(slot.fill || spec.foreground, byName)];
	bindField(text, "fontFamily", slot.fontFamily, byName);
	bindField(text, "fontWeight", slot.fontWeight, byName);
	if (slot.fontSize) bindField(text, "fontSize", slot.fontSize, byName);
	bindField(text, "opacity", slot.opacity, byName);
	text.name = slot.name;
	if (slot.nowrap) {
		text.textAutoResize = "WIDTH_AND_HEIGHT";
	} else {
		text.textAutoResize = "HEIGHT";
	}
}

async function loadSlotFonts(payload, byName) {
	const byId = localById(byName);
	const slots = payload.layout.slots.filter((slot) => slot.kind !== "icon");
	const families = new Set();
	const weights = [];
	for (const slot of slots) {
		const familyVar = variableByName(byName, slot.fontFamily);
		families.add(resolvedModeValue(familyVar, byId));
		const weightVar = variableByName(byName, slot.fontWeight);
		weights.push(resolvedModeValue(weightVar, byId));
	}
	const weightList = [...new Set(weights.concat([400, 500, 600]))];
	for (const family of families) {
		await loadFamilyStyles(family, weightList);
	}
	const available = await figma.listAvailableFontsAsync();
	const family = [...families][0];
	return available.filter((font) => font.fontName.family === family);
}

function finishVariantSet(page, payload, components, removed, byName) {
	const componentSet = figma.combineAsVariants(components, page);
	componentSet.name = payload.name;
	if (byName) styleVariantGroup(componentSet, byName);
	layoutComponentsColumn(page);
	return {
		componentSetId: componentSet.id,
		variantCount: components.length,
		removedIds: removed,
		createdNodeIds: [componentSet.id, ...components.map((item) => item.id)],
	};
}

async function createBadgeVariant(spec, payload, byName, familyFonts) {
	const layout = payload.layout;
	const byId = localById(byName);
	const iconSize = resolvedModeValue(variableByName(byName, layout.iconSize), byId);
	const comp = figma.createComponent();
	comp.name = spec.name;
	comp.layoutMode = "HORIZONTAL";
	comp.primaryAxisAlignItems = layout.primaryAxisAlign || "CENTER";
	comp.counterAxisAlignItems = layout.counterAxisAlign || "CENTER";
	comp.layoutSizingHorizontal = "HUG";
	comp.layoutSizingVertical = "HUG";
	comp.fills = [bindPaint(spec.fill, byName)];
	comp.strokes = spec.stroke ? [bindPaint(spec.stroke, byName)] : [];
	comp.strokeAlign = "INSIDE";
	bindField(comp, "paddingTop", layout.paddingTop, byName);
	bindField(comp, "paddingBottom", layout.paddingBottom, byName);
	bindField(comp, "paddingLeft", layout.paddingLeft, byName);
	bindField(comp, "paddingRight", layout.paddingRight, byName);
	bindField(comp, "itemSpacing", layout.gap, byName);
	bindField(comp, "topLeftRadius", layout.radius, byName);
	bindField(comp, "topRightRadius", layout.radius, byName);
	bindField(comp, "bottomLeftRadius", layout.radius, byName);
	bindField(comp, "bottomRightRadius", layout.radius, byName);
	bindField(comp, "strokeTopWeight", layout.strokeWeight, byName);
	bindField(comp, "strokeBottomWeight", layout.strokeWeight, byName);
	bindField(comp, "strokeLeftWeight", layout.strokeWeight, byName);
	bindField(comp, "strokeRightWeight", layout.strokeWeight, byName);

	const slotNodes = {};
	for (const slot of layout.slots) {
		if (slot.kind === "icon") {
			const wrap = createAutoFrame("HORIZONTAL");
			wrap.name = slot.name;
			wrap.primaryAxisAlignItems = "CENTER";
			wrap.counterAxisAlignItems = "CENTER";
			const svg = payload.icons[slot.icon];
			const icon = createIconNode(svg, slot.icon, iconSize);
			bindFillsDeep(icon, spec.foreground, byName);
			wrap.appendChild(icon);
			bindField(icon, "width", layout.iconSize, byName);
			bindField(icon, "height", layout.iconSize, byName);
			comp.appendChild(wrap);
			wrap.layoutSizingHorizontal = "HUG";
			wrap.layoutSizingVertical = "HUG";
			slotNodes[slot.id] = { node: wrap };
			continue;
		}
		const text = figma.createText();
		applyTextSlot(text, slot, spec, byName, byId, familyFonts);
		const wrap = createAutoFrame("HORIZONTAL");
		wrap.name = `${slot.name}-wrap`;
		wrap.primaryAxisAlignItems = "CENTER";
		wrap.counterAxisAlignItems = "CENTER";
		bindField(wrap, "paddingLeft", layout.labelPad, byName);
		bindField(wrap, "paddingRight", layout.labelPad, byName);
		wrap.appendChild(text);
		comp.appendChild(wrap);
		wrap.layoutSizingHorizontal = "HUG";
		wrap.layoutSizingVertical = "HUG";
		text.layoutSizingHorizontal = "HUG";
		slotNodes[slot.id] = { text, wrap };
	}
	return { comp, slotNodes };
}

function linkSimpleProperties(comp, slotNodes, payload, keys) {
	for (const slot of payload.layout.slots) {
		const nodes = slotNodes[slot.id];
		if (!nodes) continue;
		if (slot.textProperty && nodes.text) {
			nodes.text.componentPropertyReferences = {
				...(nodes.text.componentPropertyReferences || {}),
				characters: keys[slot.textProperty],
			};
		}
		if (slot.booleanProperty) {
			const target = nodes.node || nodes.wrap || nodes.text;
			target.componentPropertyReferences = {
				...(target.componentPropertyReferences || {}),
				visible: keys[slot.booleanProperty],
			};
		}
	}
}

function addSlotProperties(comp, payload, keys) {
	for (const slot of payload.layout.slots) {
		if (slot.textProperty && !keys[slot.textProperty]) {
			keys[slot.textProperty] = comp.addComponentProperty(
				slot.textProperty,
				"TEXT",
				slot.characters,
			);
		}
		if (slot.booleanProperty && !keys[slot.booleanProperty]) {
			keys[slot.booleanProperty] = comp.addComponentProperty(
				slot.booleanProperty,
				"BOOLEAN",
				slot.booleanDefault !== false,
			);
		}
	}
}

async function buildBadge(payload, variableIds) {
	if (!payload || !payload.layout || !Array.isArray(payload.variants)) {
		throw new Error("components/badge.json is missing. Run figma:build-component -- badge.");
	}
	const byName = await localsByName(variableIds);
	const familyFonts = await loadSlotFonts(payload, byName);
	const page = figma.currentPage;
	page.name = "Components";
	const removed = clearExistingNamed(page, payload.name);
	const first = payload.variants[0];
	const base = await createBadgeVariant(first, payload, byName, familyFonts);
	const keys = {};
	addSlotProperties(base.comp, payload, keys);
	linkSimpleProperties(base.comp, base.slotNodes, payload, keys);

	const components = [base.comp];
	for (let index = 1; index < payload.variants.length; index += 1) {
		const spec = payload.variants[index];
		const clone = base.comp.clone();
		clone.name = spec.name;
		clone.fills = [bindPaint(spec.fill, byName)];
		clone.strokes = spec.stroke ? [bindPaint(spec.stroke, byName)] : [];
		const texts = clone.findAll((node) => node.type === "TEXT");
		for (const text of texts) {
			text.fills = [bindPaint(spec.foreground, byName)];
		}
		for (const node of clone.findAll((item) => item.type === "VECTOR" || item.type === "BOOLEAN_OPERATION")) {
			bindFillsDeep(node, spec.foreground, byName);
		}
		components.push(clone);
	}
	return finishVariantSet(page, payload, components, removed, byName);
}

async function createStampVariant(spec, payload, byName, familyFonts) {
	const layout = payload.layout;
	const byId = localById(byName);
	const sizePx = resolvedModeValue(variableByName(byName, layout.size), byId);
	const textPx = scaledPx(byName, byId, layout.size, layout.textScale);
	const iconPx = scaledPx(byName, byId, layout.size, layout.iconScale);
	const comp = figma.createComponent();
	comp.name = spec.name;
	comp.layoutMode = "HORIZONTAL";
	comp.primaryAxisAlignItems = "CENTER";
	comp.counterAxisAlignItems = "CENTER";
	comp.layoutSizingHorizontal = "FIXED";
	comp.layoutSizingVertical = "FIXED";
	comp.resize(sizePx, sizePx);
	comp.fills = [bindPaint(spec.fill, byName)];
	comp.strokes = [];
	bindField(comp, "width", layout.size, byName);
	bindField(comp, "height", layout.size, byName);
	bindField(comp, "topLeftRadius", layout.radius, byName);
	bindField(comp, "topRightRadius", layout.radius, byName);
	bindField(comp, "bottomLeftRadius", layout.radius, byName);
	bindField(comp, "bottomRightRadius", layout.radius, byName);

	const slotNodes = {};
	for (const slot of layout.slots) {
		if (slot.kind === "icon") {
			const svg = payload.icons[slot.icon];
			const icon = createIconNode(svg, slot.name, iconPx);
			icon.visible = slot.booleanDefault === true;
			bindFillsDeep(icon, spec.foreground, byName);
			comp.appendChild(icon);
			slotNodes[slot.id] = { node: icon };
			continue;
		}
		const text = figma.createText();
		applyTextSlot(text, slot, spec, byName, byId, familyFonts);
		text.fontSize = textPx;
		text.visible = slot.booleanDefault !== false;
		comp.appendChild(text);
		text.layoutSizingHorizontal = "HUG";
		text.layoutSizingVertical = "HUG";
		slotNodes[slot.id] = { text };
	}
	return { comp, slotNodes };
}

async function buildStamp(payload, variableIds) {
	if (!payload || !payload.layout || !Array.isArray(payload.variants)) {
		throw new Error("components/stamp.json is missing. Run figma:build-component -- stamp.");
	}
	const byName = await localsByName(variableIds);
	const familyFonts = await loadSlotFonts(payload, byName);
	const page = figma.currentPage;
	page.name = "Components";
	const removed = clearExistingNamed(page, payload.name);
	const first = payload.variants[0];
	const base = await createStampVariant(first, payload, byName, familyFonts);
	const keys = {};
	addSlotProperties(base.comp, payload, keys);
	linkSimpleProperties(base.comp, base.slotNodes, payload, keys);

	const components = [base.comp];
	for (let index = 1; index < payload.variants.length; index += 1) {
		const spec = payload.variants[index];
		const clone = base.comp.clone();
		clone.name = spec.name;
		clone.fills = [bindPaint(spec.fill, byName)];
		const texts = clone.findAll((node) => node.type === "TEXT");
		for (const text of texts) {
			text.fills = [bindPaint(spec.foreground, byName)];
		}
		for (const node of clone.findAll((item) => item.type === "VECTOR" || item.type === "BOOLEAN_OPERATION")) {
			bindFillsDeep(node, spec.foreground, byName);
		}
		components.push(clone);
	}
	return finishVariantSet(page, payload, components, removed, byName);
}

async function createCalloutVariant(spec, payload, byName, familyFonts) {
	const layout = payload.layout;
	const byId = localById(byName);
	const comp = figma.createComponent();
	comp.name = spec.name;
	comp.layoutMode = "VERTICAL";
	comp.primaryAxisAlignItems = "MIN";
	comp.counterAxisAlignItems = "MIN";
	comp.resize(layout.width, 80);
	comp.layoutSizingHorizontal = "FIXED";
	comp.layoutSizingVertical = "HUG";
	comp.fills = [bindPaint(spec.fill, byName)];
	comp.strokes = spec.stroke ? [bindPaint(spec.stroke, byName)] : [];
	comp.strokeAlign = "INSIDE";
	bindField(comp, "paddingTop", layout.padding, byName);
	bindField(comp, "paddingRight", layout.padding, byName);
	bindField(comp, "paddingBottom", layout.padding, byName);
	bindField(comp, "paddingLeft", layout.padding, byName);
	bindField(comp, "itemSpacing", layout.gap, byName);
	bindField(comp, "topLeftRadius", layout.radius, byName);
	bindField(comp, "topRightRadius", layout.radius, byName);
	bindField(comp, "bottomLeftRadius", layout.radius, byName);
	bindField(comp, "bottomRightRadius", layout.radius, byName);
	bindField(comp, "strokeTopWeight", layout.strokeTop, byName);
	bindField(comp, "strokeBottomWeight", layout.strokeBottom, byName);
	bindField(comp, "strokeLeftWeight", layout.strokeLeft, byName);
	bindField(comp, "strokeRightWeight", layout.strokeRight, byName);

	const slotNodes = {};
	for (const slot of layout.slots) {
		const text = figma.createText();
		applyTextSlot(text, slot, spec, byName, byId, familyFonts);
		comp.appendChild(text);
		text.layoutSizingHorizontal = "FILL";
		slotNodes[slot.id] = { text };
	}
	return { comp, slotNodes };
}

async function buildCallout(payload, variableIds) {
	if (!payload || !payload.layout || !Array.isArray(payload.variants)) {
		throw new Error("components/callout.json is missing. Run figma:build-component -- callout.");
	}
	const byName = await localsByName(variableIds);
	const familyFonts = await loadSlotFonts(payload, byName);
	const page = figma.currentPage;
	page.name = "Components";
	const removed = clearExistingNamed(page, payload.name);
	const first = payload.variants[0];
	const base = await createCalloutVariant(first, payload, byName, familyFonts);
	const keys = {};
	addSlotProperties(base.comp, payload, keys);
	linkSimpleProperties(base.comp, base.slotNodes, payload, keys);

	const components = [base.comp];
	for (let index = 1; index < payload.variants.length; index += 1) {
		const spec = payload.variants[index];
		const clone = base.comp.clone();
		clone.name = spec.name;
		clone.fills = [bindPaint(spec.fill, byName)];
		clone.strokes = spec.stroke ? [bindPaint(spec.stroke, byName)] : [];
		const texts = clone.findAll((node) => node.type === "TEXT");
		for (const text of texts) {
			text.fills = [bindPaint(spec.foreground, byName)];
		}
		components.push(clone);
	}
	return finishVariantSet(page, payload, components, removed, byName);
}

function findComponentSet(name) {
	for (const page of figma.root.children) {
		if (page.type !== "PAGE") continue;
		for (const node of page.children) {
			if (node.type === "COMPONENT_SET" && node.name === name) return node;
		}
	}
	throw new Error(`${name} component is missing. Build it first.`);
}

function propertyKeyMap(node) {
	const defs = node.componentPropertyDefinitions || {};
	const map = {};
	for (const key of Object.keys(defs)) {
		map[key.split("#")[0]] = key;
	}
	return map;
}

function setInstanceProps(instance, props) {
	const map = propertyKeyMap(instance);
	const payload = {};
	for (const [name, value] of Object.entries(props)) {
		const key = map[name];
		if (key) payload[key] = value;
	}
	if (Object.keys(payload).length > 0) instance.setProperties(payload);
}

function slotById(payload, id) {
	return payload.layout.slots.find((slot) => slot.id === id);
}

function createBadgeInstance(badgeSet, props) {
	const variantName = `Variant=${props.Variant || "neutral"}`;
	const source =
		badgeSet.children.find((child) => child.name === variantName) ||
		badgeSet.defaultVariant;
	const instance = source.createInstance();
	setInstanceProps(instance, props);
	return instance;
}

async function createAnalystVariant(size, payload, byName, familyFonts, badgeSet, mediaSet) {
	const layout = payload.layout;
	const paint = payload.paint;
	const byId = localById(byName);
	const overlay = resolvedModeValue(variableByName(byName, layout.overlay.left), byId);
	const iconSize = resolvedModeValue(variableByName(byName, layout.iconSize), byId);

	const comp = figma.createComponent();
	comp.name = `Size=${size.name}`;
	comp.layoutMode = "VERTICAL";
	comp.primaryAxisAlignItems = "MIN";
	comp.counterAxisAlignItems = "MIN";
	comp.resize(layout.width, 80);
	comp.layoutSizingHorizontal = "FIXED";
	comp.layoutSizingVertical = "HUG";
	comp.fills = [bindPaint(paint.fill, byName)];
	comp.strokes = [bindPaint(paint.stroke, byName)];
	comp.strokeAlign = "INSIDE";
	comp.clipsContent = true;
	bindField(comp, "topLeftRadius", layout.radius, byName);
	bindField(comp, "topRightRadius", layout.radius, byName);
	bindField(comp, "bottomLeftRadius", layout.radius, byName);
	bindField(comp, "bottomRightRadius", layout.radius, byName);
	bindField(comp, "strokeTopWeight", layout.strokeTop, byName);
	bindField(comp, "strokeBottomWeight", layout.strokeBottom, byName);
	bindField(comp, "strokeLeftWeight", layout.strokeLeft, byName);
	bindField(comp, "strokeRightWeight", layout.strokeRight, byName);

	const cover = createAutoFrame("VERTICAL");
	cover.name = "cover";
	cover.clipsContent = true;
	cover.resize(layout.width, layout.coverHeight);
	cover.layoutSizingHorizontal = "FILL";
	cover.layoutSizingVertical = "FIXED";
	comp.appendChild(cover);

	const flush =
		mediaSet.children.find((child) => child.name === "Type=flush") ||
		mediaSet.defaultVariant;
	const photo = flush.createInstance();
	photo.name = "image";
	cover.appendChild(photo);
	photo.layoutSizingHorizontal = "FILL";
	photo.layoutSizingVertical = "FILL";

	const specialization = createBadgeInstance(badgeSet, {
		Variant: "emphasis",
		Label: "Specialization",
		"Show leading": true,
		"Show trailing": false,
	});
	specialization.name = "specialization";
	cover.appendChild(specialization);
	specialization.layoutPositioning = "ABSOLUTE";
	specialization.constraints = { horizontal: "MIN", vertical: "MAX" };
	specialization.x = overlay;
	specialization.y = layout.coverHeight - specialization.height - overlay;

	const body = createAutoFrame("VERTICAL");
	body.name = "body";
	body.layoutSizingHorizontal = "FILL";
	body.layoutSizingVertical = "HUG";
	bindField(body, "paddingTop", size.padding, byName);
	bindField(body, "paddingRight", size.padding, byName);
	bindField(body, "paddingBottom", size.padding, byName);
	bindField(body, "paddingLeft", size.padding, byName);
	bindField(body, "itemSpacing", layout.bodyGap, byName);
	comp.appendChild(body);

	const identity = createAutoFrame("HORIZONTAL");
	identity.name = "identity";
	identity.counterAxisAlignItems = "CENTER";
	identity.layoutSizingHorizontal = "FILL";
	identity.layoutSizingVertical = "HUG";
	bindField(identity, "itemSpacing", layout.identityGap, byName);
	body.appendChild(identity);

	const names = createAutoFrame("VERTICAL");
	names.name = "names";
	names.layoutSizingHorizontal = "FILL";
	names.layoutSizingVertical = "HUG";
	identity.appendChild(names);
	const nameText = figma.createText();
	applyTextSlot(nameText, slotById(payload, "name"), paint, byName, byId, familyFonts);
	names.appendChild(nameText);
	nameText.layoutSizingHorizontal = "FILL";
	const roleText = figma.createText();
	applyTextSlot(roleText, slotById(payload, "role"), paint, byName, byId, familyFonts);
	names.appendChild(roleText);
	roleText.layoutSizingHorizontal = "FILL";

	const logoName = size.name === "sm" ? "Type=logo, Size=7" : "Type=logo, Size=10";
	const logoSource =
		mediaSet.children.find((child) => child.name === logoName) ||
		mediaSet.defaultVariant;
	const logo = logoSource.createInstance();
	logo.name = "logo";
	identity.appendChild(logo);

	const locationRow = createAutoFrame("HORIZONTAL");
	locationRow.name = "location-row";
	locationRow.counterAxisAlignItems = "CENTER";
	locationRow.layoutSizingHorizontal = "FILL";
	locationRow.layoutSizingVertical = "HUG";
	bindField(locationRow, "itemSpacing", layout.locationGap, byName);
	bindField(locationRow, "paddingBottom", layout.locationPadBottom, byName);
	body.appendChild(locationRow);
	const locIcon = createIconNode(payload.icons["earth-fill"], "location-icon", iconSize);
	bindFillsDeep(locIcon, paint.foreground, byName);
	bindField(locIcon, "width", layout.iconSize, byName);
	bindField(locIcon, "height", layout.iconSize, byName);
	locationRow.appendChild(locIcon);
	const locationText = figma.createText();
	applyTextSlot(locationText, slotById(payload, "location"), paint, byName, byId, familyFonts);
	locationRow.appendChild(locationText);
	locationText.layoutSizingHorizontal = "FILL";

	const tags = createAutoFrame("HORIZONTAL");
	tags.name = "tags";
	tags.layoutWrap = "WRAP";
	tags.layoutSizingHorizontal = "FILL";
	tags.layoutSizingVertical = "HUG";
	bindField(tags, "itemSpacing", layout.tagsGap, byName);
	tags.counterAxisSpacing = resolvedModeValue(variableByName(byName, layout.tagsGap), byId);
	body.appendChild(tags);
	const tagInstances = [];
	for (let index = 0; index < 4; index += 1) {
		const tag = createBadgeInstance(badgeSet, {
			Variant: "neutral",
			Label: "Tag",
			"Show leading": false,
			"Show trailing": false,
		});
		tag.name = `tag-${index + 1}`;
		tags.appendChild(tag);
		tagInstances.push(tag);
	}

	return {
		comp,
		slotNodes: {
			name: { text: nameText },
			role: { text: roleText },
			location: { text: locationText },
			specialization: { node: specialization },
			logo: { node: logo },
			"location-row": { node: locationRow },
			tags: { node: tags },
		},
	};
}

async function buildAnalyst(payload, variableIds) {
	if (!payload || !payload.layout || !payload.paint || !Array.isArray(payload.sizes)) {
		throw new Error("components/analyst.json is missing. Run figma:build-component -- analyst.");
	}
	const byName = await localsByName(variableIds);
	const familyFonts = await loadSlotFonts(payload, byName);
	const page = figma.currentPage;
	page.name = "Components";
	const removed = clearExistingNamed(page, payload.name);
	const badgeSet = findComponentSet(payload.nested.badge);
	const mediaSet = findComponentSet(payload.nested.mediaSlot);
	const firstSize = payload.sizes[0];
	const base = await createAnalystVariant(
		firstSize,
		payload,
		byName,
		familyFonts,
		badgeSet,
		mediaSet,
	);
	const keys = {};
	addSlotProperties(base.comp, payload, keys);
	for (const slot of payload.layout.slots) {
		if (!slot.booleanProperty) continue;
		if (!keys[slot.booleanProperty]) {
			keys[slot.booleanProperty] = base.comp.addComponentProperty(
				slot.booleanProperty,
				"BOOLEAN",
				true,
			);
		}
	}
	const extraBooleans = [
		["Show specialization", "specialization"],
		["Show logo", "logo"],
		["Show location", "location-row"],
		["Show tags", "tags"],
	];
	for (const [prop, id] of extraBooleans) {
		keys[prop] = base.comp.addComponentProperty(prop, "BOOLEAN", true);
		const target = base.slotNodes[id].node;
		target.componentPropertyReferences = {
			...(target.componentPropertyReferences || {}),
			visible: keys[prop],
		};
	}
	linkSimpleProperties(base.comp, base.slotNodes, payload, keys);

	const components = [base.comp];
	for (const size of payload.sizes.slice(1)) {
		const clone = base.comp.clone();
		clone.name = `Size=${size.name}`;
		const body = clone.findOne((node) => node.name === "body");
		if (body) {
			bindField(body, "paddingTop", size.padding, byName);
			bindField(body, "paddingRight", size.padding, byName);
			bindField(body, "paddingBottom", size.padding, byName);
			bindField(body, "paddingLeft", size.padding, byName);
		}
		const logo = clone.findOne((node) => node.name === "logo");
		if (logo && logo.type === "INSTANCE") {
			const logoName =
				size.name === "sm" ? "Type=logo, Size=7" : "Type=logo, Size=10";
			const source = mediaSet.children.find((child) => child.name === logoName);
			if (source) logo.swapComponent(source);
		}
		components.push(clone);
	}
	return finishVariantSet(page, payload, components, removed, byName);
}

function findNamedComponent(name) {
	for (const page of figma.root.children) {
		if (page.type !== "PAGE") continue;
		for (const node of page.children) {
			if (
				(node.type === "COMPONENT_SET" || node.type === "COMPONENT") &&
				node.name === name
			) {
				return node;
			}
		}
	}
	throw new Error(`${name} is missing. Build it on the Components page first.`);
}

function parseVariantName(name) {
	const out = {};
	for (const part of String(name || "").split(",")) {
		const idx = part.indexOf("=");
		if (idx === -1) continue;
		out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
	}
	return out;
}

function variantSource(main, variantName) {
	if (main.type === "COMPONENT") return main;
	if (variantName) {
		const exact = main.children.find((child) => child.name === variantName);
		if (exact) return exact;
		const wanted = parseVariantName(variantName);
		const keys = Object.keys(wanted);
		if (keys.length > 0) {
			const hit = main.children.find((child) => {
				const props = child.variantProperties || parseVariantName(child.name);
				return keys.every((key) => props[key] === wanted[key]);
			});
			if (hit) return hit;
		}
	}
	return main.defaultVariant || main.children[0];
}

async function ensureNamedPage(name) {
	let page = figma.root.children.find((node) => node.type === "PAGE" && node.name === name);
	if (!page) {
		page = figma.createPage();
		page.name = name;
	}
	await figma.setCurrentPageAsync(page);
	return page;
}

function layoutTemplatesColumn(page) {
	const children = [...page.children].sort((a, b) => a.name.localeCompare(b.name));
	let y = 0;
	for (const child of children) {
		child.x = 0;
		child.y = y;
		y += child.height + PAGE_COLUMN_GAP;
	}
}

function applySizing(node, spec) {
	if (spec.layoutSizingHorizontal) node.layoutSizingHorizontal = spec.layoutSizingHorizontal;
	if (spec.layoutSizingVertical) node.layoutSizingVertical = spec.layoutSizingVertical;
}

function applyPadValue(node, field, value, byName) {
	if (value == null) return;
	if (typeof value === "number") {
		node[field] = value;
		return;
	}
	bindField(node, field, value, byName);
}

function applyChromePadding(node, padding, byName) {
	if (!padding) return;
	applyPadValue(node, "paddingTop", padding.top, byName);
	applyPadValue(node, "paddingRight", padding.right, byName);
	applyPadValue(node, "paddingBottom", padding.bottom, byName);
	applyPadValue(node, "paddingLeft", padding.left, byName);
}

const TEMPLATE_SECTIONS = [
	{
		header: "TITLE SLIDES",
		match: (id) => String(id).startsWith("title-slide"),
	},
	{
		header: "CHAPTER SLIDES",
		match: (id) => String(id).startsWith("chapter-slide"),
	},
	{
		header: "CONTENT SLIDES",
		match: (id) => String(id).startsWith("content-slide"),
	},
	{
		header: "GRATIA SLIDES",
		match: (id) => String(id).startsWith("gratia-"),
	},
];

const LEGACY_TEMPLATE_PAGES = [
	"Templates",
	"Title slides",
	"Chapter slides",
	"Content slides",
	"Gratia slides",
];

function removeEmptyPage(name) {
	const page = figma.root.children.find((node) => node.type === "PAGE" && node.name === name);
	if (page && page.children.length === 0) page.remove();
}

function ensurePageDivider() {
	if (typeof figma.createPageDivider === "function") {
		return figma.createPageDivider("---");
	}
	const page = figma.createPage();
	page.name = "---";
	return page;
}

function isPageDividerNode(node) {
	return node.type === "PAGE" && (node.isPageDivider || node.name === "---");
}

function ensureEmptyNamedPage(name) {
	let page = figma.root.children.find(
		(node) => node.type === "PAGE" && node.name === name && !isPageDividerNode(node),
	);
	if (!page) {
		page = figma.createPage();
		page.name = name;
	}
	return page;
}

function templateIdsBySection() {
	const ids = Object.keys(TEMPLATES || {}).filter((id) => TEMPLATES[id]).sort();
	return TEMPLATE_SECTIONS.map((section) => ({
		header: section.header,
		ids: ids.filter((id) => section.match(id)),
	})).filter((section) => section.ids.length > 0);
}

const PAGE_ORDER_HEADERS = new Set(TEMPLATE_SECTIONS.map((section) => section.header));

function orderRootPages() {
	const sections = templateIdsBySection();
	const spareDividers = figma.root.children.filter((node) => isPageDividerNode(node));
	let dividerIndex = 0;
	const takeDivider = () => {
		if (dividerIndex < spareDividers.length) {
			return spareDividers[dividerIndex++];
		}
		return ensurePageDivider();
	};

	const ordered = [];
	const components = figma.root.children.find(
		(node) => node.type === "PAGE" && node.name === "Components" && !isPageDividerNode(node),
	);
	if (components) ordered.push(components);

	for (const section of sections) {
		ordered.push(takeDivider());
		ordered.push(ensureEmptyNamedPage(section.header));
		for (const id of section.ids) {
			ordered.push(ensureEmptyNamedPage(id));
		}
	}

	for (let index = 0; index < ordered.length; index += 1) {
		figma.root.insertChild(index, ordered[index]);
	}

	for (const name of LEGACY_TEMPLATE_PAGES) {
		removeEmptyPage(name);
	}

	const keep = new Set(ordered.map((node) => node.id));
	for (const node of [...figma.root.children]) {
		if (node.type !== "PAGE") continue;
		if (keep.has(node.id)) continue;
		if (isPageDividerNode(node)) {
			node.remove();
			continue;
		}
		if (node.children.length === 0 && PAGE_ORDER_HEADERS.has(node.name)) {
			node.remove();
		}
	}
}

async function applyColorTheme(node, theme) {
	if (!theme) return;
	const collections = await figma.variables.getLocalVariableCollectionsAsync();
	const color = collections.find((item) => item.name === "Color");
	if (!color) return;
	const mode = color.modes.find(
		(item) => item.name.toLowerCase() === String(theme).toLowerCase(),
	);
	if (!mode) return;
	node.setExplicitVariableModeForCollection(color, mode.modeId);
}

function applyFrameChrome(node, spec, byName) {
	if (node.type === "TEXT") {
		if (spec.maxWidth != null && "maxWidth" in node) node.maxWidth = spec.maxWidth;
		return;
	}
	if (spec.fill) node.fills = [bindPaint(spec.fill, byName)];
	if (spec.stroke) {
		node.strokes = [bindPaint(spec.stroke, byName)];
		node.strokeAlign = spec.strokeAlign || "INSIDE";
	}
	if (spec.radius) {
		bindField(node, "topLeftRadius", spec.radius, byName);
		bindField(node, "topRightRadius", spec.radius, byName);
		bindField(node, "bottomLeftRadius", spec.radius, byName);
		bindField(node, "bottomRightRadius", spec.radius, byName);
	}
	if (spec.strokeTop) bindField(node, "strokeTopWeight", spec.strokeTop, byName);
	if (spec.strokeRight) bindField(node, "strokeRightWeight", spec.strokeRight, byName);
	if (spec.strokeBottom) bindField(node, "strokeBottomWeight", spec.strokeBottom, byName);
	if (spec.strokeLeft) bindField(node, "strokeLeftWeight", spec.strokeLeft, byName);
	if (spec.clipsContent) node.clipsContent = true;
	if (spec.primaryAxisAlignItems) node.primaryAxisAlignItems = spec.primaryAxisAlignItems;
	if (spec.counterAxisAlignItems) node.counterAxisAlignItems = spec.counterAxisAlignItems;
	if (spec.layoutWrap === "WRAP") {
		node.layoutWrap = "WRAP";
		node.counterAxisSpacing = node.itemSpacing;
	}
	if (spec.maxWidth != null) node.maxWidth = spec.maxWidth;
	if (spec.layoutGrow != null) node.layoutGrow = spec.layoutGrow;
	if (spec.layoutPositioning === "ABSOLUTE") {
		node.layoutPositioning = "ABSOLUTE";
		if (spec.constraints) node.constraints = spec.constraints;
	}
	if (spec.widthPx) {
		node.layoutSizingHorizontal = "FIXED";
		node.resize(spec.widthPx, node.height);
	}
	if (spec.heightPx) {
		node.layoutSizingVertical = "FIXED";
		node.resize(node.width, spec.heightPx);
	}
	if (spec.columns) node.setPluginData("columns", String(spec.columns));
	if (spec.aspectSquare) node.setPluginData("aspectSquare", "1");
	if (spec.aspectRatio) node.setPluginData("aspectRatio", String(spec.aspectRatio));
	if (spec.fraction) node.setPluginData("fraction", spec.fraction);
}

function applyColumnsNode(node) {
	const columns = Number(node.getPluginData("columns") || 0);
	if (!columns || !("children" in node) || node.children.length === 0) return;
	node.layoutMode = "HORIZONTAL";
	node.layoutWrap = "WRAP";
	node.counterAxisSpacing = node.itemSpacing;
	const inner = Math.max(
		0,
		node.width - (node.paddingLeft || 0) - (node.paddingRight || 0),
	);
	const gap = node.itemSpacing || 0;
	const cell = (inner - gap * (columns - 1)) / columns;
	for (const child of node.children) {
		child.layoutSizingHorizontal = "FIXED";
		child.resize(Math.max(1, cell), child.height);
	}
}

function applyFractionRow(node) {
	if (!("children" in node) || node.layoutMode !== "HORIZONTAL") return;
	const hasThird = node.children.some((child) => child.getPluginData("fraction") === "1-3");
	if (!hasThird) return;
	for (const child of node.children) {
		child.layoutSizingHorizontal = "FILL";
		child.layoutGrow = child.getPluginData("fraction") === "1-3" ? 1 : 2;
	}
}

function applyAspectNode(node) {
	if (node.getPluginData("aspectSquare") === "1") {
		node.layoutSizingVertical = "FIXED";
		node.resize(Math.max(1, node.width), Math.max(1, node.width));
	}
	const ratio = Number(node.getPluginData("aspectRatio") || 0);
	if (ratio) {
		node.layoutSizingVertical = "FIXED";
		node.resize(Math.max(1, node.width), Math.max(1, node.width / ratio));
	}
}

function fixAbsolute(parent) {
	if (!("children" in parent)) return;
	for (const child of parent.children) {
		if (child.layoutPositioning === "ABSOLUTE") {
			const constraints = child.constraints || {};
			if (constraints.horizontal === "STRETCH") {
				child.x = 0;
				child.resize(parent.width, child.height);
			}
			if (constraints.vertical === "MAX") child.y = parent.height - child.height;
			if (constraints.vertical === "MIN") child.y = 0;
		}
		fixAbsolute(child);
	}
}

function applyTemplateFixes(node) {
	applyFractionRow(node);
	applyColumnsNode(node);
	if ("children" in node) {
		for (const child of node.children) applyTemplateFixes(child);
	}
	applyAspectNode(node);
}

async function preloadTemplateFonts(byName) {
	const byId = localById(byName);
	const families = new Set();
	for (const variable of byName.values()) {
		if (!variable.scopes || !variable.scopes.includes("FONT_FAMILY")) continue;
		const value = resolvedModeValue(variable, byId);
		if (typeof value === "string") families.add(value);
	}
	for (const family of families) {
		await loadFamilyStyles(family, [400, 500, 600, 700]);
	}
}

async function buildTextNode(spec, byName, parent) {
	const byId = localById(byName);
	const text = figma.createText();
	text.name = spec.name || "text";
	if (parent) parent.appendChild(text);
	const familyVar = variableByName(byName, spec.fontFamily);
	const weightVar = variableByName(byName, spec.fontWeight);
	const family = resolvedModeValue(familyVar, byId);
	const weight = resolvedModeValue(weightVar, byId);
	const available = await figma.listAvailableFontsAsync();
	const familyFonts = available.filter((font) => font.fontName.family === family);
	text.fontName = styleForWeight(familyFonts, weight);
	text.characters = spec.characters || "";
	text.lineHeight = {
		unit: "PERCENT",
		value:
			spec.lineHeightPercent != null
				? spec.lineHeightPercent
				: percentFromVariable(byName, byId, spec.lineHeight, 120),
	};
	text.textAlignHorizontal = spec.textAlign || "LEFT";
	text.fills = [bindPaint(spec.fill, byName)];
	bindField(text, "fontFamily", spec.fontFamily, byName);
	bindField(text, "fontWeight", spec.fontWeight, byName);
	if (spec.fontSize) bindField(text, "fontSize", spec.fontSize, byName);
	if (spec.opacity) bindField(text, "opacity", spec.opacity, byName);
	text.textAutoResize = "HEIGHT";
	applySizing(text, spec);
	applyFrameChrome(text, spec, byName);
	return text;
}

async function setTextCharacters(node, chars) {
	if (!node || node.type !== "TEXT") return;
	if (node.fontName === figma.mixed) {
		const fonts = new Map();
		for (let i = 0; i < node.characters.length; i += 1) {
			const font = node.getRangeFontName(i, i + 1);
			fonts.set(JSON.stringify(font), font);
		}
		for (const font of fonts.values()) await figma.loadFontAsync(font);
	} else {
		await figma.loadFontAsync(node.fontName);
	}
	node.characters = chars;
}

async function applyOverrides(instance, overrides) {
	if (!overrides) return;
	for (const override of overrides) {
		const target = override.name
			? instance.findOne((node) => node.name === override.name)
			: instance;
		if (!target) continue;
		if (override.swap && target.type === "INSTANCE") {
			const main = findNamedComponent(override.swap.component);
			target.swapComponent(variantSource(main, override.swap.variant));
		}
		if (override.characters != null) {
			const text =
				target.type === "TEXT"
					? target
					: target.findOne((node) => node.type === "TEXT");
			await setTextCharacters(text, override.characters);
			if (override.textAlign && text) text.textAlignHorizontal = override.textAlign;
		}
		if (override.visible === false) target.visible = false;
		if (override.visible === true) target.visible = true;
	}
}

async function buildTemplateNode(spec, byName, parent) {
	if (spec.type === "text") return buildTextNode(spec, byName, parent);
	if (spec.type === "instance") {
		const source = variantSource(
			findNamedComponent(spec.component),
			spec.variant,
		);
		const instance = source.createInstance();
		instance.name = spec.name || source.name;
		if (parent) parent.appendChild(instance);
		applySizing(instance, spec);
		applyFrameChrome(instance, spec, byName);
		if (spec.props) setInstanceProps(instance, spec.props);
		if (spec.sizeVar) {
			instance.layoutSizingHorizontal = "FIXED";
			instance.layoutSizingVertical = "FIXED";
			bindField(instance, "width", spec.sizeVar, byName);
			bindField(instance, "height", spec.sizeVar, byName);
		}
		if (spec.heightPx) {
			const ratio = instance.height ? instance.width / instance.height : 1;
			instance.layoutSizingVertical = "FIXED";
			instance.layoutSizingHorizontal = "FIXED";
			instance.resize(Math.max(1, spec.heightPx * ratio), spec.heightPx);
		}
		await applyOverrides(instance, spec.overrides);
		if (spec.tagLabels && spec.tagLabels.length > 0) {
			const tags = instance.findOne((node) => node.name === "tags");
			const badges = tags
				? tags.findAll((node) => node.type === "INSTANCE")
				: [];
			for (let index = 0; index < spec.tagLabels.length; index += 1) {
				if (badges[index]) setInstanceProps(badges[index], { Label: spec.tagLabels[index] });
			}
		}
		if (spec.colorTheme) await applyColorTheme(instance, spec.colorTheme);
		return instance;
	}
	if (spec.type === "autoLayout" || spec.type === "frame") {
		const frame = createAutoFrame(spec.layoutMode || "VERTICAL");
		frame.name = spec.name;
		if (parent) parent.appendChild(frame);
		applyChromePadding(frame, spec.padding, byName);
		if (typeof spec.itemSpacing === "string") {
			bindField(frame, "itemSpacing", spec.itemSpacing, byName);
		} else if (typeof spec.itemSpacing === "number") {
			frame.itemSpacing = spec.itemSpacing;
		}
		applySizing(frame, spec);
		applyFrameChrome(frame, spec, byName);
		for (const child of spec.children || []) {
			await buildTemplateNode(child, byName, frame);
		}
		return frame;
	}
	throw new Error(`Unknown template node type ${JSON.stringify(spec.type)}`);
}

async function buildTemplate(payload, variableIds) {
	if (!payload || !payload.tree || !payload.name) {
		throw new Error("templates JSON is missing. Run figma:build-template.");
	}
	if (figma.loadAllPagesAsync) await figma.loadAllPagesAsync();
	const byName = await localsByName(variableIds);
	await preloadTemplateFonts(byName);
	const page = await ensureNamedPage(payload.page || payload.name);
	for (const legacy of LEGACY_TEMPLATE_PAGES) {
		const leftover = figma.root.children.find(
			(node) => node.type === "PAGE" && node.name === legacy && !node.isPageDivider,
		);
		if (leftover) clearExistingNamed(leftover, payload.name);
	}
	const removed = clearExistingNamed(page, payload.name);
	const spec = payload.tree;
	const comp = figma.createComponent();
	comp.name = payload.name;
	comp.layoutMode = spec.layoutMode || "VERTICAL";
	comp.itemSpacing = spec.itemSpacing || 0;
	comp.primaryAxisAlignItems = "MIN";
	comp.counterAxisAlignItems = "MIN";
	comp.resize(1280, payload.height || 800);
	comp.layoutSizingHorizontal = "FIXED";
	comp.layoutSizingVertical = "FIXED";
	comp.clipsContent = true;
	bindField(comp, "width", payload.width, byName);
	comp.fills = [bindPaint(payload.fill, byName)];
	if (payload.colorTheme) await applyColorTheme(comp, payload.colorTheme);
	for (const child of spec.children || []) {
		await buildTemplateNode(child, byName, comp);
	}
	applyTemplateFixes(comp);
	fixAbsolute(comp);
	layoutTemplatesColumn(page);
	orderRootPages();
	return {
		componentId: comp.id,
		name: payload.name,
		page: page.name,
		removedIds: removed,
	};
}

async function buildNamedTemplate(id, variableIds) {
	const payload = TEMPLATES[id];
	if (!payload) {
		throw new Error(
			`Unknown template ${JSON.stringify(id)}. Run figma:build-template -- ${id}.`,
		);
	}
	return buildTemplate(payload, variableIds);
}

const COMPONENT_BUILDERS = {
	card: buildCard,
	badge: buildBadge,
	stamp: buildStamp,
	callout: buildCallout,
	analyst: buildAnalyst,
};

async function buildNamedComponent(name, variableIds) {
	const payload = COMPONENTS[name];
	const builder = COMPONENT_BUILDERS[name];
	if (!payload || !builder) {
		throw new Error(`Unknown component ${JSON.stringify(name)}`);
	}
	return builder(payload, variableIds);
}

async function runDeckToolSync(command) {
	const cmd = command || "all";
	if (cmd === "sync-variables") {
		return { command: cmd, variables: await syncAllVariables(VARIABLES) };
	}
	if (cmd === "build-templates") {
		const built = {};
		for (const id of Object.keys(TEMPLATES)) {
			if (!TEMPLATES[id]) continue;
			built[id] = await buildNamedTemplate(id);
		}
		orderRootPages();
		return { command: cmd, templates: built };
	}
	if (cmd.startsWith("build-template-")) {
		const id = cmd.slice("build-template-".length);
		return { command: cmd, [id]: await buildNamedTemplate(id) };
	}
	if (cmd.startsWith("build-")) {
		const name = cmd.slice("build-".length);
		return { command: cmd, [name]: await buildNamedComponent(name) };
	}
	if (cmd === "all") {
		const variables = await syncAllVariables(VARIABLES);
		const built = {};
		for (const name of Object.keys(COMPONENT_BUILDERS)) {
			if (!COMPONENTS[name]) continue;
			built[name] = await buildNamedComponent(name, variables.variableIds);
		}
		return { command: cmd, variables, components: built };
	}
	throw new Error(`Unknown command ${JSON.stringify(cmd)}`);
}

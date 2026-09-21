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

function bindFillsDeep(node, binding, byName) {
	if ("fills" in node && node.fills !== figma.mixed) {
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

	const origin = nextPagePosition(page);
	const componentSet = figma.combineAsVariants(components, page);
	componentSet.name = payload.name;
	layoutVariantSet(componentSet, payload.variants.map((item) => item.variant), origin);

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

function finishVariantSet(page, payload, components, removed) {
	const origin = nextPagePosition(page);
	const componentSet = figma.combineAsVariants(components, page);
	componentSet.name = payload.name;
	layoutVariantSet(
		componentSet,
		payload.variants.map((item) => item.variant),
		origin,
		payload.sizes ? payload.sizes.map((item) => item.name) : null,
	);
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
	return finishVariantSet(page, payload, components, removed);
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
	return finishVariantSet(page, payload, components, removed);
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
	return finishVariantSet(page, payload, components, removed);
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

async function createAnalystVariant(spec, size, payload, byName, familyFonts, badgeSet) {
	const layout = payload.layout;
	const byId = localById(byName);
	const overlay = resolvedModeValue(variableByName(byName, layout.overlay.left), byId);
	const iconSize = resolvedModeValue(variableByName(byName, layout.iconSize), byId);
	const logoSize = resolvedModeValue(variableByName(byName, size.logoSize), byId);

	const comp = figma.createComponent();
	comp.name = `Variant=${spec.variant}, Size=${size.name}`;
	comp.layoutMode = "VERTICAL";
	comp.primaryAxisAlignItems = "MIN";
	comp.counterAxisAlignItems = "MIN";
	comp.resize(layout.width, 80);
	comp.layoutSizingHorizontal = "FIXED";
	comp.layoutSizingVertical = "HUG";
	comp.fills = [bindPaint(spec.fill, byName)];
	comp.strokes = [bindPaint(spec.stroke, byName)];
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

	const photo = createAutoFrame("VERTICAL");
	photo.name = "image";
	photo.primaryAxisAlignItems = "CENTER";
	photo.counterAxisAlignItems = "CENTER";
	photo.fills = [
		{
			type: "SOLID",
			color: {
				r: layout.photoFill.r,
				g: layout.photoFill.g,
				b: layout.photoFill.b,
			},
			opacity: layout.photoFill.opacity,
		},
	];
	cover.appendChild(photo);
	photo.layoutSizingHorizontal = "FILL";
	photo.layoutSizingVertical = "FILL";
	const photoText = figma.createText();
	applyTextSlot(photoText, slotById(payload, "photo"), spec, byName, byId, familyFonts);
	photo.appendChild(photoText);

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
	applyTextSlot(nameText, slotById(payload, "name"), spec, byName, byId, familyFonts);
	names.appendChild(nameText);
	nameText.layoutSizingHorizontal = "FILL";
	const roleText = figma.createText();
	applyTextSlot(roleText, slotById(payload, "role"), spec, byName, byId, familyFonts);
	names.appendChild(roleText);
	roleText.layoutSizingHorizontal = "FILL";

	const logo = createAutoFrame("VERTICAL");
	logo.name = "logo";
	logo.primaryAxisAlignItems = "CENTER";
	logo.counterAxisAlignItems = "CENTER";
	logo.resize(logoSize, logoSize);
	logo.layoutSizingHorizontal = "FIXED";
	logo.layoutSizingVertical = "FIXED";
	logo.fills = [
		{
			type: "SOLID",
			color: {
				r: layout.photoFill.r,
				g: layout.photoFill.g,
				b: layout.photoFill.b,
			},
			opacity: layout.photoFill.opacity,
		},
	];
	logo.strokes = [bindPaint(layout.logoStroke, byName)];
	logo.strokeAlign = "INSIDE";
	bindField(logo, "width", size.logoSize, byName);
	bindField(logo, "height", size.logoSize, byName);
	bindField(logo, "topLeftRadius", layout.radius, byName);
	bindField(logo, "topRightRadius", layout.radius, byName);
	bindField(logo, "bottomLeftRadius", layout.radius, byName);
	bindField(logo, "bottomRightRadius", layout.radius, byName);
	bindField(logo, "strokeTopWeight", layout.strokeTop, byName);
	bindField(logo, "strokeBottomWeight", layout.strokeBottom, byName);
	bindField(logo, "strokeLeftWeight", layout.strokeLeft, byName);
	bindField(logo, "strokeRightWeight", layout.strokeRight, byName);
	identity.appendChild(logo);
	const logoText = figma.createText();
	applyTextSlot(logoText, slotById(payload, "logo-label"), spec, byName, byId, familyFonts);
	logo.appendChild(logoText);

	const locationRow = createAutoFrame("HORIZONTAL");
	locationRow.name = "location-row";
	locationRow.counterAxisAlignItems = "CENTER";
	locationRow.layoutSizingHorizontal = "FILL";
	locationRow.layoutSizingVertical = "HUG";
	bindField(locationRow, "itemSpacing", layout.locationGap, byName);
	bindField(locationRow, "paddingBottom", layout.locationPadBottom, byName);
	body.appendChild(locationRow);
	const locIcon = createIconNode(payload.icons["earth-fill"], "location-icon", iconSize);
	bindFillsDeep(locIcon, spec.foreground, byName);
	bindField(locIcon, "width", layout.iconSize, byName);
	bindField(locIcon, "height", layout.iconSize, byName);
	locationRow.appendChild(locIcon);
	const locationText = figma.createText();
	applyTextSlot(locationText, slotById(payload, "location"), spec, byName, byId, familyFonts);
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
	if (!payload || !payload.layout || !Array.isArray(payload.variants)) {
		throw new Error("components/analyst.json is missing. Run figma:build-component -- analyst.");
	}
	const byName = await localsByName(variableIds);
	const familyFonts = await loadSlotFonts(payload, byName);
	const page = figma.currentPage;
	page.name = "Components";
	const removed = clearExistingNamed(page, payload.name);
	const badgeSet = findComponentSet(payload.nested.badge);
	const firstSize = payload.sizes[0];
	const first = payload.variants[0];
	const base = await createAnalystVariant(
		first,
		firstSize,
		payload,
		byName,
		familyFonts,
		badgeSet,
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
	const combos = [];
	for (const size of payload.sizes) {
		for (const spec of payload.variants) {
			if (size === firstSize && spec === first) continue;
			combos.push({ size, spec });
		}
	}
	for (const combo of combos) {
		const clone = base.comp.clone();
		clone.name = `Variant=${combo.spec.variant}, Size=${combo.size.name}`;
		clone.fills = [bindPaint(combo.spec.fill, byName)];
		clone.strokes = [bindPaint(combo.spec.stroke, byName)];
		const body = clone.findOne((node) => node.name === "body");
		if (body) {
			bindField(body, "paddingTop", combo.size.padding, byName);
			bindField(body, "paddingRight", combo.size.padding, byName);
			bindField(body, "paddingBottom", combo.size.padding, byName);
			bindField(body, "paddingLeft", combo.size.padding, byName);
		}
		const logo = clone.findOne((node) => node.name === "logo");
		if (logo) {
			bindField(logo, "width", combo.size.logoSize, byName);
			bindField(logo, "height", combo.size.logoSize, byName);
		}
		const named = new Set(["name", "role", "location"]);
		for (const text of clone.findAll((node) => node.type === "TEXT")) {
			if (named.has(text.name)) {
				text.fills = [bindPaint(combo.spec.foreground, byName)];
			}
		}
		const locIcon = clone.findOne((node) => node.name === "location-icon");
		if (locIcon) bindFillsDeep(locIcon, combo.spec.foreground, byName);
		components.push(clone);
	}
	return finishVariantSet(page, payload, components, removed);
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

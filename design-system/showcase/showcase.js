const BRAND_LINK_ID = "brand-stylesheet";
const brandSwitch = document.querySelector(".showcase-brand-switch");
const brandButtons = brandSwitch
	? [...brandSwitch.querySelectorAll("button[data-value]")]
	: [];
const VALID_BRANDS = brandButtons.map((btn) => btn.dataset.value);

function pick(obj, keys) {
	if (!obj) return null;
	const picked = {};
	keys.forEach((key) => {
		if (obj[key] != null) picked[key] = obj[key];
	});
	return Object.keys(picked).length ? picked : null;
}

function slideChrome(brand) {
	const slide = brand.components && brand.components.slide;
	const stack = brand.components && brand.components.stack;
	const picked = {};
	if (slide) {
		if (slide.header) picked.header = slide.header;
		if (slide.content) picked.content = slide.content;
		if (slide.footer) picked.footer = slide.footer;
	}
	if (stack) picked.stack = stack;
	return Object.keys(picked).length ? picked : null;
}

function slideTitleSettings(brand) {
	const slide = brand.components && brand.components.slide;
	return slide ? pick(slide, ["pretitle", "title", "subtitle"]) : null;
}

function slideCanvasSettings(brand) {
	const slide = brand.components && brand.components.slide;
	return slide ? pick(slide, ["canvas", "surface"]) : null;
}

const PAGE_GROUPS = [
	{
		heading: "Foundations",
		pages: [
			{ id: "brand", label: "Brand", width: "narrow", kind: "brand" },
			{
				id: "typography",
				label: "Type",
				width: "narrow",
				settings: (brand) =>
					pick(brand.components, ["paragraphTitle", "body"]),
				fragments: [
					"typography/cover-title.html",
					"typography/paragraph-title-lg.html",
					"typography/paragraph-title-md.html",
					"typography/paragraph-title-sm.html",
					"typography/body-copy-lg.html",
					"typography/body-copy-md.html",
					"typography/body-copy-sm.html",
				],
			},
			{
				id: "layout",
				label: "Layout",
				settings: slideChrome,
				fragments: [
					"layout/media-slot.html",
					"layout/stack.html",
					"layout/header-container.html",
					"layout/content-container.html",
					"layout/footer-container.html",
					"layout/slide.html",
				],
			},
		],
	},
	{
		heading: "Components",
		pages: [
			{
				id: "attribution-box",
				label: "Attribution box",
				theme: true,
				fragments: ["attribution-box/attribution-box.html"],
			},
			{
				id: "badge",
				label: "Badge",
				theme: true,
				settings: (brand) => brand.components && brand.components.badge,
				demos: [
					{
						id: "badge-showcase-text",
						caption: "components/badge/badge.html · text only",
						className: "showcase-matrix",
					},
					{
						id: "badge-showcase-icons",
						caption: "components/badge/badge.html · with icons",
						className: "showcase-matrix",
					},
				],
			},
			{
				id: "stamp",
				label: "Stamp",
				theme: true,
				settings: (brand) => brand.components && brand.components.stamp,
				demos: [
					{
						id: "stamp-showcase-numbers",
						caption:
							"components/stamp/stamp.html · numbers (omit size = brand default)",
						className: "showcase-matrix",
					},
					{
						id: "stamp-showcase-icons",
						caption: "components/stamp/stamp.html · icons",
						className: "showcase-matrix",
					},
					{
						id: "stamp-showcase-sizes",
						caption:
							'size="4" … "16" (icon and type scale with the square)',
						className: "showcase-matrix-row",
					},
					{
						id: "stamp-showcase-cards",
						caption: "In a card row",
						className: "showcase-row",
					},
					{
						id: "stamp-showcase-list",
						caption: "In a numbered list",
						className: "showcase-list",
					},
				],
			},
			{
				id: "callout",
				label: "Callout",
				theme: true,
				settings: (brand) =>
					brand.components && brand.components.callout,
				demos: [
					{
						id: "callout-showcase",
						caption: "components/callout/callout.html",
						className: "showcase-matrix",
					},
				],
			},
			{
				id: "card",
				label: "Card",
				theme: true,
				settings: (brand) => brand.components && brand.components.card,
				demos: [
					{
						id: "card-showcase",
						captionId: "card-showcase-label",
						caption: "components/card/card.html",
						className: "showcase-matrix",
					},
				],
			},
			{
				id: "slide-footer",
				label: "Slide footer",
				theme: true,
				settings: (brand) =>
					brand.components && brand.components.slideFooter,
				fragments: [
					{
						src: "slide-footer/slide-footer.html",
						className: "showcase-footer",
					},
				],
			},
			{
				id: "slide-title",
				label: "Slide title",
				theme: true,
				settings: slideTitleSettings,
				fragments: [
					"slide-title/slide-title-group-lg.html",
					"slide-title/slide-title-group-md.html",
					"slide-title/slide-title-group-sm.html",
					"slide-title/slide-title-lg.html",
					"slide-title/slide-title-md.html",
					"slide-title/slide-title-sm.html",
					"slide-title/slide-pretitle.html",
					"slide-title/slide-subtitle.html",
				],
			},
		],
	},
];

const PRESET_GROUPS = [
	{
		id: "title-slides",
		heading: "Title slides",
		settings: (brand) => brand.components && brand.components.cover,
		presets: [
			{
				id: "title-slide-01",
				label: "01",
				src: "../../presets/title-slides/title-slide-01.html",
			},
			{
				id: "title-slide-02",
				label: "02",
				src: "../../presets/title-slides/title-slide-02.html",
			},
			{
				id: "title-slide-03",
				label: "03",
				src: "../../presets/title-slides/title-slide-03.html",
			},
			{
				id: "title-slide-04",
				label: "04",
				src: "../../presets/title-slides/title-slide-04.html",
			},
		],
	},
	{
		id: "chapter-slides",
		heading: "Chapter slides",
		settings: (brand) => brand.components && brand.components.cover,
		presets: [
			{
				id: "chapter-slide-01",
				label: "01",
				src: "../../presets/chapter-slides/chapter-slide-01.html",
			},
			{
				id: "chapter-slide-02",
				label: "02",
				src: "../../presets/chapter-slides/chapter-slide-02.html",
			},
		],
	},
	{
		id: "content-slides",
		heading: "Content slides",
		settings: slideCanvasSettings,
		presets: [
			{
				id: "content-slide-3-cards",
				label: "3 cards",
				src: "../../presets/content-slides/content-slide-3-cards.html",
				variants: [
					{},
					{ colorTheme: "dark", caption: 'color-theme="dark"' },
					{
						colorTheme: "dark",
						cardsColorTheme: "light",
						caption:
							'color-theme="dark" with cards color-theme="light"',
					},
				],
			},
			{
				id: "content-slide-story",
				label: "Story",
				src: "../../presets/content-slides/content-slide-story.html",
				variants: [
					{},
					{ colorTheme: "dark", caption: 'color-theme="dark"' },
				],
			},
		],
	},
];

const FILTER_ALIASES = Object.fromEntries(
	PRESET_GROUPS.map((group) => [group.id, group.presets[0].id]),
);

const SETTINGS = [
	...PAGE_GROUPS.flatMap((group) =>
		group.pages
			.filter((page) => page.settings)
			.map((page) => [page.id, page.settings]),
	),
	...PRESET_GROUPS.map((group) => [group.id, group.settings]),
];

function brandFromUrl() {
	const brand = new URLSearchParams(location.search).get("brand");
	return VALID_BRANDS.includes(brand) ? brand : "gratia";
}

function setBrandInUrl(brand) {
	const url = new URL(location.href);
	url.searchParams.set("brand", brand);
	history.replaceState(null, "", url);
}

function syncBrandTabs(active) {
	if (brandSwitch) brandSwitch.setAttribute("value", active);
	brandButtons.forEach((btn) => {
		btn.setAttribute(
			"aria-pressed",
			btn.dataset.value === active ? "true" : "false",
		);
	});
}

let currentBrand = brandFromUrl();
let currentBrandSettings = null;
syncBrandTabs(currentBrand);
if (!new URLSearchParams(location.search).has("brand")) {
	setBrandInUrl(currentBrand);
}

const LOGO_SURFACES = {
	cover: "--color-slide-background",
	slide: "--color-slide-background",
	"slide-surface": "--color-slide-surface-background",
	"cover-surface": "--color-slide-surface-background",
};

function logosFor(brand) {
	if (!brand) {
		return {
			default: "../../assets/logos/placeholder-logo.svg",
			inverted: "../../assets/logos/placeholder-logo-inverted.svg",
		};
	}
	return {
		default: `../../brands/${brand}/${brand}-logo.svg`,
		inverted: `../../brands/${brand}/${brand}-logo-inverted.svg`,
	};
}

function parseCssRgb(value) {
	const match = String(value).match(
		/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i,
	);
	if (!match) return null;
	return {
		r: Number(match[1]) / 255,
		g: Number(match[2]) / 255,
		b: Number(match[3]) / 255,
	};
}

function relativeLuminance(rgb) {
	const lin = (channel) =>
		channel <= 0.04045
			? channel / 12.92
			: ((channel + 0.055) / 1.055) ** 2.4;
	return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
}

function isDarkBackground(el, cssVar) {
	const raw = getComputedStyle(el).getPropertyValue(cssVar);
	const rgb = parseCssRgb(raw);
	if (!rgb) return false;
	return relativeLuminance(rgb) < 0.45;
}

function applyLogos(brand) {
	const files = logosFor(brand);
	document
		.querySelectorAll("img[data-logo], slide-footer img[data-slot='logo']")
		.forEach((img) => {
			if (img.closest("attribution-box")) return;
			const explicit = img.getAttribute("data-logo");
			const host =
				img.closest("slide") ||
				img.closest("[color-theme]") ||
				document.documentElement;
			const cssVar = LOGO_SURFACES[explicit] || LOGO_SURFACES.slide;
			img.src = isDarkBackground(host, cssVar)
				? files.inverted
				: files.default;
		});
}

const SEMANTIC_VARIANTS = [
	"neutral",
	"emphasis",
	"positive",
	"warning",
	"negative",
	"informative",
];
const CALLOUT_VARIANTS = SEMANTIC_VARIANTS.filter(
	(variant) => variant !== "emphasis",
);

function titleCase(value) {
	return String(value).replace(/^\w/, (char) => char.toUpperCase());
}

function escapeHtml(value) {
	return String(value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function themeSwitchHtml() {
	return `<app-switch class="showcase-theme-switch" value="light" color-theme="light" aria-label="Color theme">
		<button type="button" data-value="light" aria-pressed="true">Light</button>
		<button type="button" data-value="dark" aria-pressed="false">Dark</button>
	</app-switch>`;
}

function captionHtml(text, id) {
	const idAttr = id ? ` id="${id}"` : "";
	return `<text class="showcase-h4" tone="subtle" context="slide"${idAttr}>${escapeHtml(text)}</text>`;
}

function fragmentBlock(item) {
	const src = typeof item === "string" ? item : item.src;
	const className = item.className ? ` class="${item.className}"` : "";
	return `<div class="showcase-subgroup">
		${captionHtml(`components/${src}`)}
		<div${className} data-preset="fragment" data-src="../components/${src}"></div>
	</div>`;
}

function demoBlock(demo) {
	return `<div class="showcase-subgroup">
		${captionHtml(demo.caption, demo.captionId)}
		<div class="${demo.className}" id="${demo.id}"></div>
	</div>`;
}

function renderPage(page) {
	const widthClass = page.width === "narrow" ? " showcase-group-narrow" : "";
	const themeAttr = page.theme ? ` color-theme="light"` : "";
	const parts = [];
	if (page.kind === "brand") parts.push('<div id="brand-showcase"></div>');
	(page.fragments || []).forEach((item) => parts.push(fragmentBlock(item)));
	(page.demos || []).forEach((demo) => parts.push(demoBlock(demo)));
	if (page.settings) {
		parts.push(
			`<div class="showcase-subgroup" data-settings="${page.id}"></div>`,
		);
	}
	return `<div class="showcase-group${widthClass}" data-section="${page.id}"${themeAttr}>
		<header class="showcase-header">
			<text class="showcase-h1" tone="strong" context="slide">${escapeHtml(page.label)}</text>
			${page.theme ? themeSwitchHtml() : ""}
		</header>
		<div class="showcase-body">${parts.join("")}</div>
	</div>`;
}

function presetPathLabel(src) {
	return src.replace(/^\.\.\/\.\.\//, "");
}

function renderPresetVariant(preset, variant = {}) {
	const caption = variant.caption || presetPathLabel(preset.src);
	const attrs = [`data-preset="slide"`, `data-src="${preset.src}"`];
	if (variant.colorTheme) {
		attrs.push(`data-color-theme="${variant.colorTheme}"`);
	}
	if (variant.cardsColorTheme) {
		attrs.push(`data-cards-color-theme="${variant.cardsColorTheme}"`);
	}
	return `<div class="showcase-subgroup showcase-deck" ${attrs.join(" ")}>
		${captionHtml(caption)}
	</div>`;
}

function renderPresetPage(group, preset) {
	const variants =
		preset.variants && preset.variants.length ? preset.variants : [{}];
	const decks = variants
		.map((variant) => renderPresetVariant(preset, variant))
		.join("");
	return `<div class="showcase-group showcase-group-deck" data-section="${preset.id}">
		<header class="showcase-header">
			<text class="showcase-h1" tone="strong" context="slide">${escapeHtml(preset.label)}</text>
		</header>
		<div class="showcase-body">
			${decks}
			<div class="showcase-subgroup" data-settings="${group.id}"></div>
		</div>
	</div>`;
}

function renderNavGroup(heading, items) {
	const links = items
		.map(
			(item) =>
				`<a href="#${item.id}" data-filter="${item.id}">${escapeHtml(item.label)}</a>`,
		)
		.join("");
	return `<div class="showcase-filter-group">
		<div class="showcase-filter-heading">${escapeHtml(heading)}</div>
		${links}
	</div>`;
}

function mountShowcase() {
	const nav = document.querySelector(".showcase-filter");
	const pages = document.getElementById("showcase-pages");
	if (!nav || !pages) return;

	const navHtml = [
		...PAGE_GROUPS.map((group) => renderNavGroup(group.heading, group.pages)),
		...PRESET_GROUPS.map((group) =>
			renderNavGroup(group.heading, group.presets),
		),
	].join("");
	nav.insertAdjacentHTML("beforeend", navHtml);

	const pageHtml = [
		...PAGE_GROUPS.flatMap((group) => group.pages.map(renderPage)),
		...PRESET_GROUPS.flatMap((group) =>
			group.presets.map((preset) => renderPresetPage(group, preset)),
		),
	].join("");
	pages.innerHTML = pageHtml;
}

function renderShowcaseCard(variant, layout) {
	const meta = [titleCase(variant), titleCase(layout)].join(" · ");
	return `
		<card variant="${variant}" padding="md">
			<card-pretitle data-slot="pretitle" tone="subtle" context="surface">Optional pretitle.</card-pretitle>
			<card-title data-slot="title" tone="strong" context="surface">Card title</card-title>
			<body-copy data-slot="text" size="sm" tone="base" context="surface">Description copy on this card.</body-copy>
			<card-meta data-slot="meta" tone="subtle" context="surface">${meta}</card-meta>
		</card>
	`;
}

function renderCardShowcase(settings = currentBrandSettings) {
	const layout =
		settings &&
		settings.components &&
		settings.components.card &&
		settings.components.card.defaultLayout === "stripe"
			? "stripe"
			: "basic";
	const label = document.getElementById("card-showcase-label");
	if (label) {
		label.textContent = `components/card/card.html · default ${layout}`;
	}
	const root = document.getElementById("card-showcase");
	if (!root) return;
	root.innerHTML = SEMANTIC_VARIANTS.map(
		(variant) =>
			`<div class="showcase-matrix-stack">${renderShowcaseCard(variant, layout)}</div>`,
	).join("");
}

function renderCalloutShowcase() {
	const root = document.getElementById("callout-showcase");
	if (!root) return;
	root.innerHTML = CALLOUT_VARIANTS.map(
		(variant) => `
			<callout variant="${variant}" padding="md">
				<callout-title data-slot="title" tone="strong" context="surface">${titleCase(variant)} title</callout-title>
				<callout-description data-slot="description" tone="base" context="surface">Description copy on this callout.</callout-description>
			</callout>
		`,
	).join("");
}

function renderShowcaseBadge(variant, withIcons) {
	const label = titleCase(variant);
	const icons = withIcons
		? `
			<badge-icon data-slot="leading" icon="checkbox-circle-fill" aria-hidden="true"></badge-icon>
			<badge-text data-slot="label" tone="strong" context="surface">${label}</badge-text>
			<badge-icon data-slot="trailing" icon="arrow-right-s-line" aria-hidden="true"></badge-icon>
		`
		: `<badge-text data-slot="label" tone="strong" context="surface">${label}</badge-text>`;
	return `<badge variant="${variant}">${icons}</badge>`;
}

function renderBadgeShowcase() {
	function renderMatrix(rootId, withIcons) {
		const root = document.getElementById(rootId);
		if (!root) return;
		root.innerHTML = SEMANTIC_VARIANTS.map(
			(variant) =>
				`<div class="showcase-matrix-row">${renderShowcaseBadge(variant, withIcons)}</div>`,
		).join("");
	}
	renderMatrix("badge-showcase-text", false);
	renderMatrix("badge-showcase-icons", true);
}

const STAMP_ICONS = {
	neutral: "star-fill",
	emphasis: "sparkling-2-fill",
	positive: "checkbox-circle-fill",
	warning: "error-warning-fill",
	negative: "close-circle-fill",
	informative: "information-fill",
};

function renderShowcaseStamp(variant, kind, size, number = "1") {
	const sizeAttr = size ? ` size="${size}"` : "";
	const occupant =
		kind === "icon"
			? `<stamp-icon data-slot="mark" icon="${STAMP_ICONS[variant]}" aria-hidden="true"></stamp-icon>`
			: `<stamp-text data-slot="mark">${number}</stamp-text>`;
	return `<stamp variant="${variant}"${sizeAttr}>${occupant}</stamp>`;
}

function renderStampShowcase() {
	const numbersRoot = document.getElementById("stamp-showcase-numbers");
	if (numbersRoot) {
		numbersRoot.innerHTML = SEMANTIC_VARIANTS.map(
			(variant, index) =>
				`<div class="showcase-matrix-row">${renderShowcaseStamp(variant, "number", null, String(index + 1))}</div>`,
		).join("");
	}
	const iconsRoot = document.getElementById("stamp-showcase-icons");
	if (iconsRoot) {
		iconsRoot.innerHTML = SEMANTIC_VARIANTS.map(
			(variant) =>
				`<div class="showcase-matrix-row">${renderShowcaseStamp(variant, "icon")}</div>`,
		).join("");
	}
	const sizesRoot = document.getElementById("stamp-showcase-sizes");
	if (sizesRoot) {
		const steps = ["4", "6", "8", "12", "16"];
		sizesRoot.innerHTML = [
			...steps.map((size, index) =>
				renderShowcaseStamp("neutral", "number", size, String(index + 1)),
			),
			...steps.map((size) =>
				renderShowcaseStamp("informative", "icon", size),
			),
		].join("");
	}
	const cardsRoot = document.getElementById("stamp-showcase-cards");
	if (cardsRoot) {
		const cards = [
			{
				variant: "positive",
				icon: "checkbox-circle-fill",
				title: "On track",
			},
			{
				variant: "warning",
				icon: "error-warning-fill",
				title: "At risk",
			},
			{
				variant: "informative",
				icon: "information-fill",
				title: "Watch",
			},
		];
		cardsRoot.innerHTML = cards
			.map(
				(card) => `
			<card variant="neutral" padding="md">
				<stamp variant="${card.variant}" size="8">
					<stamp-icon data-slot="mark" icon="${card.icon}" aria-hidden="true"></stamp-icon>
				</stamp>
				<card-title data-slot="title" tone="strong" context="surface">${card.title}</card-title>
				<body-copy data-slot="text" size="sm" tone="base" context="surface">Stamp at the top of the card.</body-copy>
			</card>
		`,
			)
			.join("");
	}
	const listRoot = document.getElementById("stamp-showcase-list");
	if (listRoot) {
		const items = [
			"Confirm the scope with the client",
			"Map the current process",
			"Identify the first intervention",
		];
		listRoot.innerHTML = items
			.map(
				(label, index) => `
			<div class="showcase-list-row">
				<stamp variant="neutral">
					<stamp-text data-slot="mark">${index + 1}</stamp-text>
				</stamp>
				<body-copy size="md" tone="base" context="slide">${label}</body-copy>
			</div>
		`,
			)
			.join("");
	}
}

function formatSettingLabel(key) {
	const spaced = String(key)
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
	return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function formatSettingValue(value) {
	if (value === null || value === undefined) return "";
	if (
		typeof value === "object" &&
		typeof value.color === "string" &&
		typeof value.opacity === "number"
	) {
		return `${value.color} at ${value.opacity} opacity`;
	}
	if (typeof value === "object") return JSON.stringify(value);
	return String(value);
}

function isColorLiteral(value) {
	return (
		typeof value === "string" &&
		(/^rgba?\(/i.test(value) || /^#[0-9a-f]{6}$/i.test(value))
	);
}

function parseColorChannels(value) {
	if (typeof value !== "string") return null;
	const rgb = value.match(
		/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
	);
	if (rgb) {
		return {
			r: Number(rgb[1]),
			g: Number(rgb[2]),
			b: Number(rgb[3]),
			a: rgb[4] === undefined ? 1 : Number(rgb[4]),
		};
	}
	const hex = value.match(/^#([0-9a-f]{6})$/i);
	if (hex) {
		const n = parseInt(hex[1], 16);
		return {
			r: (n >> 16) & 255,
			g: (n >> 8) & 255,
			b: n & 255,
			a: 1,
		};
	}
	return null;
}

function withOpacity(colorValue, opacity) {
	const channels = parseColorChannels(colorValue);
	if (!channels) return null;
	return `rgba(${channels.r}, ${channels.g}, ${channels.b}, ${opacity})`;
}

function getPath(obj, dottedPath) {
	return dottedPath.split(".").reduce((acc, key) => {
		return acc && typeof acc === "object" ? acc[key] : undefined;
	}, obj);
}

function resolvePaletteLiteral(brand, refName, depth = 0) {
	if (!refName || typeof refName !== "string" || depth > 8) return null;
	const value = getPath(brand, `foundations.color.${refName}`);
	if (isColorLiteral(value)) return value;
	if (typeof value === "string") {
		return resolvePaletteLiteral(brand, value, depth + 1);
	}
	return null;
}

function resolveSwatchFill(brand, raw) {
	if (isColorLiteral(raw)) return raw;
	if (typeof raw === "string") return resolvePaletteLiteral(brand, raw);
	if (raw && typeof raw === "object" && typeof raw.color === "string") {
		const base = resolvePaletteLiteral(brand, raw.color);
		if (!base) return null;
		if (typeof raw.opacity === "number") {
			return withOpacity(base, raw.opacity);
		}
		return base;
	}
	return null;
}

function isColorSetting(brand, raw) {
	return Boolean(resolveSwatchFill(brand, raw));
}

function isSettingsLeaf(node) {
	if (node === null || node === undefined) return true;
	if (typeof node !== "object" || Array.isArray(node)) return true;
	return (
		typeof node.color === "string" &&
		Object.keys(node).every((key) => key === "color" || key === "opacity")
	);
}

function renderBrandGroupHeading(key, depth) {
	const label = escapeHtml(formatSettingLabel(key));
	if (depth <= 1) {
		return `<text class="showcase-h3" tone="strong" context="slide">${label}</text>`;
	}
	return `<text class="showcase-h4" tone="subtle" context="slide">${label}</text>`;
}

function renderSettingsRow(title, displayValue, fill) {
	const valueText = `<text size="350" tone="base" context="surface">${escapeHtml(displayValue)}</text>`;
	const valueCell = fill
		? `<stack class="brand-settings-value-swatch" direction="row" gap="sm">
				<div class="brand-swatch-chip" style="background-color:${fill}" aria-hidden="true"></div>
				${valueText}
			</stack>`
		: valueText;
	return `
		<div class="brand-settings-row">
			<text size="350" weight="medium" tone="strong" context="surface">${escapeHtml(title)}</text>
			${valueCell}
		</div>
	`;
}

function collectLeafRows(value, nameParts = []) {
	if (isSettingsLeaf(value)) {
		return [
			{
				title: nameParts.map((part) => formatSettingLabel(part)).join(" "),
				value,
			},
		];
	}
	return Object.entries(value).flatMap(([childKey, childValue]) =>
		collectLeafRows(childValue, [...nameParts, childKey]),
	);
}

function renderSettingsTable(brand, rows) {
	if (!rows.length) return "";
	const html = rows
		.map(({ title, value }) => {
			const fill = isColorSetting(brand, value)
				? resolveSwatchFill(brand, value)
				: null;
			return renderSettingsRow(title, formatSettingValue(value), fill);
		})
		.join("");
	return `<div class="brand-settings-table">${html}</div>`;
}

function renderSettingsBlock(headingHtml, tableHtml) {
	if (!tableHtml) return "";
	return `
		<div class="brand-settings-block">
			${headingHtml || ""}
			${tableHtml}
		</div>
	`;
}

function renderBrandGroup(brand, key, value) {
	if (isSettingsLeaf(value)) return "";

	const entries = Object.entries(value);
	const leaves = entries.filter(([, child]) => isSettingsLeaf(child));
	const nests = entries.filter(([, child]) => !isSettingsLeaf(child));

	if (nests.length) {
		const leafBlock = leaves.length
			? renderSettingsBlock(
					"",
					renderSettingsTable(
						brand,
						leaves.map(([leafKey, leafValue]) => ({
							title: formatSettingLabel(leafKey),
							value: leafValue,
						})),
					),
				)
			: "";
		const blocks = nests
			.map(([childKey, childValue]) => {
				const rows = collectLeafRows(childValue);
				return renderSettingsBlock(
					renderBrandGroupHeading(childKey, 2),
					renderSettingsTable(brand, rows),
				);
			})
			.join("");
		return `
			<div class="brand-settings-group">
				${renderBrandGroupHeading(key, 1)}
				${leafBlock}
				${blocks}
			</div>
		`;
	}

	const rows = leaves.map(([leafKey, leafValue]) => ({
		title: formatSettingLabel(leafKey),
		value: leafValue,
	}));
	return `
		<div class="brand-settings-group">
			${renderSettingsBlock(
				renderBrandGroupHeading(key, 1),
				renderSettingsTable(brand, rows),
			)}
		</div>
	`;
}

function renderBrandShowcase(brand) {
	const root = document.getElementById("brand-showcase");
	if (!root || !brand) return;
	const foundations = brand.foundations;
	if (!foundations || typeof foundations !== "object") {
		root.innerHTML = "";
		return;
	}
	root.innerHTML = Object.entries(foundations)
		.map(([group, value]) => renderBrandGroup(brand, group, value))
		.join("");
}

function renderComponentSettings(brand) {
	SETTINGS.forEach(([section, getValue]) => {
		const roots = document.querySelectorAll(`[data-settings="${section}"]`);
		if (!roots.length) return;
		const value = brand ? getValue(brand) : null;
		const html =
			brand && value ? renderBrandGroup(brand, "settings", value) : "";
		roots.forEach((root) => {
			root.innerHTML = html;
		});
	});
}

function slidePretitleDefault(settings) {
	const value =
		settings &&
		settings.components &&
		settings.components.slide &&
		settings.components.slide.pretitle &&
		settings.components.slide.pretitle.default;
	return value === "badge" ? "badge" : "text";
}

function pretitleLabelFromNode(node) {
	if (!node) return "";
	const badgeText = node.querySelector
		? node.querySelector("badge-text")
		: null;
	return (badgeText || node).textContent.replace(/\s+/g, " ").trim();
}

function badgePretitleMarkup(label) {
	return `<badge data-slot="pre" variant="neutral"><badge-text data-slot="label" tone="strong" context="surface">${escapeHtml(label)}</badge-text></badge>`;
}

function textPretitleMarkup(label, context) {
	return `<slide-pretitle data-slot="pre" tone="subtle" context="${escapeHtml(context)}">${escapeHtml(label)}</slide-pretitle>`;
}

function applySlidePretitleDefault(settings = currentBrandSettings) {
	const kind = slidePretitleDefault(settings);
	document.querySelectorAll("slide-title-group").forEach((group) => {
		const pre = group.querySelector(':scope > [data-slot="pre"]');
		if (!pre) return;
		const tag = pre.tagName.toLowerCase();
		const label = pretitleLabelFromNode(pre) || "Pre-title";
		if (kind === "badge" && tag === "slide-pretitle") {
			pre.outerHTML = badgePretitleMarkup(label);
		} else if (kind === "text" && tag === "badge") {
			pre.outerHTML = textPretitleMarkup(label, "slide");
		}
	});
}

async function loadBrandSettings(brand) {
	const res = await fetch(`../../brands/${brand}/brand-settings.json`);
	if (!res.ok) throw new Error(String(res.status));
	return res.json();
}

function applyChromeColorTheme(theme) {
	const nodes = [
		document.body,
		document.querySelector(".showcase-sidebar"),
		document.querySelector(".showcase"),
	];
	nodes.forEach((el) => {
		if (!el) return;
		if (theme) el.setAttribute("color-theme", theme);
		else el.removeAttribute("color-theme");
	});
}

function setShowcaseColorTheme(theme) {
	applyChromeColorTheme(theme);
	document
		.querySelectorAll(".showcase-group[color-theme] .showcase-theme-switch")
		.forEach((sw) => {
			sw.setAttribute("value", theme);
			sw.querySelectorAll("button[data-value]").forEach((btn) => {
				btn.setAttribute(
					"aria-pressed",
					btn.dataset.value === theme ? "true" : "false",
				);
			});
			const group = sw.closest(".showcase-group");
			if (group) group.setAttribute("color-theme", theme);
		});
	applyLogos(currentBrand);
	applySlidePretitleDefault(currentBrandSettings);
}

function syncScrollThemeFromSection(section) {
	const theme = section && section.getAttribute("color-theme");
	applyChromeColorTheme(theme || null);
}

function initThemeSwitches() {
	document.querySelectorAll(".showcase-theme-switch").forEach((sw) => {
		sw.addEventListener("click", (event) => {
			const btn = event.target.closest("button[data-value]");
			if (!btn || !sw.contains(btn)) return;
			setShowcaseColorTheme(btn.dataset.value);
		});
	});
}

let brandApplyId = 0;

function applyBrand(brand = currentBrand) {
	return new Promise((resolve) => {
		const applyId = ++brandApplyId;
		document.getElementById(BRAND_LINK_ID)?.remove();

		currentBrand = brand;
		setBrandInUrl(brand);
		syncBrandTabs(brand);
		const finish = async () => {
			if (applyId !== brandApplyId) return;
			applyLogos(brand);
			try {
				const settings = await loadBrandSettings(brand);
				if (applyId !== brandApplyId) return;
				currentBrandSettings = settings;
				renderCardShowcase(settings);
				renderCalloutShowcase();
				renderBadgeShowcase();
				renderStampShowcase();
				renderBrandShowcase(settings);
				renderComponentSettings(settings);
				applySlidePretitleDefault(settings);
			} catch (error) {
				currentBrandSettings = null;
				renderCardShowcase();
				renderCalloutShowcase();
				renderBadgeShowcase();
				renderStampShowcase();
				renderComponentSettings();
				const root = document.getElementById("brand-showcase");
				if (root) {
					root.innerHTML = `<div class="showcase-h4" style="color:var(--color-negative-foreground-strong)">Failed to load brand settings</div>`;
				}
			}
			resolve();
		};

		if (!brand) {
			finish();
			return;
		}

		const link = document.createElement("link");
		link.id = BRAND_LINK_ID;
		link.rel = "stylesheet";
		link.href = `../../brands/${brand}/brand.css`;
		link.addEventListener("load", finish);
		link.addEventListener("error", finish);
		document.head.appendChild(link);
	});
}

function extractSlide(html) {
	const match = html.match(/<slide[\s\S]*?>[\s\S]*<\/slide>/i);
	return match ? match[0] : html;
}

async function loadPresets() {
	while (true) {
		const slots = document.querySelectorAll(
			"[data-preset][data-src]:not([data-loaded])",
		);
		if (!slots.length) break;

		await Promise.all(
			[...slots].map(async (slot) => {
				const src = slot.dataset.src;
				const type = slot.dataset.preset;
				let html;
				try {
					const res = await fetch(src);
					if (!res.ok) throw new Error(res.status);
					html = await res.text();
				} catch (e) {
					slot.insertAdjacentHTML(
						"beforeend",
						`<div class="showcase-h4" style="color:var(--color-negative-foreground-strong)">Failed to load ${src}</div>`,
					);
					slot.dataset.loaded = "true";
					slot.removeAttribute("data-src");
					slot.removeAttribute("data-preset");
					return;
				}

				if (type === "slide") {
					const slideHtml = extractSlide(html);
					slot.insertAdjacentHTML("beforeend", `<deck>${slideHtml}</deck>`);
					const slide = slot.querySelector("slide");
					if (slide && slot.dataset.colorTheme) {
						slide.setAttribute("color-theme", slot.dataset.colorTheme);
					}
					if (slide && slot.dataset.cardsColorTheme) {
						slide.querySelectorAll("card").forEach((card) => {
							card.setAttribute(
								"color-theme",
								slot.dataset.cardsColorTheme,
							);
						});
					}
				} else {
					slot.insertAdjacentHTML("beforeend", html);
				}

				slot.dataset.loaded = "true";
				slot.removeAttribute("data-src");
				slot.removeAttribute("data-preset");
			}),
		);
	}

	applyLogos(currentBrand);
	applySlidePretitleDefault(currentBrandSettings);
}

function initFilters() {
	const filterLinks = document.querySelectorAll(".showcase-filter a");
	const sections = document.querySelectorAll(".showcase-group[data-section]");
	const valid = [...sections].map((sec) => sec.dataset.section);

	function filterFromHash() {
		const hash = location.hash.replace(/^#/, "");
		const mapped = FILTER_ALIASES[hash] || hash;
		return valid.includes(mapped) ? mapped : "brand";
	}

	function applyFilter(active) {
		filterLinks.forEach((link) => {
			link.classList.toggle("is-active", link.dataset.filter === active);
		});
		let visible = null;
		sections.forEach((sec) => {
			const on = sec.dataset.section === active;
			sec.style.display = on ? "" : "none";
			if (on) visible = sec;
		});
		syncScrollThemeFromSection(visible);
	}

	window.addEventListener("hashchange", () => {
		applyFilter(filterFromHash());
		syncBrandTabs(currentBrand);
	});

	if (!location.hash) {
		history.replaceState(null, "", "#brand");
	} else {
		const hash = location.hash.replace(/^#/, "");
		const mapped = FILTER_ALIASES[hash];
		if (mapped) history.replaceState(null, "", `#${mapped}`);
	}

	applyFilter(filterFromHash());
}

mountShowcase();
initFilters();
initThemeSwitches();

if (brandSwitch) {
	brandSwitch.addEventListener("click", (event) => {
		const btn = event.target.closest("button[data-value]");
		if (!btn || !brandSwitch.contains(btn)) return;
		applyBrand(btn.dataset.value);
	});
}

applyBrand(currentBrand).then(() => loadPresets());

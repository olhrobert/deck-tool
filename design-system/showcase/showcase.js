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

function slideTitleSettings(brand) {
	return brand.components
		? pick(brand.components, ["slideTitle"])
		: null;
}

function coverTitleSettings(brand) {
	return brand.components
		? pick(brand.components, ["coverTitle"])
		: null;
}

function textSettings(brand) {
	const font = brand.foundations && brand.foundations.font;
	return font
		? pick(font, ["title", "heading", "stat", "text", "label"])
		: null;
}

function slideCanvasSettings(brand) {
	const slide = brand.components && brand.components.slide;
	return slide ? pick(slide, ["canvas", "surface"]) : null;
}

function componentSettings(key) {
	return (brand) =>
		brand.components ? pick(brand.components, [key]) : null;
}

const PAGE_GROUPS = [
	{
		heading: "Components",
		pages: [
			{ id: "brand", label: "Brand", width: "narrow", kind: "brand" },
			{
				id: "analyst",
				label: "Analyst",
				theme: true,
				demos: [
					{
						id: "analyst-showcase",
						caption: "components/analyst/analyst.html",
						className: "showcase-analyst",
					},
					{
						id: "analyst-showcase-sm",
						caption: 'size="sm"',
						className: "showcase-analyst-sm",
					},
				],
			},
			{
				id: "attribution-box",
				label: "Attribution box",
				theme: true,
				settings: componentSettings("attributionBox"),
				demos: [
					{
						id: "attribution-box-showcase",
						caption: "components/attribution-box/attribution-box.html",
					},
				],
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
				id: "media-card",
				label: "Media card",
				theme: true,
				demos: [
					{
						id: "media-card-showcase",
						caption: "components/media-card/media-card.html",
						className: "showcase-media-card",
					},
				],
			},
			{
				id: "content-container",
				label: "Content container",
				settings: componentSettings("contentContainer"),
				demos: [
					{
						id: "content-container-showcase",
						caption:
							"components/content-container/content-container.html",
					},
				],
			},
			{
				id: "cover-title",
				label: "Cover title",
				theme: true,
				settings: coverTitleSettings,
				demos: [
					{
						id: "cover-title-showcase",
						caption: "components/cover-title/cover-title.html",
						className: "showcase-matrix-stack",
					},
				],
			},
			{
				id: "divider",
				label: "Divider",
				theme: true,
				settings: componentSettings("divider"),
				demos: [
					{
						id: "divider-showcase",
						caption: "components/divider/divider.html",
					},
				],
			},
			{
				id: "footer-container",
				label: "Footer container",
				settings: componentSettings("footerContainer"),
				demos: [
					{
						id: "footer-container-showcase",
						caption:
							"components/footer-container/footer-container.html",
					},
				],
			},
			{
				id: "header-container",
				label: "Header container",
				settings: componentSettings("headerContainer"),
				demos: [
					{
						id: "header-container-showcase",
						caption:
							"components/header-container/header-container.html",
					},
				],
			},
			{
				id: "media-slot",
				label: "Media slot",
				demos: [
					{
						id: "media-slot-showcase",
						caption: "components/media-slot/media-slot.html",
					},
				],
			},
			{
				id: "slide",
				label: "Slide",
				settings: slideCanvasSettings,
				demos: [
					{
						id: "slide-showcase",
						caption: "components/slide/slide.html",
					},
				],
			},
			{
				id: "slide-footer",
				label: "Slide footer",
				theme: true,
				settings: (brand) =>
					brand.components && brand.components.slideFooter,
				demos: [
					{
						id: "slide-footer-showcase",
						caption: "components/slide-footer/slide-footer.html",
						className: "showcase-footer",
					},
				],
			},
			{
				id: "slide-title",
				label: "Slide title",
				theme: true,
				settings: slideTitleSettings,
				demos: [
					{
						id: "slide-title-showcase",
						caption:
							"components/slide-title/slide-title-group.html",
						className: "showcase-matrix-stack",
					},
				],
			},
			{
				id: "stack",
				label: "Stack",
				demos: [
					{
						id: "stack-showcase",
						caption: "components/stack/stack.html",
					},
				],
			},
			{
				id: "text",
				label: "Text",
				theme: true,
				settings: textSettings,
				demos: [
					{
						id: "text-showcase",
						caption: "components/typography/text.html",
						className: "showcase-matrix-stack",
					},
				],
			},
		],
	},
];

const SLIDE_PRESETS = [
	{
		id: "title-slide-01",
		label: "Title slide 01",
		src: "../../presets/title-slides/title-slide-01.html",
	},
	{
		id: "title-slide-02",
		label: "Title slide 02",
		src: "../../presets/title-slides/title-slide-02.html",
	},
	{
		id: "title-slide-03",
		label: "Title slide 03",
		src: "../../presets/title-slides/title-slide-03.html",
	},
	{
		id: "title-slide-04",
		label: "Title slide 04",
		src: "../../presets/title-slides/title-slide-04.html",
	},
	{
		id: "chapter-slide-01",
		label: "Chapter slide 01",
		src: "../../presets/chapter-slides/chapter-slide-01.html",
	},
	{
		id: "chapter-slide-02",
		label: "Chapter slide 02",
		src: "../../presets/chapter-slides/chapter-slide-02.html",
	},
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
		id: "content-slide-12-cards",
		label: "12 cards",
		src: "../../presets/content-slides/content-slide-12-cards.html",
		variants: [
			{},
			{ colorTheme: "dark", caption: 'color-theme="dark"' },
		],
	},
	{
		id: "content-slide-split-media",
		label: "Split media",
		src: "../../presets/content-slides/content-slide-split-media.html",
		variants: [
			{},
			{ colorTheme: "dark", caption: 'color-theme="dark"' },
		],
	},
	{
		id: "content-slide-text-and-image",
		label: "Text and image",
		src: "../../presets/content-slides/content-slide-text-and-image.html",
		variants: [
			{},
			{ colorTheme: "dark", caption: 'color-theme="dark"' },
		],
	},
	{
		id: "content-slide-service",
		label: "Service",
		src: "../../presets/content-slides/content-slide-service.html",
		variants: [
			{},
			{ colorTheme: "dark", caption: 'color-theme="dark"' },
		],
	},
	{
		id: "content-slide-steps-media",
		label: "Steps + media",
		src: "../../presets/content-slides/content-slide-steps-media.html",
		variants: [
			{},
			{ colorTheme: "dark", caption: 'color-theme="dark"' },
		],
	},
	{
		id: "gratia-fundraising",
		label: "Fundraising",
		brand: "gratia",
		src: "../../presets/brands/gratia/fundraising.html",
	},
	{
		id: "gratia-about",
		label: "About",
		brand: "gratia",
		src: "../../presets/brands/gratia/about.html",
	},
	{
		id: "gratia-services",
		label: "Services",
		brand: "gratia",
		src: "../../presets/brands/gratia/services.html",
	},
	{
		id: "gratia-contact",
		label: "Contact",
		brand: "gratia",
		src: "../../presets/brands/gratia/contact.html",
	},
];

const DECKS = [
	{
		id: "gratia-surge-team",
		label: "Gratia Surge Team",
		brand: "gratia",
		slides: [
			"../../decks/gratia-surge-team/01.html",
			"../../decks/gratia-surge-team/02.html",
		],
	},
	{
		id: "test",
		label: "Test",
		brand: "gratia",
		slides: [
			"../../decks/test/01.html",
			"../../decks/test/02.html",
			"../../decks/test/03.html",
			"../../decks/test/04.html",
		],
	},
];

const FILTER_ALIASES = {
	layout: "content-container",
	typography: "text",
	foundations: "brand",
	"content-slide-case-study": "content-slide-service",
	"content-slide-card-grid": "content-slide-12-cards",
	"content-slide-story": "content-slide-text-and-image",
	"content-slide-services": "gratia-services",
	"content-slide-contact": "gratia-contact",
	"close-slide-contact": "gratia-contact",
	"close-slides": "gratia-contact",
	"title-slides": "title-slide-01",
	"chapter-slides": "chapter-slide-01",
	"content-slides": "content-slide-3-cards",
	"gratia-slides": "gratia-fundraising",
	"slide-presets": "title-slide-01",
	decks: DECKS[0].id,
};

const SETTINGS = PAGE_GROUPS.flatMap((group) =>
	group.pages
		.filter((page) => page.settings)
		.map((page) => [page.id, page.settings]),
);

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

function demoBlock(demo) {
	const className = demo.className ? ` class="${demo.className}"` : "";
	return `<div class="showcase-subgroup">
		${captionHtml(demo.caption, demo.captionId)}
		<div${className} id="${demo.id}"></div>
	</div>`;
}

function renderPage(page) {
	const widthClass = page.width === "narrow" ? " showcase-group-narrow" : "";
	const themeAttr = page.theme ? ` color-theme="light"` : "";
	const parts = [];
	if (page.kind === "brand") parts.push('<div id="brand-showcase"></div>');
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

function renderPresetPage(preset) {
	const variants =
		preset.variants && preset.variants.length ? preset.variants : [{}];
	const decks = variants
		.map((variant) => renderPresetVariant(preset, variant))
		.join("");
	const brandAttr = preset.brand ? ` data-brand="${preset.brand}"` : "";
	return `<div class="showcase-group showcase-group-deck" data-section="${preset.id}"${brandAttr}>
		<header class="showcase-header">
			<text class="showcase-h1" tone="strong" context="slide">${escapeHtml(preset.label)}</text>
		</header>
		<div class="showcase-body">
			${decks}
		</div>
	</div>`;
}

function renderDeckPage(deck) {
	const slides = deck.slides
		.map((src) => renderPresetVariant({ src }))
		.join("");
	const brandAttr = deck.brand ? ` data-brand="${deck.brand}"` : "";
	return `<div class="showcase-group showcase-group-deck" data-section="${deck.id}"${brandAttr}>
		<header class="showcase-header">
			<text class="showcase-h1" tone="strong" context="slide">${escapeHtml(deck.label)}</text>
		</header>
		<div class="showcase-body">
			${slides}
		</div>
	</div>`;
}

function renderNavGroup(heading, items) {
	const links = items
		.map((item) => {
			const brandAttr = item.brand ? ` data-brand="${item.brand}"` : "";
			return `<a href="#${item.id}" data-filter="${item.id}"${brandAttr}>${escapeHtml(item.label)}</a>`;
		})
		.join("");
	return `<div class="showcase-filter-group">
		<button type="button" class="showcase-filter-heading" aria-expanded="true">
			<span>${escapeHtml(heading)}</span>
			<span class="showcase-filter-chevron" aria-hidden="true"></span>
		</button>
		<div class="showcase-filter-items">${links}</div>
	</div>`;
}

function mountShowcase() {
	const nav = document.querySelector(".showcase-filter");
	const pages = document.getElementById("showcase-pages");
	if (!nav || !pages) return;

	const navHtml = [
		...PAGE_GROUPS.map((group) => renderNavGroup(group.heading, group.pages)),
		renderNavGroup("Slide presets", SLIDE_PRESETS),
		renderNavGroup("Decks", DECKS),
	].join("");
	nav.insertAdjacentHTML("beforeend", navHtml);

	const pageHtml = [
		...PAGE_GROUPS.flatMap((group) => group.pages.map(renderPage)),
		...SLIDE_PRESETS.map((preset) => renderPresetPage(preset)),
		...DECKS.map((deck) => renderDeckPage(deck)),
	].join("");
	pages.innerHTML = pageHtml;
}

function fillDemo(id, html) {
	const root = document.getElementById(id);
	if (root) root.innerHTML = html;
}

function renderTextShowcase() {
	fillDemo(
		"text-showcase",
		`
		<text family="title" size="1000" tone="strong" context="slide">Text title</text>
		<text family="heading" size="500" tone="strong" context="slide">Text heading</text>
		<text family="stat" size="1000" tone="strong" context="slide">00</text>
		<text size="400" tone="base" context="slide">Text 400</text>
		<text family="label" size="300" tone="subtle" context="slide">Text label</text>
		<text family="display" size="400" tone="strong" context="slide">Text display</text>
		`,
	);
}

function renderShowcaseAnalyst(size) {
	const sizeAttr = size === "sm" ? ' size="sm"' : "";
	const logoSize = size === "sm" ? "7" : "10";
	return `
		<analyst${sizeAttr}>
			<stack data-slot="cover" width="fill">
				<media-slot data-slot="image" width="fill" padding="none" border="false" radius="none" class="aspect-square">
					<text size="200" tone="subtle" context="slide">Photo</text>
				</media-slot>
				<badge data-slot="specialization" variant="emphasis" border="false">
					<badge-icon data-slot="leading" icon="star-fill" aria-hidden="true"></badge-icon>
					<badge-text data-slot="label" tone="strong" context="surface">Specialization</badge-text>
				</badge>
			</stack>
			<stack data-slot="body" direction="col" gap="2-5" width="fill">
				<stack direction="row" gap="4" width="fill" class="items-center">
					<stack direction="col" gap="0" width="fill">
						<text data-slot="name" family="heading" size="400" tone="strong" context="surface">Name</text>
						<text data-slot="role" size="300" tone="base" context="surface">Role</text>
					</stack>
					<media-slot data-slot="logo" size="${logoSize}" padding="none">
						<text size="200" tone="subtle" context="slide">Logo</text>
					</media-slot>
				</stack>
				<stack data-slot="location-row" direction="row" gap="1-5" width="fill" class="items-center">
					<badge-icon data-slot="location-icon" icon="earth-fill" aria-hidden="true"></badge-icon>
					<text data-slot="location" size="300" tone="subtle" context="surface">Location</text>
				</stack>
				<stack data-slot="tags" direction="row" gap="2" wrap="true">
					<badge variant="neutral" border="false"><badge-text data-slot="tag" tone="strong" context="surface">Tag</badge-text></badge>
					<badge variant="neutral" border="false"><badge-text data-slot="tag" tone="strong" context="surface">Tag</badge-text></badge>
					<badge variant="neutral" border="false"><badge-text data-slot="tag" tone="strong" context="surface">Tag</badge-text></badge>
					<badge variant="neutral" border="false"><badge-text data-slot="tag" tone="strong" context="surface">Tag</badge-text></badge>
				</stack>
			</stack>
		</analyst>
	`;
}

function renderAnalystShowcase() {
	fillDemo("analyst-showcase", renderShowcaseAnalyst("lg"));
	fillDemo("analyst-showcase-sm", renderShowcaseAnalyst("sm"));
}

function renderCoverTitleShowcase() {
	fillDemo(
		"cover-title-showcase",
		["xl", "lg", "md", "sm"]
			.map(
				(size) =>
					`<cover-title size="${size}" tone="strong" context="slide">Cover title ${size}</cover-title>`,
			)
			.join(""),
	);
}

function renderSlideTitleGroup(size, align) {
	const alignAttr = align ? ` align="${align}"` : "";
	return `
		<slide-title-group${alignAttr}>
			<slide-pretitle data-slot="pre" tone="subtle" context="slide">Pre-title</slide-pretitle>
			<slide-title data-slot="main" size="${size}" tone="strong" context="slide">Slide title</slide-title>
			<slide-subtitle data-slot="sub" tone="base" context="slide">Slide subtitle</slide-subtitle>
		</slide-title-group>
	`;
}

function renderSlideTitleShowcase() {
	fillDemo(
		"slide-title-showcase",
		[
			renderSlideTitleGroup("lg"),
			renderSlideTitleGroup("md"),
			renderSlideTitleGroup("sm"),
			renderSlideTitleGroup("md", "center"),
			`<slide-title size="lg" tone="strong" context="slide">Slide title lg</slide-title>`,
			`<slide-title size="md" tone="strong" context="slide">Slide title md</slide-title>`,
			`<slide-title size="sm" tone="strong" context="slide">Slide title sm</slide-title>`,
			`<slide-pretitle tone="subtle" context="slide">Slide pretitle</slide-pretitle>`,
			`<slide-subtitle tone="base" context="slide">Slide subtitle</slide-subtitle>`,
		].join(""),
	);
}

function renderStaticShowcases() {
	fillDemo(
		"attribution-box-showcase",
		`
		<attribution-box variant="title">
			<text data-slot="credit" size="300" tone="base" context="surface">Sanitized excerpt prepared by</text>
			<img data-slot="logo" src="../../assets/logos/gratia-logo.svg" alt="Gratia" />
		</attribution-box>
		`,
	);
	fillDemo(
		"media-card-showcase",
		`
		<media-card variant="neutral">
			<media-slot data-slot="image" width="fill" padding="none" border="false" radius="none">
				<text size="200" tone="subtle" context="slide">Media</text>
			</media-slot>
			<stack data-slot="body" gap="2" width="fill">
				<card-pretitle data-slot="pretitle" tone="subtle" context="surface">Label</card-pretitle>
				<card-title data-slot="title" tone="strong" context="surface">Value</card-title>
				<text data-slot="text" size="350" tone="base" context="surface">Optional body text</text>
			</stack>
			<divider></divider>
			<stack data-slot="footer" gap="0" width="fill">
				<card-meta data-slot="meta" tone="subtle" context="surface">Optional supporting detail</card-meta>
			</stack>
		</media-card>
		`,
	);
	fillDemo(
		"content-container-showcase",
		`<slide><content-container><media-slot width="fill" height="fill"></media-slot></content-container></slide>`,
	);
	fillDemo("divider-showcase", `<divider></divider>`);
	fillDemo(
		"footer-container-showcase",
		`<footer-container><media-slot width="fill"></media-slot></footer-container>`,
	);
	fillDemo(
		"header-container-showcase",
		`<header-container><media-slot width="fill"></media-slot></header-container>`,
	);
	fillDemo("media-slot-showcase", `<media-slot></media-slot>`);
	fillDemo(
		"slide-showcase",
		`
		<slide>
			<header-container><media-slot width="fill"></media-slot></header-container>
			<content-container><media-slot width="fill" height="fill"></media-slot></content-container>
			<footer-container><media-slot width="fill"></media-slot></footer-container>
		</slide>
		`,
	);
	fillDemo(
		"slide-footer-showcase",
		`
		<slide-footer>
			<img data-slot="logo" data-logo src="../../assets/logos/placeholder-logo.svg" alt="Logo" class="shrink-0 block" />
			<slide-footer-notes data-slot="notes" tone="subtle">Add notes or sources here.</slide-footer-notes>
			<slide-footer-meta>
				<slide-footer-title data-slot="deck-title" tone="subtle">Deck title</slide-footer-title>
				<slide-footer-chapter data-slot="chapter" tone="subtle">Chapter</slide-footer-chapter>
				<slide-footer-page data-slot="page" tone="subtle">01</slide-footer-page>
			</slide-footer-meta>
		</slide-footer>
		`,
	);
	fillDemo(
		"stack-showcase",
		`
		<stack direction="row" gap="3" width="fill">
			<media-slot width="fill"><text context="slide" tone="base">Media</text></media-slot>
			<media-slot width="fill"><text context="slide" tone="base">Media</text></media-slot>
			<media-slot width="fill"><text context="slide" tone="base">Media</text></media-slot>
		</stack>
		`,
	);
}

function renderComponentDemos(settings = currentBrandSettings) {
	renderTextShowcase();
	renderAnalystShowcase();
	renderCoverTitleShowcase();
	renderSlideTitleShowcase();
	renderStaticShowcases();
	renderCardShowcase(settings);
	renderCalloutShowcase();
	renderBadgeShowcase();
	renderStampShowcase();
}

function renderShowcaseCard(variant) {
	return `
		<card variant="${variant}" padding="md">
			<card-pretitle data-slot="pretitle" tone="subtle" context="surface">Optional pretitle</card-pretitle>
			<card-title data-slot="title" tone="strong" context="surface">The title of this card</card-title>
			<text data-slot="text" size="350" tone="base" context="surface">Description copy of this card. Can be several sentences long.</text>
			<card-meta data-slot="meta" tone="subtle" context="surface">Supporting detail.</card-meta>
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
			`<div class="showcase-matrix-stack">${renderShowcaseCard(variant)}</div>`,
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
				<text data-slot="text" size="350" tone="base" context="surface">Stamp at the top of the card.</text>
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
				<text size="400" tone="base" context="slide">${label}</text>
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
		? `<stack class="brand-settings-value-swatch" direction="row" gap="2">
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
		settings.components.slideTitle &&
		settings.components.slideTitle.pretitle &&
		settings.components.slideTitle.pretitle.default;
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
		syncBrandPresetNav(brand);
		const finish = async () => {
			if (applyId !== brandApplyId) return;
			try {
				const settings = await loadBrandSettings(brand);
				if (applyId !== brandApplyId) return;
				currentBrandSettings = settings;
				renderComponentDemos(settings);
				renderBrandShowcase(settings);
				renderComponentSettings(settings);
				applyLogos(brand);
				applySlidePretitleDefault(settings);
			} catch (error) {
				currentBrandSettings = null;
				renderComponentDemos();
				renderComponentSettings();
				applyLogos(brand);
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

let applyShowcaseFilter = () => {};

function initFilters() {
	const filterLinks = document.querySelectorAll(".showcase-filter a");
	const sections = document.querySelectorAll(".showcase-group[data-section]");

	function sectionAllowed(sec, brand = currentBrand) {
		return !sec.dataset.brand || sec.dataset.brand === brand;
	}

	function filterFromHash() {
		const hash = location.hash.replace(/^#/, "");
		const mapped = FILTER_ALIASES[hash] || hash;
		const section = [...sections].find((sec) => sec.dataset.section === mapped);
		return section && sectionAllowed(section) ? mapped : "brand";
	}

	function expandGroupFor(active) {
		const link = document.querySelector(
			`.showcase-filter a[data-filter="${active}"]`,
		);
		const group = link && link.closest(".showcase-filter-group");
		if (!group) return;
		group.classList.remove("is-collapsed");
		const heading = group.querySelector(".showcase-filter-heading");
		if (heading) heading.setAttribute("aria-expanded", "true");
	}

	function applyFilter(active) {
		expandGroupFor(active);
		filterLinks.forEach((link) => {
			link.classList.toggle("is-active", link.dataset.filter === active);
		});
		let visible = null;
		sections.forEach((sec) => {
			const on = sec.dataset.section === active && sectionAllowed(sec);
			sec.style.display = on ? "" : "none";
			if (on) visible = sec;
		});
		syncScrollThemeFromSection(visible);
	}

	applyShowcaseFilter = () => applyFilter(filterFromHash());

	document.querySelector(".showcase-filter")?.addEventListener("click", (event) => {
		const heading = event.target.closest(".showcase-filter-heading");
		if (!heading) return;
		const group = heading.closest(".showcase-filter-group");
		if (!group) return;
		const collapsed = group.classList.toggle("is-collapsed");
		heading.setAttribute("aria-expanded", collapsed ? "false" : "true");
	});

	window.addEventListener("hashchange", () => {
		applyShowcaseFilter();
		syncBrandTabs(currentBrand);
	});

	if (!location.hash) {
		history.replaceState(null, "", "#brand");
	} else {
		const hash = location.hash.replace(/^#/, "");
		const mapped = FILTER_ALIASES[hash];
		if (mapped) history.replaceState(null, "", `#${mapped}`);
	}

	syncBrandPresetNav(currentBrand);
}

function syncBrandPresetNav(brand) {
	document
		.querySelectorAll(".showcase-filter a[data-brand]")
		.forEach((link) => {
			link.hidden = link.dataset.brand !== brand;
		});
	document.querySelectorAll(".showcase-filter-group").forEach((group) => {
		const links = [...group.querySelectorAll("a")];
		group.hidden = links.length > 0 && links.every((link) => link.hidden);
	});
	const hash = location.hash.replace(/^#/, "");
	const mapped = FILTER_ALIASES[hash] || hash;
	const section = document.querySelector(
		`.showcase-group[data-section="${mapped}"]`,
	);
	if (section && section.dataset.brand && section.dataset.brand !== brand) {
		history.replaceState(null, "", `#brand`);
	}
	applyShowcaseFilter();
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

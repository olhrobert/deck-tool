#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { generateBrandCss, BRAND_FILENAME } = require("./generate-brand-css.js");

const ROOT = path.join(__dirname, "..");
const TEMPLATE_PATH = path.join(ROOT, "viewer", "deck.html");
const BRANDS_DIR = path.join(ROOT, "brands");
const OUTPUT_FILENAME = "index.html";
const MANIFEST_FILENAME = "slides.json";
const EXCLUDED_HTML = new Set([OUTPUT_FILENAME]);
const SLIDE_PATTERN = /<slide(?:\s[^>]*)?>[\s\S]*?<\/slide>/gi;
const SLIDE_MARKER = /<slide(?:\s[^>]*)?>/i;

function usage() {
	console.error("Usage: node scripts/compile-deck.js <deck-directory>");
	console.error("Example: node scripts/compile-deck.js decks/riverton-project-charter");
	process.exit(1);
}

function isSlideHtml(html) {
	return SLIDE_MARKER.test(html);
}

function discoverSlideFiles(deckDir) {
	return fs
		.readdirSync(deckDir)
		.filter((filename) => {
			if (!filename.endsWith(".html")) return false;
			if (EXCLUDED_HTML.has(filename)) return false;
			const html = fs.readFileSync(path.join(deckDir, filename), "utf8");
			return isSlideHtml(html);
		})
		.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function syncManifest(deckDir) {
	const resolvedDeckDir = path.resolve(deckDir);
	const manifestPath = path.join(resolvedDeckDir, MANIFEST_FILENAME);
	const discoveredSlides = discoverSlideFiles(resolvedDeckDir);

	if (discoveredSlides.length === 0) {
		throw new Error(`No slide HTML files found in ${resolvedDeckDir}`);
	}

	let manifest = {
		title: path.basename(resolvedDeckDir),
		slides: discoveredSlides,
	};

	if (fs.existsSync(manifestPath)) {
		const existing = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
		manifest = {
			title: existing.title || manifest.title,
			...(existing.brand ? { brand: existing.brand } : {}),
			slides: discoveredSlides,
		};
	}

	const manifestBody = `${JSON.stringify(manifest, null, "\t")}\n`;
	const previousBody = fs.existsSync(manifestPath)
		? fs.readFileSync(manifestPath, "utf8")
		: null;

	fs.writeFileSync(manifestPath, manifestBody, "utf8");

	if (previousBody !== manifestBody) {
		console.log(`Updated ${manifestPath}`);
	}

	return manifest;
}

function extractSlides(html, sourceFile) {
	const matches = [...html.matchAll(SLIDE_PATTERN)];
	if (matches.length === 0) {
		throw new Error(`No <slide> found in ${sourceFile}`);
	}
	if (matches.length > 1) {
		throw new Error(`Multiple <slide> elements in ${sourceFile}`);
	}
	return matches[0][0];
}

function indentSlide(slideHtml) {
	return slideHtml
		.split("\n")
		.map((line) => (line.trim() === "" ? "" : `\t\t\t${line}`))
		.join("\n");
}

function resolveBrandStylesheet(brandName) {
	if (!brandName) return "";

	const brandDir = path.join(BRANDS_DIR, brandName);
	if (!fs.existsSync(path.join(brandDir, BRAND_FILENAME))) {
		throw new Error(
			`Deck references brand "${brandName}" but brands/${brandName}/${BRAND_FILENAME} was not found`,
		);
	}

	// Regenerate brand.css from brand-settings.json so the compiled deck always reflects
	// the current brand definition.
	generateBrandCss(brandDir);

	return [
		"<link",
		'\t\t\trel="stylesheet"',
		`\t\t\thref="../../brands/${brandName}/brand.css"`,
		"\t\t/>",
	].join("\n");
}

function compileDeck(deckDir, { sync = true } = {}) {
	const resolvedDeckDir = path.resolve(deckDir);
	const manifest = sync ? syncManifest(resolvedDeckDir) : readManifest(resolvedDeckDir);
	const slideFiles = manifest.slides;

	if (!Array.isArray(slideFiles) || slideFiles.length === 0) {
		throw new Error("slides.json must include a non-empty \"slides\" array");
	}

	const deckTitle = manifest.title || "Deck";
	const brandStylesheet = resolveBrandStylesheet(manifest.brand);
	const template = fs.readFileSync(TEMPLATE_PATH, "utf8");

	const slides = slideFiles.map((filename) => {
		const slidePath = path.join(resolvedDeckDir, filename);
		if (!fs.existsSync(slidePath)) {
			throw new Error(`Slide file not found: ${slidePath}`);
		}
		const html = fs.readFileSync(slidePath, "utf8");
		return indentSlide(extractSlides(html, filename));
	});

	const output = template
		.replace("{{deckTitle}}", deckTitle)
		.replace("{{brandStylesheet}}", brandStylesheet)
		.replace("{{slides}}", slides.join("\n"));

	const outputPath = path.join(resolvedDeckDir, OUTPUT_FILENAME);
	fs.writeFileSync(outputPath, output, "utf8");

	console.log(`Compiled ${slideFiles.length} slides → ${outputPath}`);
}

function readManifest(deckDir) {
	const manifestPath = path.join(path.resolve(deckDir), MANIFEST_FILENAME);
	if (!fs.existsSync(manifestPath)) {
		throw new Error(`Missing ${MANIFEST_FILENAME} in ${deckDir}`);
	}
	return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

module.exports = {
	ROOT,
	compileDeck,
	discoverSlideFiles,
	syncManifest,
};

if (require.main === module) {
	const deckArg = process.argv[2];
	if (!deckArg) {
		usage();
	}

	try {
		compileDeck(deckArg);
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
}

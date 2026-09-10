#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const ICONS_DIR = path.join(ROOT, "assets", "icons");
const OUTPUT_PATH = path.join(
	ROOT,
	"design-system",
	"components",
	"badge",
	"badge-icons.css",
);

function iconName(filename) {
	return filename.replace(/\.svg$/i, "");
}

function generateIconCss() {
	if (!fs.existsSync(ICONS_DIR)) {
		throw new Error(`Missing icons directory ${ICONS_DIR}`);
	}

	const files = fs
		.readdirSync(ICONS_DIR)
		.filter((name) => /^[a-z0-9-]+\.svg$/i.test(name))
		.sort();

	if (files.length === 0) {
		throw new Error(`No SVG icons in ${ICONS_DIR}`);
	}

	const rules = files.map((filename) => {
		const name = iconName(filename);
		return `:is(badge-icon, stamp-icon)[icon="${name}"] { --_icon: url("../../../assets/icons/${filename}"); }`;
	});

	return [
		`/* AUTO-GENERATED from assets/icons — do not edit by hand. */`,
		`/* Regenerate: npm run generate-icons */`,
		``,
		...rules,
		``,
	].join("\n");
}

function writeIconCss() {
	const css = generateIconCss();
	const previous = fs.existsSync(OUTPUT_PATH)
		? fs.readFileSync(OUTPUT_PATH, "utf8")
		: null;
	fs.writeFileSync(OUTPUT_PATH, css, "utf8");
	return { outputPath: OUTPUT_PATH, changed: previous !== css };
}

function main() {
	const { outputPath, changed } = writeIconCss();
	console.log(`${changed ? "Generated" : "Unchanged"} ${outputPath}`);
}

module.exports = { generateIconCss, writeIconCss };

if (require.main === module) {
	try {
		main();
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
}

#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const { loadBrand } = require("./lib/brand.js");
const { buildAllCollections } = require("./lib/tokens.js");
const { generatePlugin } = require("./generate-plugin.js");

const DEFAULT_BRAND = "brands/gratia";
const OUT_PATH = path.join(__dirname, "variables.json");

function usage() {
	console.error("Usage: node scripts/figma/sync-brand-variables.js [brand-directory]");
	console.error("Default brand-directory: brands/gratia");
	process.exit(1);
}

function main() {
	const arg = process.argv[2];
	if (arg === "--help" || arg === "-h") usage();
	const brandDir = arg || DEFAULT_BRAND;
	const { slug, settings } = loadBrand(brandDir);
	const payload = {
		brand: slug,
		...buildAllCollections(settings),
	};
	fs.writeFileSync(OUT_PATH, `${JSON.stringify(payload, null, "\t")}\n`);
	generatePlugin();
	const root = path.join(__dirname, "..", "..");
	const counts = payload.collections.map(
		(collection) => `${collection.name} ${collection.variables.length}`,
	);
	console.log(`Wrote ${path.relative(root, OUT_PATH)}`);
	console.log(counts.join(", "));
	console.log("Updated scripts/figma/plugin/code.js");
}

try {
	main();
} catch (error) {
	console.error(error.message);
	process.exit(1);
}

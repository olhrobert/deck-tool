#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { generateBrandCss } = require("./generate-brand-css.js");

const ROOT = path.join(__dirname, "..");
const BRANDS_DIR = path.join(ROOT, "brands");
const TEMPLATE_JSON = path.join(BRANDS_DIR, "riverton", "brand.json");
const PLACEHOLDER_LOGO = path.join(ROOT, "assets", "logos", "placeholder-logo.svg");

function usage() {
	console.error("Usage: node scripts/new-brand.js <slug> [--name \"Display Name\"]");
	console.error("Example: node scripts/new-brand.js acme --name \"Acme Capital\"");
	process.exit(1);
}

function titleCaseSlug(slug) {
	return slug
		.split(/[-_]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function parseArgs(argv) {
	const args = { slug: null, name: null };
	for (let i = 0; i < argv.length; i += 1) {
		if (argv[i] === "--name") {
			args.name = argv[i + 1];
			i += 1;
			continue;
		}
		if (!args.slug) args.slug = argv[i];
	}
	return args;
}

function main() {
	const { slug, name } = parseArgs(process.argv.slice(2));
	if (!slug || !/^[a-z][a-z0-9-]*$/.test(slug)) {
		usage();
	}

	const destDir = path.join(BRANDS_DIR, slug);
	if (fs.existsSync(destDir)) {
		throw new Error(`brands/${slug} already exists`);
	}

	const template = JSON.parse(fs.readFileSync(TEMPLATE_JSON, "utf8"));
	template.name = name || titleCaseSlug(slug);
	template.logo = "logo.svg";

	fs.mkdirSync(destDir, { recursive: true });
	fs.writeFileSync(
		path.join(destDir, "brand.json"),
		`${JSON.stringify(template, null, "\t")}\n`,
		"utf8",
	);
	fs.copyFileSync(PLACEHOLDER_LOGO, path.join(destDir, "logo.svg"));
	generateBrandCss(destDir);

	console.log(`Created brands/${slug}/`);
	console.log("Next:");
	console.log(`  1. Edit brands/${slug}/brand.json (colors, fonts, radii).`);
	console.log(`  2. Replace brands/${slug}/logo.svg with a currentColor sprite.`);
	console.log(`  3. node scripts/validate-brand.js brands/${slug}`);
	console.log("  4. Add a Primitives mode in Figma and a __Logo component (skill: new-brand).");
}

if (require.main === module) {
	try {
		main();
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
}

module.exports = { parseArgs };

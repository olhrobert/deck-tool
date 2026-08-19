#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { generateBrandCss, BRAND_FILENAME } = require("./generate-brand-css.js");

const ROOT = path.join(__dirname, "..");
const BRANDS_DIR = path.join(ROOT, "brands");

function listBrandDirectories() {
	return fs
		.readdirSync(BRANDS_DIR, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => path.join(BRANDS_DIR, entry.name))
		.filter((brandDir) => fs.existsSync(path.join(brandDir, BRAND_FILENAME)))
		.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function generateAllBrands() {
	if (!fs.existsSync(BRANDS_DIR)) {
		throw new Error(`Brands directory not found: ${BRANDS_DIR}`);
	}

	const brandDirs = listBrandDirectories();

	if (brandDirs.length === 0) {
		console.log(`No brands with ${BRAND_FILENAME} found.`);
		return;
	}

	let failed = 0;

	for (const brandDir of brandDirs) {
		const slug = path.basename(brandDir);
		try {
			const { outputPath, changed } = generateBrandCss(brandDir);
			const rel = path.relative(ROOT, outputPath);
			console.log(`${slug}: ${changed ? "updated" : "unchanged"} ${rel}`);
		} catch (error) {
			failed += 1;
			console.error(`${slug}: Failed: ${error.message}`);
		}
	}

	console.log(
		`\nDone. ${brandDirs.length - failed}/${brandDirs.length} brand(s) generated.`,
	);

	if (failed > 0) {
		process.exit(1);
	}
}

if (require.main === module) {
	try {
		generateAllBrands();
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
}

module.exports = { generateAllBrands, listBrandDirectories };

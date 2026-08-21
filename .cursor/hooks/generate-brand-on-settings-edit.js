#!/usr/bin/env node

/**
 * Cursor hook: after Agent/Tab edits brands/<slug>/brand-settings.json,
 * regenerate that brand's brand.css.
 *
 * Fail-open: errors exit 0 so edits are never blocked.
 */

const path = require("path");
const {
	generateBrandCss,
	BRAND_FILENAME,
} = require("../../scripts/generate-brand-css.js");

async function readStdin() {
	const chunks = [];
	for await (const chunk of process.stdin) {
		chunks.push(chunk);
	}
	return Buffer.concat(chunks).toString("utf8");
}

function isBrandSettingsPath(filePath) {
	if (!filePath || path.basename(filePath) !== BRAND_FILENAME) {
		return false;
	}
	const brandDir = path.dirname(filePath);
	const brandsDir = path.dirname(brandDir);
	return path.basename(brandsDir) === "brands";
}

async function main() {
	const raw = await readStdin();
	if (!raw.trim()) {
		process.exit(0);
	}

	const payload = JSON.parse(raw);
	const filePath = payload.file_path;
	if (!isBrandSettingsPath(filePath)) {
		process.exit(0);
	}

	const brandDir = path.dirname(filePath);
	const { outputPath, changed } = generateBrandCss(brandDir);
	const label = changed ? "Generated" : "Unchanged";
	console.error(`${label} ${outputPath}`);
}

main().catch((error) => {
	console.error(error.message || error);
	process.exit(0);
});

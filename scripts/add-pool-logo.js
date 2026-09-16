#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const POOL_DIR = path.join(ROOT, "assets", "logos", "pool");
const DATA_URL = "https://cdn.jsdelivr.net/npm/simple-icons/data/simple-icons.json";
const USER_AGENT = "DeckTool/1.0 (logo pool; Wikimedia Commons / Simple Icons)";
const svgUrl = (slug) =>
	`https://cdn.jsdelivr.net/npm/simple-icons/icons/${encodeURIComponent(slug)}.svg`;

const SEED = [
	{
		slug: "apollo",
		url: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Apollo_Global_Management_logo.svg",
		commons: "File:Apollo Global Management logo.svg",
	},
	{
		slug: "bain",
		url: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Bain_%26_Company_logo.svg",
		commons: "File:Bain & Company logo.svg",
	},
	{
		slug: "bcg",
		url: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Boston_Consulting_Group_2020_logo.svg",
		commons: "File:Boston Consulting Group 2020 logo.svg",
	},
	{
		slug: "better",
		url: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Better.com_logo_%282026%29.svg",
		commons: "File:Better.com logo (2026).svg",
	},
	{
		slug: "deloitte",
		url: "https://upload.wikimedia.org/wikipedia/commons/e/ed/Logo_of_Deloitte.svg",
		commons: "File:Logo of Deloitte.svg",
	},
	{
		slug: "ey",
		url: "https://upload.wikimedia.org/wikipedia/commons/3/34/EY_logo_2019.svg",
		commons: "File:EY logo 2019.svg",
	},
	{
		slug: "goldmansachs",
		url: "https://upload.wikimedia.org/wikipedia/commons/1/1d/Goldman_Sachs_logo.svg",
		commons: "File:Goldman Sachs logo.svg",
	},
	{
		slug: "hertz",
		url: "https://upload.wikimedia.org/wikipedia/commons/4/43/The_Hertz_Corporation_logo.svg",
		commons: "File:The Hertz Corporation logo.svg",
	},
	{
		slug: "thoughtworks",
		url: "https://upload.wikimedia.org/wikipedia/commons/f/f6/Thoughtworks_logo.png",
		commons: "File:Thoughtworks logo.png",
		binary: true,
		ext: "png",
	},
	{
		slug: "toptal",
		url: "https://upload.wikimedia.org/wikipedia/commons/2/20/Toptal_Logo.svg",
		commons: "File:Toptal Logo.svg",
		license: "CC BY-SA 4.0",
	},
	{
		slug: "wework",
		url: "https://upload.wikimedia.org/wikipedia/commons/2/26/WeWork.svg",
		commons: "File:WeWork.svg",
	},
];

function usage(exitCode = 1) {
	console.error(`Usage:
  node scripts/add-pool-logo.js --seed
  node scripts/add-pool-logo.js <slug> [<slug>...]
  node scripts/add-pool-logo.js --file <path.svg> <slug>

--seed writes the deck pool from Wikimedia Commons.
Other slugs pull Simple Icons when they exist.
Do not scrape Brandfetch. Drop official lockups with --file.`);
	process.exit(exitCode);
}

function parseArgs(argv) {
	const args = { seed: false, force: false, file: null, slugs: [] };
	for (let i = 0; i < argv.length; i += 1) {
		const token = argv[i];
		if (token === "--help" || token === "-h") usage(0);
		if (token === "--seed") {
			args.seed = true;
			continue;
		}
		if (token === "--force") {
			args.force = true;
			continue;
		}
		if (token === "--file") {
			args.file = argv[i + 1];
			i += 1;
			continue;
		}
		if (token.startsWith("-")) {
			console.error(`Unknown flag ${token}`);
			usage();
		}
		args.slugs.push(token);
	}
	return args;
}

function isSlug(value) {
	return /^[a-z][a-z0-9]*$/.test(value);
}

async function fetchResponse(url) {
	const response = await fetch(url, { headers: { "user-agent": USER_AGENT } });
	if (!response.ok) {
		throw new Error(`${response.status} ${response.statusText} for ${url}`);
	}
	return response;
}

async function fetchText(url) {
	return (await fetchResponse(url)).text();
}

async function fetchBuffer(url) {
	return Buffer.from(await (await fetchResponse(url)).arrayBuffer());
}

function withTrailingNewline(svg) {
	return svg.endsWith("\n") ? svg : `${svg}\n`;
}

function ensureViewBox(svg) {
	if (/\bviewBox=/i.test(svg)) return svg;
	const width = svg.match(/\bwidth="([\d.]+)(?:px)?"/i);
	const height = svg.match(/\bheight="([\d.]+)(?:px)?"/i);
	if (!width || !height) return svg;
	return svg.replace(/<svg\b/i, `<svg viewBox="0 0 ${width[1]} ${height[1]}"`);
}

function bakeCurrentColor(svg, color) {
	return svg.replace(/currentColor/g, color);
}

function applyFill(svg, fill) {
	const color = fill.startsWith("#") ? fill : `#${fill}`;
	let out = svg.trim();
	out = out.replace(/\sfill="(?!none)[^"]*"/gi, "");
	out = out.replace(/<svg\b([^>]*)>/i, (_, attrs) => {
		const cleaned = String(attrs).replace(/\sfill="[^"]*"/gi, "");
		return `<svg${cleaned} fill="${color}">`;
	});
	out = out.replace(/<path\b([^>]*)>/gi, (match, attrs) => {
		if (/\bfill=/i.test(attrs)) return match;
		return `<path fill="${color}"${attrs}>`;
	});
	return withTrailingNewline(out);
}

function invertSvg(svg) {
	let out = bakeCurrentColor(svg, "#FFFFFF");
	out = out.replace(/fill="(?!none)[^"]+"/gi, 'fill="#FFFFFF"');
	out = out.replace(/fill:\s*#[0-9a-fA-F]{3,8}/g, "fill:#FFFFFF");
	out = out.replace(/\bfill="black"/gi, 'fill="#FFFFFF"');
	return withTrailingNewline(out.trim());
}

function sourceComment(entry) {
	const license = entry.license ? `; ${entry.license}` : "";
	const page = entry.commons.replace(/ /g, "_");
	return `<!-- Source: https://commons.wikimedia.org/wiki/${page}${license} -->\n`;
}

function prepareOfficialSvg(svg, entry) {
	let out = ensureViewBox(svg.trim());
	out = bakeCurrentColor(out, "#000000");
	const comment = sourceComment(entry).trimEnd();
	if (out.includes("Source:")) return withTrailingNewline(out);
	if (out.startsWith("<?xml")) {
		out = out.replace(/^(<\?xml[^?]*\?>\s*)/, `$1${comment}\n`);
	} else {
		out = `${comment}\n${out}`;
	}
	return withTrailingNewline(out);
}

function writePair(slug, svg, fill, force, recolorDefault = true) {
	fs.mkdirSync(POOL_DIR, { recursive: true });
	const defaultPath = path.join(POOL_DIR, `${slug}.svg`);
	const invertedPath = path.join(POOL_DIR, `${slug}-inverted.svg`);
	if (!force && fs.existsSync(defaultPath)) {
		console.log(`Skip ${slug} (exists)`);
		return { slug, skipped: true };
	}
	const defaultSvg = recolorDefault
		? applyFill(svg, fill)
		: withTrailingNewline(ensureViewBox(bakeCurrentColor(svg.trim(), "#000000")));
	fs.writeFileSync(defaultPath, defaultSvg, "utf8");
	fs.writeFileSync(
		invertedPath,
		recolorDefault ? applyFill(svg, "#FFFFFF") : invertSvg(svg),
		"utf8",
	);
	console.log(`Wrote ${path.relative(ROOT, defaultPath)} (+ inverted)`);
	return { slug, skipped: false };
}

function writeOfficialPair(entry, svg, force) {
	fs.mkdirSync(POOL_DIR, { recursive: true });
	const defaultPath = path.join(POOL_DIR, `${entry.slug}.svg`);
	const invertedPath = path.join(POOL_DIR, `${entry.slug}-inverted.svg`);
	if (!force && fs.existsSync(defaultPath)) {
		console.log(`Skip ${entry.slug} (exists)`);
		return;
	}
	const prepared = prepareOfficialSvg(svg, entry);
	fs.writeFileSync(defaultPath, prepared, "utf8");
	fs.writeFileSync(invertedPath, invertSvg(prepared), "utf8");
	console.log(`Wrote ${path.relative(ROOT, defaultPath)} (+ inverted)`);
}

function writeBinary(entry, buffer, force) {
	fs.mkdirSync(POOL_DIR, { recursive: true });
	const ext = entry.ext || "png";
	const filePath = path.join(POOL_DIR, `${entry.slug}.${ext}`);
	if (!force && fs.existsSync(filePath)) {
		console.log(`Skip ${entry.slug} (exists)`);
		return;
	}
	fs.writeFileSync(filePath, buffer);
	console.log(`Wrote ${path.relative(ROOT, filePath)}`);
}

function suggest(query, icons) {
	const q = query.toLowerCase();
	return icons
		.filter(
			(icon) =>
				icon.slug.includes(q) || icon.title.toLowerCase().includes(q),
		)
		.slice(0, 8)
		.map((icon) => `${icon.slug} (${icon.title})`);
}

async function loadCatalog() {
	const body = await fetchText(DATA_URL);
	const icons = JSON.parse(body);
	return {
		icons,
		bySlug: Object.fromEntries(icons.map((icon) => [icon.slug, icon])),
	};
}

async function addFromSimpleIcons(slugs, force) {
	const { icons, bySlug } = await loadCatalog();
	const missing = [];
	for (const slug of slugs) {
		if (!isSlug(slug)) {
			console.error(`Invalid slug "${slug}"`);
			missing.push(slug);
			continue;
		}
		const icon = bySlug[slug];
		if (!icon) {
			const hints = suggest(slug, icons);
			console.error(`Simple Icons has no "${slug}".`);
			if (hints.length) console.error(`  Did you mean: ${hints.join(", ")}`);
			else {
				console.error(
					"  Drop an official SVG with: node scripts/add-pool-logo.js --file <path.svg> <slug>",
				);
			}
			missing.push(slug);
			continue;
		}
		const svg = await fetchText(svgUrl(slug));
		writePair(slug, svg, `#${icon.hex}`, force, true);
	}
	if (missing.length) {
		throw new Error(`Could not add: ${missing.join(", ")}`);
	}
}

async function addSeed(force) {
	for (const entry of SEED) {
		if (entry.binary) {
			writeBinary(entry, await fetchBuffer(entry.url), force);
		} else {
			writeOfficialPair(entry, await fetchText(entry.url), force);
		}
		await new Promise((resolve) => setTimeout(resolve, 800));
	}
}

function addFromFile(filePath, slug, force) {
	if (!filePath || !slug) usage();
	if (!isSlug(slug)) {
		throw new Error(`Invalid slug "${slug}"`);
	}
	const resolved = path.resolve(filePath);
	if (!fs.existsSync(resolved)) {
		throw new Error(`No file at ${resolved}`);
	}
	const svg = fs.readFileSync(resolved, "utf8");
	writePair(slug, svg, "#000000", force, false);
}

function clearPool() {
	if (!fs.existsSync(POOL_DIR)) return;
	for (const name of fs.readdirSync(POOL_DIR)) {
		fs.unlinkSync(path.join(POOL_DIR, name));
	}
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	if (args.file) {
		addFromFile(args.file, args.slugs[0], args.force);
		return;
	}
	if (args.seed) {
		clearPool();
		await addSeed(true);
		return;
	}
	if (args.slugs.length === 0) usage();
	await addFromSimpleIcons(args.slugs, args.force);
}

if (require.main === module) {
	main().catch((error) => {
		console.error(error.message);
		process.exit(1);
	});
}

module.exports = { SEED, POOL_DIR, applyFill, invertSvg };

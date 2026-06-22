#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { ROOT, compileDeck, discoverSlideFiles } = require("./compile-deck.js");

const DECKS_DIR = path.join(ROOT, "decks");

function listDeckDirectories() {
	return fs
		.readdirSync(DECKS_DIR, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => path.join(DECKS_DIR, entry.name))
		.filter((deckDir) => discoverSlideFiles(deckDir).length > 0)
		.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function compileAllDecks() {
	if (!fs.existsSync(DECKS_DIR)) {
		throw new Error(`Decks directory not found: ${DECKS_DIR}`);
	}

	const deckDirs = listDeckDirectories();

	if (deckDirs.length === 0) {
		console.log("No decks with slide HTML files found.");
		return;
	}

	let failed = 0;

	for (const deckDir of deckDirs) {
		const deckName = path.basename(deckDir);
		console.log(`\n[${deckName}]`);

		try {
			compileDeck(deckDir);
		} catch (error) {
			failed += 1;
			console.error(`Failed: ${error.message}`);
		}
	}

	console.log(
		`\nDone. ${deckDirs.length - failed}/${deckDirs.length} deck(s) compiled.`,
	);

	if (failed > 0) {
		process.exit(1);
	}
}

if (require.main === module) {
	try {
		compileAllDecks();
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
}

module.exports = { compileAllDecks, listDeckDirectories };

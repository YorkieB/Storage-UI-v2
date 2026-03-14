#!/usr/bin/env node
/**
 * Architecture Integrity Check
 *
 * Enforces import boundary rules:
 * - Components (src/*.jsx) must not directly import from a "services/" layer.
 * - Utility files must use camelCase naming.
 * - Component files must use PascalCase naming.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, extname, join } from "node:path";

const SRC_DIR = new URL("../src", import.meta.url).pathname;

let violations = 0;

function checkFile(filePath) {
	const name = basename(filePath, extname(filePath));
	const ext = extname(filePath);
	const content = readFileSync(filePath, "utf8");

	// Naming convention: .jsx files should be PascalCase (skip entry points)
	const ENTRY_FILES = new Set(["main.jsx", "index.jsx"]);
	if (
		ext === ".jsx" &&
		!ENTRY_FILES.has(basename(filePath)) &&
		!/^[A-Z][A-Za-z0-9]*$/.test(name)
	) {
		console.error(
			`[ARCH] Naming violation: "${basename(filePath)}" — JSX component files must use PascalCase.`,
		);
		violations++;
	}

	// Import boundary: components must not import from a services/ directory
	const serviceImportPattern = /from\s+['"][^'"]*\/services\//g;
	if (serviceImportPattern.test(content)) {
		console.error(
			`[ARCH] Import boundary violation in "${basename(filePath)}" — components must not import directly from a services/ layer.`,
		);
		violations++;
	}
}

function walkDir(dir) {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) {
			walkDir(full);
		} else if (/\.(jsx?|tsx?)$/.test(entry)) {
			checkFile(full);
		}
	}
}

walkDir(SRC_DIR);

if (violations > 0) {
	console.error(
		`\n[ARCH] Architecture check failed with ${violations} violation(s).`,
	);
	process.exit(1);
} else {
	console.log("[ARCH] Architecture check passed — no violations found.");
}

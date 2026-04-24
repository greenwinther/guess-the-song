const { spawnSync } = require("node:child_process");
const { readdirSync } = require("node:fs");
const path = require("node:path");

function collectUnitTests(dir) {
	const entries = readdirSync(dir, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...collectUnitTests(fullPath));
			continue;
		}

		if (entry.isFile() && entry.name.endsWith(".unit.test.ts")) {
			files.push(fullPath);
		}
	}

	return files.sort();
}

const testRoot = path.join(process.cwd(), "src", "tests");
const testFiles = collectUnitTests(testRoot);

if (testFiles.length === 0) {
	console.error("No unit test files found under src/tests.");
	process.exit(1);
}

const result = spawnSync(process.execPath, ["--import", "tsx", "--test", ...testFiles], {
	stdio: "inherit",
});

if (result.error) {
	throw result.error;
}

process.exit(result.status ?? 1);

// src/scripts/wipeAll.ts
import fs from "fs";
import path from "path";

const STATE_PATH = path.join(process.cwd(), "data", "state.json");

async function main() {
	if (fs.existsSync(STATE_PATH)) {
		fs.unlinkSync(STATE_PATH);
		console.log(`Removed ${STATE_PATH}`);
	} else {
		console.log(`No state file found at ${STATE_PATH}`);
	}
}

main().catch((err) => {
	console.error("Failed to wipe persisted state", err);
	process.exit(1);
});

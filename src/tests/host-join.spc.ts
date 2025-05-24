// tests/host-join.spec.ts
import { test, expect } from "@playwright/test";

test("host can create room and player can join", async ({ page, context }) => {
	// Host flow
	await page.goto("http://localhost:3000");
	await page.click("text=Host Room");
	await expect(page.locator("text=Room Code")).toBeVisible();
	const roomCode = await page.locator("h2 >> text=/[A-Z0-9]{6}/").textContent();

	// Open a second context for the player
	const playerPage = await context.newPage();
	await playerPage.goto(`http://localhost:3000/join/${roomCode}`);
	await playerPage.fill('input[placeholder="Your name"]', "Alice");
	await playerPage.click("text=Join Game");

	// Verify host sees new player
	await expect(page.locator("text=Alice")).toBeVisible();
});

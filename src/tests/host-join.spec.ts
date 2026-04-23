// tests/host-join.spec.ts
import { test, expect } from "@playwright/test";

test("host can create room and player can join", async ({ page, context }) => {
	// Host flow
	await page.goto("/");
	await page.getByRole("button", { name: "Host" }).click();
	await page.locator("form").getByRole("button", { name: "Create Lobby" }).click();
	await expect(page).toHaveURL(/\/admin\/[A-Z0-9]{4}$/);
	await expect(page.getByRole("heading", { name: "Song Setup" })).toBeVisible();

	const roomCode = page.url().match(/\/admin\/([A-Z0-9]{4})$/)?.[1];
	expect(roomCode).toMatch(/^[A-Z0-9]{4}$/);
	await page.goto(`/host/${roomCode}`);
	await expect(page).toHaveURL(new RegExp(`/host/${roomCode}$`));
	await expect(page.getByText("Room code", { exact: true })).toBeVisible();

	// Open a second context for the player
	const playerPage = await context.newPage();
	await playerPage.goto("/");
	await expect(playerPage.getByRole("button", { name: "Join", exact: true })).toBeVisible();
	await playerPage.fill('input[placeholder="Your Name"]', "Alice");
	await playerPage.fill('input[placeholder="Room Code"]', roomCode ?? "");
	await playerPage.locator("form").getByRole("button", { name: "Join Lobby" }).click();
	await expect(playerPage).toHaveURL(new RegExp(`/join/${roomCode}\\?name=Alice$`));

	// Player ready up
	const readyToggle = playerPage.locator("#player-ready");
	await expect(readyToggle).toBeVisible();
	await readyToggle.click();

	// Verify host sees new player
	await expect(page.getByRole("button", { name: "Alice" })).toBeVisible();

	// Host can start game once ready
	const startButton = page.locator('button:has-text("Start Game")');
	await expect(startButton).toBeEnabled();
	await startButton.click();
});

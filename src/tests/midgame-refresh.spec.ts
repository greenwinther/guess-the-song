import { test, expect } from "@playwright/test";

test("host and player can reload into an active round", async ({ page, context, browser }) => {
	test.setTimeout(90_000);

	await page.goto("/");
	await page.getByRole("button", { name: "Host" }).click();
	await page.locator("form").getByRole("button", { name: "Create Lobby" }).click();
	await expect(page).toHaveURL(/\/admin\/[A-Z0-9]{4}$/);

	const roomCode = page.url().match(/\/admin\/([A-Z0-9]{4})$/)?.[1];
	expect(roomCode).toMatch(/^[A-Z0-9]{4}$/);
	await page.goto(`/control/${roomCode}`);
	await expect(page).toHaveURL(new RegExp(`/control/${roomCode}$`));

	const adminPage = await context.newPage();
	await adminPage.goto(`/admin/${roomCode}`);
	await adminPage
		.getByPlaceholder("Search or paste YouTube URL")
		.fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
	await adminPage.getByPlaceholder("Your name").fill("Bob");
	await adminPage.getByRole("button", { name: "Add Song" }).click();
	await expect(page.getByText("Songs prepared: 1")).toBeVisible();

	const playerContext = await browser.newContext();
	const playerPage = await playerContext.newPage();

	try {
		await playerPage.goto("/");
		await playerPage.fill('input[placeholder="Your Name"]', "Alice");
		await playerPage.fill('input[placeholder="Room Code"]', roomCode ?? "");
		await playerPage.locator("form").getByRole("button", { name: "Join Lobby" }).click();
		await expect(playerPage).toHaveURL(new RegExp(`/play/${roomCode}\\?name=Alice$`));
		await playerPage.locator("#player-ready").check();

		await page.getByRole("button", { name: "Start Game" }).click();
		await page.getByRole("button", { name: "Play/Pause (Space)" }).click();

		await expect(playerPage.getByRole("heading", { name: /Guess the Submitter/i })).toBeVisible();

		await playerPage.reload();
		await expect(playerPage).toHaveURL(new RegExp(`/play/${roomCode}\\?name=Alice$`));
		await expect(playerPage.getByRole("heading", { name: /Guess the Submitter/i })).toBeVisible();
		await expect(playerPage.getByText("Song 1")).toBeVisible();

		await page.reload();
		await expect(page).toHaveURL(new RegExp(`/control/${roomCode}$`));
		await expect(page.getByRole("button", { name: "Play/Pause (Space)" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Recap" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Show Results" })).toBeVisible();
	} finally {
		await playerContext.close();
	}
});

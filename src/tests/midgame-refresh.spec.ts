import { test, expect } from "@playwright/test";

test("host and player can reload into an active round", async ({ page, context, browser }) => {
	test.setTimeout(90_000);

	await page.goto("/");
	await page.getByRole("button", { name: "Host" }).click();
	await page.locator("form").getByRole("button", { name: "Create Lobby" }).click();
	await expect(page).toHaveURL(/\/admin\/[A-Z0-9]{4}$/);

	const roomCode = page.url().match(/\/admin\/([A-Z0-9]{4})$/)?.[1];
	expect(roomCode).toMatch(/^[A-Z0-9]{4}$/);
	const adminPage = page;
	const hostPagePromise = context.waitForEvent("page");
	await adminPage.getByRole("button", { name: "Open host control" }).click();
	const hostPage = await hostPagePromise;
	await hostPage.waitForLoadState();
	await expect(hostPage).toHaveURL(new RegExp(`/host/${roomCode}(\\?.*)?$`));
	await adminPage
		.getByPlaceholder("Search or paste YouTube URL")
		.fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
	await adminPage.getByPlaceholder("Submitter").fill("Bob");
	await adminPage.getByRole("button", { name: "Add Song" }).click();
	await expect(adminPage.getByText("Submitted by Bob")).toBeVisible();

	const playerContext = await browser.newContext();
	const playerPage = await playerContext.newPage();

	try {
		await playerPage.goto("/");
		await playerPage.fill('input[placeholder="Your Name"]', "Alice");
		await playerPage.fill('input[placeholder="Room Code"]', roomCode ?? "");
		await playerPage.locator("form").getByRole("button", { name: "Join Lobby" }).click();
		await expect(playerPage).toHaveURL(new RegExp(`/join/${roomCode}\\?name=Alice$`));
		await playerPage.locator("#player-ready").click();

		await hostPage.getByRole("button", { name: "Start Game" }).click();
		await hostPage.getByRole("button", { name: "Play/Pause (Space)" }).click();

		await expect(playerPage.getByRole("heading", { name: "Make your guesses" })).toBeVisible();

		await playerPage.reload();
		await expect(playerPage).toHaveURL(new RegExp(`/join/${roomCode}\\?name=Alice$`));
		await expect(playerPage.getByRole("heading", { name: "Make your guesses" })).toBeVisible();

		await hostPage.reload();
		await expect(hostPage).toHaveURL(new RegExp(`/host/${roomCode}$`));
		await expect(hostPage.getByRole("button", { name: "Play/Pause (Space)" })).toBeVisible();
		await expect(hostPage.getByRole("button", { name: "Next", exact: true })).toBeVisible();
	} finally {
		await playerContext.close();
	}
});

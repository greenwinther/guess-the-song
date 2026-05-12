import { test, expect } from "@playwright/test";

test("host, admin, and player can complete a minimal live game flow", async ({
	page,
	context,
	browser,
}) => {
	test.setTimeout(90_000);

	await page.goto("/");
	await page.getByRole("button", { name: "Host" }).click();
	await page.locator("form").getByRole("button", { name: "Create Lobby" }).click();
	await expect(page).toHaveURL(/\/admin\/[A-Z0-9]{4}$/);

	const roomCode = page.url().match(/\/admin\/([A-Z0-9]{4})$/)?.[1];
	expect(roomCode).toMatch(/^[A-Z0-9]{4}$/);
	const adminPage = page;
	await expect(adminPage.getByRole("heading", { name: "Song Setup" })).toBeVisible();
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
		await expect(playerPage.locator("#player-ready")).toBeVisible();
		await playerPage.locator("#player-ready").click();

		await expect(hostPage.getByRole("button", { name: "Alice" })).toBeVisible();
		await expect(hostPage.getByText(/1\s*\/\s*1 players ready/i)).toBeVisible();

		await hostPage.getByRole("button", { name: "Start Game" }).click();

		await expect(hostPage).toHaveURL(new RegExp(`/host/${roomCode}$`));
		await expect(playerPage).toHaveURL(new RegExp(`/join/${roomCode}\\?name=Alice$`));
		await expect(hostPage.getByRole("button", { name: "Play/Pause (Space)" })).toBeVisible();
		await expect(playerPage.getByRole("heading", { name: "Make your guesses" })).toBeVisible();

		await hostPage.getByRole("button", { name: "Play/Pause (Space)" }).click();
		await expect(hostPage.getByRole("button", { name: "Play/Pause (Space)" })).toContainText("Pause");

		await hostPage.getByRole("button", { name: "Next", exact: true }).click();
		await expect(hostPage.getByRole("button", { name: "Skip recap" })).toBeVisible();
		await hostPage.getByRole("button", { name: "Skip recap" }).click();
		await expect(hostPage.getByRole("button", { name: "Who submitted it?" })).toBeVisible();
		await hostPage.getByRole("button", { name: "Who submitted it?" }).click();
		await hostPage.getByRole("button", { name: /Reveal 1st place/i }).click();

		await expect(hostPage.getByRole("heading", { name: "Final Results" })).toBeVisible();
		await expect(playerPage.getByRole("heading", { name: "Results" })).toBeVisible();
		await expect(playerPage.getByText("Final score")).toBeVisible();
	} finally {
		await playerContext.close();
	}
});

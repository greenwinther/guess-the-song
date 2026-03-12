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
	await page.goto(`/control/${roomCode}`);
	await expect(page).toHaveURL(new RegExp(`/control/${roomCode}$`));

	const adminPage = await context.newPage();
	await adminPage.goto(`/admin/${roomCode}`);
	await expect(adminPage.getByRole("heading", { name: "Room Setup" })).toBeVisible();

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
		await expect(playerPage.locator("#player-ready")).toBeVisible();
		await playerPage.locator("#player-ready").check();

		await expect(page.getByRole("button", { name: "Alice" })).toBeVisible();
		await expect(page.getByText("Players ready: 1/1")).toBeVisible();

		await page.getByRole("button", { name: "Start Game" }).click();

		await expect(page).toHaveURL(new RegExp(`/control/${roomCode}$`));
		await expect(playerPage).toHaveURL(new RegExp(`/play/${roomCode}\\?name=Alice$`));
		await expect(page.getByRole("button", { name: "Play/Pause (Space)" })).toBeVisible();
		await expect(playerPage.getByRole("heading", { name: /Guess the Submitter/i })).toBeVisible();

		await page.getByRole("button", { name: "Play/Pause (Space)" }).click();
		await expect(page.getByRole("button", { name: "Play/Pause (Space)" })).toContainText("Pause");

		await page.getByRole("button", { name: "Next", exact: true }).click();
		await expect(page.getByRole("button", { name: "Show Results" })).toBeVisible();
		await page.getByRole("button", { name: "Show Results" }).click();

		await expect(page.getByRole("heading", { name: "Final Results" })).toBeVisible();
		await expect(playerPage.getByRole("heading", { name: "Results" })).toBeVisible();
		await expect(playerPage.getByText("Your total correct:")).toBeVisible();
	} finally {
		await playerContext.close();
	}
});

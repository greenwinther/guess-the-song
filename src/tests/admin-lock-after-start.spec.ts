import { test, expect } from "@playwright/test";

test("admin editor becomes read-only after the live game starts", async ({
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
	await page.goto(`/host/${roomCode}`);
	await expect(page).toHaveURL(new RegExp(`/host/${roomCode}$`));

	const adminPage = await context.newPage();
	await adminPage.goto(`/admin/${roomCode}`);
	await expect(adminPage.getByRole("heading", { name: "Song Setup" })).toBeVisible();

	await adminPage
		.getByPlaceholder("Search or paste YouTube URL")
		.fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
	await adminPage.getByPlaceholder("Submitter").fill("Bob");
	await adminPage.getByRole("button", { name: "Add Song" }).click();
	await expect(page.getByText("1 song added")).toBeVisible();

	await adminPage.getByPlaceholder("Secret theme (e.g., Disney)").fill("Movie Night");
	await adminPage.getByPlaceholder("Secret theme (e.g., Disney)").press("Enter");

	const playerContext = await browser.newContext();
	const playerPage = await playerContext.newPage();

	try {
		await playerPage.goto("/");
		await playerPage.fill('input[placeholder="Your Name"]', "Alice");
		await playerPage.fill('input[placeholder="Room Code"]', roomCode ?? "");
		await playerPage.locator("form").getByRole("button", { name: "Join Lobby" }).click();
		await expect(playerPage).toHaveURL(new RegExp(`/join/${roomCode}\\?name=Alice$`));
		await playerPage.locator("#player-ready").click();

		await page.getByRole("button", { name: "Start Game" }).click();

		await expect(adminPage.getByRole("heading", { name: "Guess History" })).toBeVisible();
		await expect(adminPage.getByRole("heading", { name: "Song Setup" })).toHaveCount(0);
		await expect(adminPage.getByPlaceholder("Secret theme (e.g., Disney)")).toHaveCount(0);
		await expect(adminPage.getByPlaceholder("Bonus question (e.g., Year released)")).toHaveCount(0);
		await expect(adminPage.getByRole("button", { name: "Add Song" })).toHaveCount(0);
		await expect(adminPage.getByRole("button", { name: "Remove" })).toHaveCount(0);
	} finally {
		await playerContext.close();
	}
});

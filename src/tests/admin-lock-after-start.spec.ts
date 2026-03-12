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

	await adminPage.getByPlaceholder("Secret theme (e.g., Disney)").fill("Movie Night");
	await adminPage.getByPlaceholder("Secret theme (e.g., Disney)").press("Enter");

	await adminPage.getByText("1").click();
	await expect(adminPage.getByLabel("Remove song")).toBeVisible();

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

		await expect(adminPage.getByText("Locked after start")).toBeVisible();
		await expect(adminPage.getByRole("button", { name: "Show setup" })).toBeVisible();
		await adminPage.getByRole("button", { name: "Show setup" }).click();
		await expect(
			adminPage.getByText("Setup is read-only once the live game has started.")
		).toBeVisible();
		await expect(adminPage.getByRole("button", { name: "Save theme" })).toBeDisabled();
		await expect(adminPage.getByRole("button", { name: "Save question" })).toBeDisabled();
		await expect(adminPage.getByPlaceholder("Secret theme (e.g., Disney)")).toBeDisabled();
		await expect(adminPage.getByPlaceholder("Detail question (e.g., Year released)")).toBeDisabled();
		await expect(adminPage.getByRole("button", { name: "Add Song" })).toBeDisabled();
		await expect(adminPage.locator("#admin-hardcore-required")).toBeDisabled();
		await expect(adminPage.getByLabel("Remove song")).toHaveCount(0);
	} finally {
		await playerContext.close();
	}
});

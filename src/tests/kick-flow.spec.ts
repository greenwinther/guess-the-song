import { test, expect } from "@playwright/test";

test("host can kick a player and the kicked player cannot immediately rejoin", async ({
	page,
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

	const playerContext = await browser.newContext();
	const playerPage = await playerContext.newPage();

	try {
		await playerPage.goto("/");
		await playerPage.fill('input[placeholder="Your Name"]', "Alice");
		await playerPage.fill('input[placeholder="Room Code"]', roomCode ?? "");
		await playerPage.locator("form").getByRole("button", { name: "Join Lobby" }).click();
		await expect(playerPage).toHaveURL(new RegExp(`/join/${roomCode}\\?name=Alice$`));

		await expect(page.getByRole("button", { name: "Alice" })).toBeVisible();

		page.once("dialog", (dialog) => dialog.accept());
		await page.getByRole("button", { name: "Alice" }).click();
		await page.getByRole("button", { name: "Kick" }).click();

		await expect(
			playerPage.getByText("You were kicked from this room.", { exact: true }).first()
		).toBeVisible();
		await expect(page.getByRole("button", { name: "Alice" })).toHaveCount(0);

		await playerPage.getByRole("button", { name: "Back to start" }).click();
		await expect(playerPage).toHaveURL(/\/$/);

		await playerPage.evaluate(() => localStorage.removeItem("gts-join-denied"));
		await playerPage.goto(`/join/${roomCode}?name=Alice`);
		await expect(playerPage).toHaveURL(new RegExp(`/join/${roomCode}\\?name=Alice$`));
		await expect(
			playerPage.getByText("You were kicked from this room.", { exact: true }).first()
		).toBeVisible();
	} finally {
		await playerContext.close();
	}
});

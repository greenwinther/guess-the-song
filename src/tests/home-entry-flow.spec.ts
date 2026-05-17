import { expect, test } from "@playwright/test";

test("homepage entry flow switches intent, normalizes code, persists name, and supports Enter key flow", async ({
	page,
	browser,
}) => {
	test.setTimeout(90_000);

	await page.goto("/");
	await page.fill('input[placeholder="Your Name"]', "Host");
	await page.locator("form").getByRole("button", { name: "Create Room" }).click();
	await expect(page).toHaveURL(/\/admin\/[A-Z0-9]{4}$/);

	const roomCode = page.url().match(/\/admin\/([A-Z0-9]{4})$/)?.[1];
	expect(roomCode).toMatch(/^[A-Z0-9]{4}$/);

	const playerContext = await browser.newContext();
	const playerPage = await playerContext.newPage();
	const nameInput = playerPage.locator('input[placeholder="Your Name"]');
	const roomCodeInput = playerPage.locator('input[placeholder="Room Code (Optional)"]');

	try {
		await playerPage.goto("/");

		await expect(playerPage.locator("form").getByRole("button", { name: "Create Room" })).toBeVisible();

		await nameInput.fill("Alice");
		await nameInput.focus();
		await nameInput.press("Enter");
		await expect(roomCodeInput).toBeFocused();

		await roomCodeInput.fill(` ${roomCode?.slice(0, 2)} ${roomCode?.slice(2)} !!`);
		await expect(roomCodeInput).toHaveValue(roomCode ?? "");
		await expect(playerPage.locator("form").getByRole("button", { name: "Join Room" })).toBeVisible();

		await playerPage.reload();
		await expect(nameInput).toHaveValue("Alice");
		await expect(roomCodeInput).toHaveValue("");
		await expect(playerPage.locator("form").getByRole("button", { name: "Create Room" })).toBeVisible();

		await roomCodeInput.fill(roomCode ?? "");
		await expect(playerPage.locator("form").getByRole("button", { name: "Join Room" })).toBeVisible();

		await nameInput.focus();
		await nameInput.press("Enter");
		await expect(playerPage).toHaveURL(new RegExp(`/join/${roomCode}\\?name=Alice$`));
	} finally {
		await playerContext.close();
	}
});

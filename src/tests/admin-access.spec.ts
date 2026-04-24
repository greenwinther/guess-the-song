import { test, expect } from "@playwright/test";

test("host can open the admin editor for a created room", async ({ page, context }) => {
	await page.goto("/");
	await page.getByRole("button", { name: "Host" }).click();
	await page.locator("form").getByRole("button", { name: "Create Lobby" }).click();
	await expect(page).toHaveURL(/\/admin\/[A-Z0-9]{4}$/);
	await expect(page.getByRole("heading", { name: "Song Setup" })).toBeVisible();

	const roomCode = page.url().match(/\/admin\/([A-Z0-9]{4})$/)?.[1];
	expect(roomCode).toMatch(/^[A-Z0-9]{4}$/);

	const adminPage = await context.newPage();
	await adminPage.goto(`/admin/${roomCode}`);

	await expect(adminPage.getByRole("heading", { name: "Song Setup" })).toBeVisible();
	await expect(adminPage.getByRole("button", { name: "Open host control" })).toBeVisible();
});

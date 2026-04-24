import { test, expect } from "@playwright/test";

test("admin theme and bonus question edits persist in the editor", async ({ page, context }) => {
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

	await adminPage.getByPlaceholder("Secret theme (e.g., Disney)").fill("Movie Night");
	await adminPage.getByPlaceholder("Secret theme (e.g., Disney)").press("Enter");

	await adminPage.getByPlaceholder("Bonus question (e.g., Year released)").fill("Release year");
	await adminPage.getByPlaceholder("Bonus question (e.g., Year released)").press("Enter");

	await adminPage.reload();
	await expect(adminPage.getByPlaceholder("Secret theme (e.g., Disney)")).toHaveValue("Movie Night");
	await expect(adminPage.getByPlaceholder("Bonus question (e.g., Year released)")).toHaveValue(
		"Release year"
	);
});

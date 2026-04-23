import { test, expect } from "@playwright/test";

test("admin theme and detail edits sync into host control status", async ({ page, context }) => {
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

	await adminPage.getByPlaceholder("Detail question (e.g., Year released)").fill("Release year");
	await adminPage.getByPlaceholder("Detail question (e.g., Year released)").press("Enter");

	await expect(page.getByText("Theme set: Yes")).toBeVisible();
	await expect(page.getByText("Detail question: Yes")).toBeVisible();
});

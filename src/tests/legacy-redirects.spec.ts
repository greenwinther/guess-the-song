import { test, expect } from "@playwright/test";

test("legacy join and host URLs redirect to the new shells", async ({ page, context }) => {
	await page.goto("/");
	await page.getByRole("button", { name: "Host" }).click();
	await page.locator("form").getByRole("button", { name: "Create Lobby" }).click();
	await expect(page).toHaveURL(/\/admin\/[A-Z0-9]{4}$/);

	const roomCode = page.url().match(/\/admin\/([A-Z0-9]{4})$/)?.[1];
	expect(roomCode).toMatch(/^[A-Z0-9]{4}$/);

	await page.goto(`/host/${roomCode}`);
	await expect(page).toHaveURL(`/control/${roomCode}`);

	const playerPage = await context.newPage();
	await playerPage.goto(`/join/${roomCode}?name=Alice`);
	await expect(playerPage).toHaveURL(`/play/${roomCode}?name=Alice`);
});

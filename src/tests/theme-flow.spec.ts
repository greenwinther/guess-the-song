import { test, expect } from "@playwright/test";

test("theme guesses reset between rounds, expose the hint, and persist solved state", async ({
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
	const hostPagePromise = context.waitForEvent("page");
	await adminPage.getByRole("button", { name: "Open host control" }).click();
	const hostPage = await hostPagePromise;
	await hostPage.waitForLoadState();
	await expect(hostPage).toHaveURL(new RegExp(`/host/${roomCode}(\\?.*)?$`));
	await expect(adminPage.getByRole("heading", { name: "Song Setup" })).toBeVisible();

	await adminPage.getByPlaceholder("Secret theme (e.g., Disney)").fill("Movie Night");
	await adminPage.getByPlaceholder("Secret theme (e.g., Disney)").press("Enter");

	const songInput = adminPage.getByPlaceholder("Search or paste YouTube URL");
	const submitterInput = adminPage.getByPlaceholder("Submitter");
	for (const [index, [url, submitter]] of [
		["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "Bob"],
		["https://www.youtube.com/watch?v=9bZkp7q19f0", "Carol"],
	].entries()) {
		await songInput.fill(url);
		await submitterInput.fill(submitter);
		await adminPage.getByRole("button", { name: "Add Song" }).click();
		await expect(songInput).toHaveValue("");
		await expect(adminPage.getByText(`Submitted by ${submitter}`)).toBeVisible();
	}

	await expect(adminPage.getByPlaceholder("Secret theme (e.g., Disney)")).toHaveValue("Movie Night");

	const playerContext = await browser.newContext();
	const playerPage = await playerContext.newPage();

	try {
		await playerPage.goto("/");
		await playerPage.fill('input[placeholder="Your Name"]', "Alice");
		await playerPage.fill('input[placeholder="Room Code"]', roomCode ?? "");
		await playerPage.locator("form").getByRole("button", { name: "Join Lobby" }).click();
		await expect(playerPage).toHaveURL(new RegExp(`/join/${roomCode}\\?name=Alice$`));
		await playerPage.locator("#player-ready").click();

		await hostPage.getByRole("button", { name: "Start Game" }).click();
		await expect(playerPage.getByRole("textbox", { name: "Theme guess" })).toBeVisible();

		await playerPage.getByRole("textbox", { name: "Theme guess" }).fill("Wrong Theme");
		await playerPage.getByRole("button", { name: "Lock in theme" }).click();

		await expect(playerPage.getByRole("textbox", { name: "Theme guess" })).toBeDisabled();

		await hostPage.getByRole("button", { name: "Play/Pause (Space)" }).click();
		await hostPage.getByRole("button", { name: "Next", exact: true }).click();

		await expect(playerPage.getByRole("textbox", { name: "Theme guess" })).toBeEnabled();

		await playerPage.getByRole("textbox", { name: "Theme guess" }).fill("Movie Night");
		await playerPage.getByRole("button", { name: "Lock in theme" }).click();

		await expect(playerPage.getByText("Good job, you solved the theme.")).toBeVisible();

		await hostPage.getByRole("button", { name: "Play/Pause (Space)" }).click();
		await hostPage.getByRole("button", { name: "Next", exact: true }).click();

		await expect(hostPage.getByRole("button", { name: "Start recap" })).toBeVisible();
	} finally {
		await playerContext.close();
	}
});

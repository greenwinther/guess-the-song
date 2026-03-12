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
	await page.goto(`/control/${roomCode}`);
	await expect(page).toHaveURL(new RegExp(`/control/${roomCode}$`));

	const adminPage = await context.newPage();
	await adminPage.goto(`/admin/${roomCode}`);
	await expect(adminPage.getByRole("heading", { name: "Room Setup" })).toBeVisible();

	await adminPage.getByPlaceholder("Secret theme (e.g., Disney)").fill("Movie Night");
	await adminPage.getByPlaceholder("Secret theme (e.g., Disney)").press("Enter");

	const songInput = adminPage.getByPlaceholder("Search or paste YouTube URL");
	const submitterInput = adminPage.getByPlaceholder("Your name");
	for (const [index, [url, submitter]] of [
		["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "Bob"],
		["https://www.youtube.com/watch?v=9bZkp7q19f0", "Carol"],
	].entries()) {
		await songInput.fill(url);
		await submitterInput.fill(submitter);
		await adminPage.getByRole("button", { name: "Add Song" }).click();
		await expect(songInput).toHaveValue("");
		await expect(page.getByText(`Songs prepared: ${index + 1}`)).toBeVisible();
	}

	await expect(page.getByText("Theme set: Yes")).toBeVisible();

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
		await expect(playerPage.getByRole("textbox", { name: "Theme guess" })).toBeVisible();

		await playerPage.getByRole("textbox", { name: "Theme guess" }).fill("Wrong Theme");
		await playerPage.getByRole("button", { name: "Lock in theme guess" }).click();

		await expect(playerPage.getByRole("textbox", { name: "Theme guess" })).toBeDisabled();
		await expect(adminPage.getByText("Guessed this round")).toBeVisible();

		await page.getByRole("button", { name: "Play/Pause (Space)" }).click();
		await page.getByRole("button", { name: "Next", exact: true }).click();

		await expect(playerPage.getByRole("textbox", { name: "Theme guess" })).toBeEnabled();
		await expect(adminPage.getByText(/Hint:\s*M/i)).toBeVisible();

		await playerPage.getByRole("textbox", { name: "Theme guess" }).fill("Movie Night");
		await playerPage.getByRole("button", { name: "Lock in theme guess" }).click();

		await expect(playerPage.getByText("Good job, you solved the theme.")).toBeVisible();
		await expect(adminPage.getByRole("cell", { name: "Solved" })).toBeVisible();

		await page.getByRole("button", { name: "Play/Pause (Space)" }).click();
		await page.getByRole("button", { name: "Next", exact: true }).click();

		await expect(page.getByRole("button", { name: "Recap" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Show Results" })).toBeVisible();
	} finally {
		await playerContext.close();
	}
});

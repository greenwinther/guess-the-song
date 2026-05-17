import { expect, test } from "@playwright/test";

test("admin game table supports row selection, sorting, and theme solve rank", async ({
	page,
	context,
	browser,
}) => {
	test.setTimeout(120_000);

	await page.goto("/");
	await page.fill('input[placeholder="Your Name"]', "Host");
	await page.locator("form").getByRole("button", { name: "Create Room" }).click();
	await expect(page).toHaveURL(/\/admin\/[A-Z0-9]{4}$/);

	const roomCode = page.url().match(/\/admin\/([A-Z0-9]{4})$/)?.[1];
	expect(roomCode).toMatch(/^[A-Z0-9]{4}$/);
	const adminPage = page;

	const hostPagePromise = context.waitForEvent("page");
	await adminPage.getByRole("button", { name: "Open host control" }).click();
	const hostPage = await hostPagePromise;
	await hostPage.waitForLoadState();
	await expect(hostPage).toHaveURL(new RegExp(`/host/${roomCode}(\\?.*)?$`));

	await adminPage.getByPlaceholder("Secret theme (e.g., Disney)").fill("Movie Night");
	await adminPage.getByPlaceholder("Secret theme (e.g., Disney)").press("Enter");

	await adminPage
		.getByPlaceholder("Search or paste YouTube URL")
		.fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
	await adminPage.getByPlaceholder("Submitter").fill("Bob");
	await adminPage.getByRole("button", { name: "Add Song" }).click();
	await expect(adminPage.getByText("Submitted by Bob")).toBeVisible();

	const aliceContext = await browser.newContext();
	const alicePage = await aliceContext.newPage();
	const bobContext = await browser.newContext();
	const bobPage = await bobContext.newPage();

	try {
		await alicePage.goto("/");
		await alicePage.fill('input[placeholder="Your Name"]', "Alice");
		await alicePage.fill('input[placeholder="Room Code (Optional)"]', roomCode ?? "");
		await alicePage.locator("form").getByRole("button", { name: "Join Room" }).click();
		await expect(alicePage).toHaveURL(new RegExp(`/join/${roomCode}\\?name=Alice$`));
		await alicePage.locator("#player-ready").click();

		await bobPage.goto("/");
		await bobPage.fill('input[placeholder="Your Name"]', "Bob");
		await bobPage.fill('input[placeholder="Room Code (Optional)"]', roomCode ?? "");
		await bobPage.locator("form").getByRole("button", { name: "Join Room" }).click();
		await expect(bobPage).toHaveURL(new RegExp(`/join/${roomCode}\\?name=Bob$`));
		await bobPage.locator("#player-ready").click();

		await hostPage.getByRole("button", { name: "Start Game" }).click();
		await expect(adminPage.getByRole("columnheader", { name: "Score" })).toBeVisible();

		await alicePage.getByRole("textbox", { name: "Theme guess" }).fill("Movie Night");
		await alicePage.getByRole("button", { name: "Lock in theme" }).click();
		await expect(alicePage.getByText("Good job, you solved the theme.")).toBeVisible();

		const aliceRow = adminPage.getByRole("button", { name: "View history for Alice" });
		await expect(aliceRow.getByTitle("Solve rank 1")).toBeVisible();
		const themeRankInfo = adminPage.locator('[aria-label="Theme rank info"]');
		await expect(themeRankInfo).toBeVisible();
		await expect(themeRankInfo).toHaveAttribute(
			"title",
			"Rank number shows solve order: 1 = first solver."
		);

		const bobRow = adminPage.getByRole("button", { name: "View history for Bob" });
		await bobRow.click();
		await expect(bobRow).toHaveAttribute("aria-pressed", "true");

		await adminPage.getByRole("columnheader", { name: "Score" }).getByRole("button").click();
		await expect(
			adminPage.locator("tbody tr").first().locator("td").first()
		).toHaveText("Alice");

		const playerSortButton = adminPage
			.getByRole("columnheader", { name: "Player" })
			.getByRole("button");
		await playerSortButton.click();
		await playerSortButton.click();
		await expect(
			adminPage.locator("tbody tr").first().locator("td").first()
		).toHaveText("Bob");
	} finally {
		await aliceContext.close();
		await bobContext.close();
	}
});

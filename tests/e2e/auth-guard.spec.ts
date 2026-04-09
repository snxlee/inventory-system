import { expect, test } from "@playwright/test";

test("unauthenticated user is redirected from dashboard to login", async ({ page }) => {
  await page.context().clearCookies();

  await page.goto("/dashboard");

  await page.waitForURL("**/login");
  await expect(page).toHaveURL(/\/login$/);
});

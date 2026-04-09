import { expect, test } from "@playwright/test";

test("demo admin can sign in and reach dashboard", async ({ page }) => {
  await page.goto("/login");

  await page.locator('input[name="email"]').fill("admin@coop.com");
  await page.locator('input[name="password"]').fill("admin123");
  await page.getByRole("button", { name: "Sign In" }).click();

  await page.waitForURL("**/dashboard/admin");
  await expect(page).toHaveURL(/\/dashboard\/admin$/);
});

import { expect, test } from "@playwright/test";

test("invalid credentials show login error", async ({ page }) => {
  await page.goto("/login");

  await page.locator('input[name="email"]').fill("admin@coop.com");
  await page.locator('input[name="password"]').fill("wrong-password");
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page.getByText("Invalid credentials")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

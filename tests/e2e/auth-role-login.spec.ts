import { expect, test } from "@playwright/test";

type LoginCase = {
  email: string;
  password: string;
  dashboardPath: string;
};

const cases: LoginCase[] = [
  { email: "manager@coop.com", password: "manager123", dashboardPath: "/dashboard/manager" },
  { email: "clerk@coop.com", password: "clerk123", dashboardPath: "/dashboard/clerk" },
  { email: "auditor@coop.com", password: "auditor123", dashboardPath: "/dashboard/auditor" },
];

for (const entry of cases) {
  test(`user ${entry.email} reaches ${entry.dashboardPath}`, async ({ page }) => {
    await page.goto("/login");

    await page.locator('input[name="email"]').fill(entry.email);
    await page.locator('input[name="password"]').fill(entry.password);
    await page.getByRole("button", { name: "Sign In" }).click();

    await page.waitForURL(`**${entry.dashboardPath}`);
    await expect(page).toHaveURL(new RegExp(`${entry.dashboardPath}$`));
  });
}

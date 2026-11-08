import { expect, test } from "@playwright/test";

const slug = process.env.TEST_EVENT_SLUG;

test("login page renders in Hebrew RTL with the form", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("#email")).toBeVisible();
  await expect(page.locator("#password")).toBeVisible();
});

test("unknown invitation shows not found", async ({ page }) => {
  const res = await page.goto("/e/this-slug-does-not-exist");
  expect(res?.status()).toBe(404);
});

test.describe("registration flow", () => {
  test.skip(!slug, "TEST_EVENT_SLUG not set");

  test("invitation page has the essentials and no horizontal scroll", async ({ page }) => {
    await page.goto(`/e/${slug}`);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator('a[href*="google.com/maps"], a[href*="waze.com"]').first()).toBeVisible();
    await expect(page.locator(`a[href="/e/${slug}/calendar.ics"]`)).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBe(false);
    const og = page.locator('meta[property="og:image"]');
    await expect(og).toHaveAttribute("content", /\/og\.jpg\?v=\d+$/);
  });

  test("invalid phone keeps the typed name and shows an error", async ({ page }) => {
    await page.goto(`/e/${slug}`);
    await page.fill("#full_name", "בדיקה אוטומטית");
    await page.fill("#phone", "12");
    await page.click("form button[type=submit]");
    await expect(page.locator("form [role=alert]")).toBeVisible();
    await expect(page.locator("#full_name")).toHaveValue("בדיקה אוטומטית");
  });

  test("register, then re-register with the same phone updates", async ({ page }) => {
    const phone = `058${String(Math.floor(1000000 + Math.random() * 8999999))}`;
    await page.goto(`/e/${slug}`);
    await page.fill("#full_name", "בדיקה אוטומטית");
    await page.fill("#phone", phone);
    await page.selectOption("#guest_count", "2");
    await page.fill("#guest_name_1", "אורח נוסף");
    await page.click("form button[type=submit]");
    await expect(page.locator("[role=status]")).toContainText(/תודה|Thank you/);

    await page.goto(`/e/${slug}`);
    await page.fill("#full_name", "בדיקה אוטומטית");
    await page.fill("#phone", phone);
    await page.click("form button[type=submit]");
    await expect(page.locator("[role=status]")).toContainText(/עודכנה|updated/);
  });
});

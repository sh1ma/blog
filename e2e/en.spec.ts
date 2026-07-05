import { expect, test } from "@playwright/test"

test.describe("英語版ページ", () => {
  test("/en に英語版ホームが表示される", async ({ page }) => {
    await page.goto("/en")
    await expect(
      page.locator("main h2", { hasText: "Latest Writings" }),
    ).toBeVisible()
    await expect(page.locator("main article").first()).toBeVisible()
  })

  test("/en 上の記事カードから英語版記事に遷移できる", async ({ page }) => {
    await page.goto("/en")
    await page.locator("main article").first().click()
    await expect(page).toHaveURL(/\/en\/articles\/.+/)
  })

  test("/en/about に英語版 About が表示される", async ({ page }) => {
    await page.goto("/en/about")
    await expect(page.locator("main h2", { hasText: "sh1ma" })).toBeVisible()
    await expect(page.getByText("About me")).toBeVisible()
    await expect(page.getByText("I'm a software engineer.")).toBeVisible()
  })

  test("日本語版ホームから英語版への導線がある", async ({ page }) => {
    await page.goto("/")
    const link = page.getByRole("link", { name: "Read in English" })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute("href", "/en")
  })

  test("日本語版 About から英語版への導線がある", async ({ page }) => {
    await page.goto("/about")
    const link = page.getByRole("link", { name: "Read in English" })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute("href", "/en/about")
  })

  test("英語版ホームから日本語版への導線がある", async ({ page }) => {
    await page.goto("/en")
    const link = page.getByRole("link", { name: "日本語で読む" })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute("href", "/")
  })

  test("英語版 About から日本語版への導線がある", async ({ page }) => {
    await page.goto("/en/about")
    const link = page.getByRole("link", { name: "日本語で読む" })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute("href", "/about")
  })
})

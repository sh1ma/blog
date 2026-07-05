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

  test("日本語版ホームのヘッダーに英語版への吊り下げバーがある", async ({
    page,
  }) => {
    await page.goto("/")
    const tab = page.getByTestId("language-tab")
    await expect(tab).toBeVisible()
    await expect(tab).toHaveText(/Read in English/)
    await expect(tab).toHaveAttribute("href", "/en")
  })

  test("日本語版 About のヘッダーに英語版への吊り下げバーがある", async ({
    page,
  }) => {
    await page.goto("/about")
    const tab = page.getByTestId("language-tab")
    await expect(tab).toBeVisible()
    await expect(tab).toHaveAttribute("href", "/en/about")
  })

  test("英語版ホームのヘッダーに日本語版への吊り下げバーがある", async ({
    page,
  }) => {
    await page.goto("/en")
    const tab = page.getByTestId("language-tab")
    await expect(tab).toBeVisible()
    await expect(tab).toHaveText(/日本語版はこちら/)
    await expect(tab).toHaveAttribute("href", "/")
  })

  test("英語版 About のヘッダーに日本語版への吊り下げバーがある", async ({
    page,
  }) => {
    await page.goto("/en/about")
    const tab = page.getByTestId("language-tab")
    await expect(tab).toBeVisible()
    await expect(tab).toHaveAttribute("href", "/about")
  })

  test("インデックス本文に翻訳バナーは表示されない", async ({ page }) => {
    await page.goto("/")
    await expect(
      page.getByText("An English version of this article is available."),
    ).toHaveCount(0)
  })

  test("About 本文に翻訳バナーは表示されない", async ({ page }) => {
    await page.goto("/about")
    await expect(
      page.getByText("An English version of this article is available."),
    ).toHaveCount(0)
  })

  test("日本語ページでは <html lang=\"ja\">", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("html")).toHaveAttribute("lang", "ja")
  })

  test("英語ページでは <html lang=\"en\">", async ({ page }) => {
    await page.goto("/en")
    await expect(page.locator("html")).toHaveAttribute("lang", "en")
  })

  test("SPA 遷移 (ja→en) で lang が en に切り替わる", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("html")).toHaveAttribute("lang", "ja")
    await page.getByTestId("language-tab").click()
    await expect(page).toHaveURL(/\/en$/)
    await expect(page.locator("html")).toHaveAttribute("lang", "en")
  })

  test("SPA 遷移 (en→ja) で lang が ja に戻る", async ({ page }) => {
    await page.goto("/en")
    await expect(page.locator("html")).toHaveAttribute("lang", "en")
    await page.getByTestId("language-tab").click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator("html")).toHaveAttribute("lang", "ja")
  })
})

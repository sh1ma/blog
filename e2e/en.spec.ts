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

  test("Read in English 吊り下げバーはどのページにも存在しない", async ({
    page,
  }) => {
    for (const path of [
      "/",
      "/about",
      "/en",
      "/en/about",
      "/articles/20250510_toughpad-fz-g1-buttons-doesnt-work-on-mobian",
      "/en/articles/20250510_toughpad-fz-g1-buttons-doesnt-work-on-mobian",
    ]) {
      await page.goto(path)
      await expect(page.getByTestId("language-tab")).toHaveCount(0)
    }
  })

  test("デスクトップ nav に英語版へのリンクがある", async ({ page }) => {
    await page.goto("/")
    const link = page.getByTestId("desktop-nav-language-link")
    await expect(link).toBeVisible()
    await expect(link).toHaveText(/English/)
    await expect(link).toHaveAttribute("href", "/en")
  })

  test("デスクトップ nav の日本語版リンク (en→ja)", async ({ page }) => {
    await page.goto("/en")
    const link = page.getByTestId("desktop-nav-language-link")
    await expect(link).toBeVisible()
    await expect(link).toHaveText(/日本語/)
    await expect(link).toHaveAttribute("href", "/")
  })

  test("日本語版ホームのモバイル nav に英語版へのリンクがある", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/")
    const link = page.getByTestId("mobile-nav-language-link")
    await expect(link).toBeVisible()
    await expect(link).toHaveText(/English/)
    await expect(link).toHaveAttribute("href", "/en")
  })

  test("日本語版 About のモバイル nav に英語版へのリンクがある", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/about")
    const link = page.getByTestId("mobile-nav-language-link")
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute("href", "/en/about")
  })

  test("英語版ホームのモバイル nav に日本語版へのリンクがある", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/en")
    const link = page.getByTestId("mobile-nav-language-link")
    await expect(link).toBeVisible()
    await expect(link).toHaveText(/日本語/)
    await expect(link).toHaveAttribute("href", "/")
  })

  test("英語版 About のモバイル nav に日本語版へのリンクがある", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/en/about")
    const link = page.getByTestId("mobile-nav-language-link")
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute("href", "/about")
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

  test('日本語ページでは <html lang="ja">', async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("html")).toHaveAttribute("lang", "ja")
  })

  test('英語ページでは <html lang="en">', async ({ page }) => {
    await page.goto("/en")
    await expect(page.locator("html")).toHaveAttribute("lang", "en")
  })

  test("モバイル nav の英語版リンク (ja→en) をクリックすると lang が en の HTML が読まれる", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/")
    await expect(page.locator("html")).toHaveAttribute("lang", "ja")
    await page.getByTestId("mobile-nav-language-link").click()
    await expect(page).toHaveURL(/\/en\/?$/)
    await expect(page.locator("html")).toHaveAttribute("lang", "en")
  })

  test("モバイル nav の日本語版リンク (en→ja) をクリックすると lang が ja の HTML が読まれる", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/en")
    await expect(page.locator("html")).toHaveAttribute("lang", "en")
    await page.getByTestId("mobile-nav-language-link").click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator("html")).toHaveAttribute("lang", "ja")
  })
})

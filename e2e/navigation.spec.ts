import { expect, test } from "@playwright/test"

test.describe("ナビゲーション", () => {
  test("Articlesページでナビゲーションがハイライトされる", async ({ page }) => {
    await page.goto("/")

    // Articlesリンクがハイライトされている（可視のデスクトップ nav を対象）
    const articlesLink = page
      .locator('nav a[href="/"]')
      .filter({ visible: true })
    await expect(articlesLink).toHaveClass(/border-brand-primary/)
    await expect(articlesLink).toHaveClass(/text-brand-primary/)
  })

  test("Aboutページに遷移するとナビゲーションがハイライトされる", async ({
    page,
  }) => {
    await page.goto("/")

    // Aboutリンクをクリック（可視のデスクトップ nav を対象）
    const aboutLink = page
      .locator('nav a[href="/about"]')
      .filter({ visible: true })
    await aboutLink.click()

    // Aboutページに遷移
    await expect(page).toHaveURL("/about")

    // Aboutリンクがハイライトされている
    await expect(aboutLink).toHaveClass(/border-brand-primary/)
    await expect(aboutLink).toHaveClass(/text-brand-primary/)

    // Articlesリンクはハイライトされていない
    const articlesLink = page
      .locator('nav a[href="/"]')
      .filter({ visible: true })
    await expect(articlesLink).not.toHaveClass(/border-brand-primary/)
  })
})

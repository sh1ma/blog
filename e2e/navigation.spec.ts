import { test, expect } from "@playwright/test"

test.describe("ナビゲーション", () => {
  test("Articlesページでナビゲーションがハイライトされる", async ({ page }) => {
    await page.goto("/")

    // Articlesリンクがハイライトされている
    const articlesLink = page.locator('nav a[href="/"]')
    await expect(articlesLink).toHaveClass(/border-brand-primary/)
    await expect(articlesLink).toHaveClass(/text-brand-primary/)
  })

  test("Tweetsページに遷移するとナビゲーションがハイライトされる", async ({
    page,
  }) => {
    await page.goto("/")

    // Tweetsリンクをクリック
    const tweetsLink = page.locator('nav a[href="/tweets"]')
    await tweetsLink.click()

    // Tweetsページに遷移
    await expect(page).toHaveURL("/tweets")

    // Tweetsリンクがハイライトされている
    await expect(tweetsLink).toHaveClass(/border-brand-primary/)
    await expect(tweetsLink).toHaveClass(/text-brand-primary/)

    // Articlesリンクはハイライトされていない
    const articlesLink = page.locator('nav a[href="/"]')
    await expect(articlesLink).not.toHaveClass(/border-brand-primary/)
  })

  test("Aboutページに遷移するとナビゲーションがハイライトされる", async ({
    page,
  }) => {
    await page.goto("/")

    // Aboutリンクをクリック
    const aboutLink = page.locator('nav a[href="/about"]')
    await aboutLink.click()

    // Aboutページに遷移
    await expect(page).toHaveURL("/about")

    // Aboutリンクがハイライトされている
    await expect(aboutLink).toHaveClass(/border-brand-primary/)
    await expect(aboutLink).toHaveClass(/text-brand-primary/)

    // Articlesリンクはハイライトされていない
    const articlesLink = page.locator('nav a[href="/"]')
    await expect(articlesLink).not.toHaveClass(/border-brand-primary/)
  })
})

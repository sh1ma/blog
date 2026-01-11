import { test, expect } from "@playwright/test"

test.describe("Visual Regression Tests", () => {
  test.describe("トップページ", () => {
    test("フルページスクリーンショット", async ({ page }) => {
      await page.goto("/")
      await page.waitForLoadState("networkidle")
      // 動的コンテンツの安定化待機
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot("home-page.png", {
        fullPage: true,
        animations: "disabled",
      })
    })
  })

  test.describe("記事ページ", () => {
    // テスト用の記事slug
    const testArticleSlug = "20230102_helloworld"

    test("記事フルページスクリーンショット", async ({ page }) => {
      await page.goto(`/articles/${testArticleSlug}`)
      await page.waitForLoadState("networkidle")
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot("article-page.png", {
        fullPage: true,
        animations: "disabled",
        mask: [
          page.locator("footer button"), // いいねカウンターをマスク（動的）
        ],
      })
    })
  })
})

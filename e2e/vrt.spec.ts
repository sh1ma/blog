import { test, expect } from "@playwright/test"

test.describe("Visual Regression Tests", () => {
  test.describe("トップページ", () => {
    test("フルページスクリーンショット", async ({ page }) => {
      await page.goto("/")
      await page.waitForLoadState("networkidle")
      // 動的コンテンツ（記事リスト）が表示されるまで待機
      await page.locator("main").waitFor({ state: "visible" })

      await expect(page).toHaveScreenshot("home-page.png", {
        fullPage: true,
        animations: "disabled",
      })
    })
  })

  test.describe("記事ページ", () => {
    // テスト用の記事slug（リポジトリに存在する記事）
    const testArticleSlug = "20230102_helloworld"

    test("記事フルページスクリーンショット", async ({ page }) => {
      // 記事ページにアクセス
      const response = await page.goto(`/articles/${testArticleSlug}`)

      // 記事が存在することを確認（404でないこと）
      expect(response?.status()).not.toBe(404)

      await page.waitForLoadState("networkidle")
      // 記事本文が表示されるまで待機
      await page.locator("main").waitFor({ state: "visible" })

      await expect(page).toHaveScreenshot("article-page.png", {
        fullPage: true,
        animations: "disabled",
        mask: [
          page.locator("footer button"), // いいねカウンターをマスク（動的）
        ],
      })
    })
  })

  test.describe("Tweetsページ", () => {
    test("ツイート一覧フルページスクリーンショット", async ({ page }) => {
      await page.goto("/tweets")
      await page.waitForLoadState("networkidle")
      await page.locator("article").first().waitFor({ state: "visible" })

      await expect(page).toHaveScreenshot("tweets-page.png", {
        fullPage: true,
        animations: "disabled",
      })
    })
  })
})

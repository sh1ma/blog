import { test, expect } from "@playwright/test"

test.describe("トップページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("「最新の記事」セクションが表示される", async ({ page }) => {
    const articlesHeading = page.locator("h2", { hasText: "Latest Writings" })
    await expect(articlesHeading).toBeVisible()
  })

  test("記事リストが表示される", async ({ page }) => {
    // 記事リスト（article要素）が存在することを確認
    const articleList = page.locator("main article")

    // 少なくとも1つ以上の記事が表示されている
    await expect(articleList.first()).toBeVisible()

    // 記事にはタイトル（h3）と日付（time）が含まれる
    const firstArticle = articleList.first()
    await expect(firstArticle.locator("h3")).toBeVisible()
    await expect(firstArticle.locator("time")).toBeVisible()
  })
})

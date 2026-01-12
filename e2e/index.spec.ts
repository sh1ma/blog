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

  test("記事カードのメタ情報が横並びで表示される", async ({ page }) => {
    const firstArticle = page.locator("main article").first()

    // メタ情報の親要素を取得
    const metaInfo = firstArticle.locator(
      "div.flex.flex-wrap.items-center.gap-3",
    )
    await expect(metaInfo).toBeVisible()

    // カレンダーアイコン（日付）が表示される
    const calendarIcon = metaInfo.locator('svg[class*="lucide-calendar"]')
    await expect(calendarIcon).toBeVisible()

    // 時計アイコン（読了時間）が表示される
    const clockIcon = metaInfo.locator('svg[class*="lucide-clock"]')
    await expect(clockIcon).toBeVisible()

    // ハートアイコン（いいね数）が表示される
    const heartIcon = metaInfo.locator('svg[class*="lucide-heart"]')
    await expect(heartIcon).toBeVisible()

    // 3つのメタ情報が同じ行に表示されていることを確認
    // すべての要素が表示されており、親要素がflexレイアウトであることを確認
    const calendarBox = await calendarIcon.boundingBox()
    const clockBox = await clockIcon.boundingBox()
    const heartBox = await heartIcon.boundingBox()

    // すべての要素が取得できることを確認
    expect(calendarBox).not.toBeNull()
    expect(clockBox).not.toBeNull()
    expect(heartBox).not.toBeNull()

    // Y座標がほぼ同じ（±10px程度の許容範囲）であることを確認
    if (calendarBox && clockBox && heartBox) {
      expect(Math.abs(calendarBox.y - clockBox.y)).toBeLessThan(10)
      expect(Math.abs(clockBox.y - heartBox.y)).toBeLessThan(10)
    }
  })

  test("記事カード全体がクリック可能", async ({ page }) => {
    const firstArticle = page.locator("main article").first()

    // 記事タイトルを取得
    const title = await firstArticle.locator("h3").textContent()

    // カード全体（説明文など、以前はクリック不可能だった部分）をクリック
    // カード要素自体をクリックすることで、カード全体がクリック可能になったことを確認
    await firstArticle.click()

    // 記事詳細ページに遷移することを確認
    await expect(page).toHaveURL(/\/articles\/.+/)

    const articleTitle = page.locator("article h1")
    await expect(articleTitle).toHaveText(title || "")
  })
})

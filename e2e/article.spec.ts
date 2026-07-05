import { expect, test } from "@playwright/test"

test.describe("記事ページ", () => {
  // テスト用の記事slug（実在する記事を使用）
  const testArticleSlug = "20230102_helloworld"

  test("トップページから記事に遷移できる", async ({ page }) => {
    await page.goto("/")

    // 最初の記事タイトルをクリック
    const firstArticleTitle = page.locator("article h3").first()
    await firstArticleTitle.click()

    // 記事ページに遷移したことを確認
    await expect(page).toHaveURL(/\/articles\/.+/)
  })

  test("記事タイトルが表示される", async ({ page }) => {
    await page.goto(`/articles/${testArticleSlug}`)

    // h1タグでタイトルが表示される
    const title = page.locator("article h1")
    await expect(title).toBeVisible()
    await expect(title).toHaveText("ブログを始めました")
  })

  test("公開日が表示される", async ({ page }) => {
    await page.goto(`/articles/${testArticleSlug}`)

    // 記事ヘッダー内に日付が表示される
    const articleHeader = page.locator("article > header")
    await expect(articleHeader).toContainText("2023-11-09")
  })

  test("記事本文が表示される", async ({ page }) => {
    await page.goto(`/articles/${testArticleSlug}`)

    // 記事本文コンテナ（article内のmain）
    const articleContent = page.locator("article main.prose")
    await expect(articleContent).toBeVisible()

    // 記事内に特定のテキストが含まれることを確認
    await expect(articleContent).toContainText("ブログを始めました")
  })

  test("存在しない記事は404を表示する", async ({ page }) => {
    await page.goto("/articles/non-existent-article-slug")

    // 404表示を確認
    await expect(page.getByText("404")).toBeVisible()
  })
})

test.describe("英語版記事", () => {
  const bilingualSlug = "20250510_toughpad-fz-g1-buttons-doesnt-work-on-mobian"

  test("英語版が存在する記事の日本語版に英語版への導線が出る", async ({
    page,
  }) => {
    await page.goto(`/articles/${bilingualSlug}`)
    const tab = page.getByTestId("language-tab")
    await expect(tab).toBeVisible()
    await expect(tab).toHaveAttribute("href", `/en/articles/${bilingualSlug}`)
    const notice = page.locator("article").getByRole("link", {
      name: "Read in English",
    })
    await expect(notice).toBeVisible()
    await expect(notice).toHaveAttribute(
      "href",
      `/en/articles/${bilingualSlug}`,
    )
  })

  test("英語版 URL でアクセスすると英語タイトルが表示される", async ({
    page,
  }) => {
    await page.goto(`/en/articles/${bilingualSlug}`)
    const title = page.locator("article h1")
    await expect(title).toBeVisible()
    await expect(title).toHaveText(
      "Making the TOUGHPAD A1/A2 Buttons Work on Mobian (Debian)",
    )
  })

  test("英語版ページから日本語版への導線が出る", async ({ page }) => {
    await page.goto(`/en/articles/${bilingualSlug}`)
    const tab = page.getByTestId("language-tab")
    await expect(tab).toBeVisible()
    await expect(tab).toHaveAttribute("href", `/articles/${bilingualSlug}`)
    const notice = page.locator("article").getByRole("link", {
      name: "日本語で読む",
    })
    await expect(notice).toBeVisible()
    await expect(notice).toHaveAttribute("href", `/articles/${bilingualSlug}`)
  })

  test("存在しない slug で /en/articles/ にアクセスすると404", async ({
    page,
  }) => {
    await page.goto("/en/articles/non-existent-article-slug")
    await expect(page.getByText("404")).toBeVisible()
  })
})

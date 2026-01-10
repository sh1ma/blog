import { test, expect } from "@playwright/test";

test.describe("記事ページ", () => {
  // テスト用の記事slug（実在する記事を使用）
  const testArticleSlug = "20230102_helloworld";

  test("トップページから記事に遷移できる", async ({ page }) => {
    await page.goto("/");

    // 最初の記事をクリック
    const firstArticle = page.locator("main ul li").first();
    await firstArticle.click();

    // 記事ページに遷移したことを確認
    await expect(page).toHaveURL(/\/articles\/.+/);
  });

  test("記事タイトルが表示される", async ({ page }) => {
    await page.goto(`/articles/${testArticleSlug}`);

    // h2タグでタイトルが表示される
    const title = page.locator("h2.font-bold");
    await expect(title).toBeVisible();
    await expect(title).toHaveText("ブログを始めました");
  });

  test("公開日が表示される", async ({ page }) => {
    await page.goto(`/articles/${testArticleSlug}`);

    // 記事ヘッダー内に日付が表示される（main内のheader）
    const articleHeader = page.locator("main").locator("..").locator("header").first();
    await expect(articleHeader).toContainText("2023-11-09");
  });

  test("記事本文が表示される", async ({ page }) => {
    await page.goto(`/articles/${testArticleSlug}`);

    // proseクラスを持つ記事本文コンテナ
    const articleContent = page.locator(".prose");
    await expect(articleContent).toBeVisible();

    // 記事内に特定のテキストが含まれることを確認
    await expect(articleContent).toContainText("ブログを始めました");
  });

  test("いいねボタンが表示される", async ({ page }) => {
    await page.goto(`/articles/${testArticleSlug}`);

    // footer内のボタン
    const likeButton = page.locator("footer button");
    await expect(likeButton).toBeVisible();
  });

  test("存在しない記事は404を表示する", async ({ page }) => {
    await page.goto("/articles/non-existent-article-slug");

    // 404表示を確認（div要素内の404テキスト）
    await expect(page.locator("div").filter({ hasText: /^404$/ })).toBeVisible();
  });
});

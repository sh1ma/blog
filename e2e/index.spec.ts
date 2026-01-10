import { test, expect } from "@playwright/test";

test.describe("トップページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("「最新の記事」セクションが表示される", async ({ page }) => {
    const articlesHeading = page.locator("h2", { hasText: "最新の記事" });
    await expect(articlesHeading).toBeVisible();
  });

  test("記事リストが表示される", async ({ page }) => {
    // 記事リスト（ul内のli要素）が存在することを確認
    const articleList = page.locator("main ul li");

    // 少なくとも1つ以上の記事が表示されている
    await expect(articleList.first()).toBeVisible();

    // 記事にはタイトル（h3）と日付（time）が含まれる
    const firstArticle = articleList.first();
    await expect(firstArticle.locator("h3")).toBeVisible();
    await expect(firstArticle.locator("time")).toBeVisible();
  });

  test("「最新のつぶやき」セクションが表示される", async ({ page }) => {
    const tweetsHeading = page.locator("h2", { hasText: "最新のつぶやき" });
    await expect(tweetsHeading).toBeVisible();
  });

  test("ツイートリストが5件表示される", async ({ page }) => {
    // つぶやきセクション内のツイート（preタグを含むli）
    const tweetItems = page.locator("aside ul li").filter({ has: page.locator("pre") });

    // 5件のツイートが表示されている
    await expect(tweetItems).toHaveCount(5);
  });

  test("「もっと見る」リンクが存在する", async ({ page }) => {
    const moreLink = page.locator("a", { hasText: "もっと見る" });
    await expect(moreLink).toBeVisible();
    await expect(moreLink).toHaveAttribute("href", "/tweets");
  });
});

import { test, expect } from "@playwright/test"

test.describe("Tweetsページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tweets")
  })

  test("長いツイートが正しく表示される（テキストが折り返される）", async ({
    page,
  }) => {
    // ツイート要素を取得
    const tweetContent = page.locator("article pre").first()
    await expect(tweetContent).toBeVisible()

    // テキストが折り返されることを確認
    // preタグにwhitespace-pre-wrapクラスが適用されている
    await expect(tweetContent).toHaveClass(/whitespace-pre-wrap/)

    // テキストが親要素からはみ出していないことを確認
    const isOverflowing = await tweetContent.evaluate((element) => {
      const parent = element.parentElement
      if (!parent) return false
      return element.scrollWidth > parent.clientWidth
    })
    expect(isOverflowing).toBe(false)
  })

  test("ツイートのアイコンと名前が横並びで表示される", async ({ page }) => {
    // 最初のツイートを取得
    const firstTweet = page.locator("article").first()

    // アイコンを取得
    const icon = firstTweet.locator("img").first()
    await expect(icon).toBeVisible()

    // 名前を含む要素を取得
    const userInfo = firstTweet.locator("span").filter({ hasText: /@/ }).first()
    await expect(userInfo).toBeVisible()

    // アイコンと名前の配置を確認
    const iconBox = await icon.boundingBox()
    const userInfoBox = await userInfo.boundingBox()

    if (!iconBox || !userInfoBox) {
      throw new Error("要素の位置を取得できませんでした")
    }

    // アイコンと名前が横並び（アイコンのY座標と名前のY座標が近い）
    const yDiff = Math.abs(iconBox.y - userInfoBox.y)
    expect(yDiff).toBeLessThan(50) // 50px以内であれば横並びと判断

    // アイコンが左、名前が右
    expect(iconBox.x).toBeLessThan(userInfoBox.x)
  })

  test("ツイートのレイアウトがTwitter風になっている", async ({ page }) => {
    // 最初のツイートを取得
    const firstTweet = page.locator("article").first()

    // grid-cols-[auto_1fr]が適用されている
    await expect(firstTweet).toHaveClass(/grid-cols-\[auto_1fr\]/)

    // アイコンエリアが存在
    const iconArea = firstTweet.locator("div").first()
    const icon = iconArea.locator("img")
    await expect(icon).toBeVisible()

    // 名前、ユーザー名、時刻が横並びになっている
    const userName = firstTweet.locator("span.font-semibold.text-text-primary")
    const screenName = firstTweet.locator("span.text-text-muted").first()
    const time = firstTweet.locator("time")

    await expect(userName).toBeVisible()
    await expect(screenName).toBeVisible()
    await expect(time).toBeVisible()

    // すべて同じ行にあることを確認（Y座標が近い）
    const userNameBox = await userName.boundingBox()
    const screenNameBox = await screenName.boundingBox()
    const timeBox = await time.boundingBox()

    if (!userNameBox || !screenNameBox || !timeBox) {
      throw new Error("要素の位置を取得できませんでした")
    }

    const yDiff1 = Math.abs(userNameBox.y - screenNameBox.y)
    const yDiff2 = Math.abs(screenNameBox.y - timeBox.y)
    expect(yDiff1).toBeLessThan(10)
    expect(yDiff2).toBeLessThan(10)
  })
})

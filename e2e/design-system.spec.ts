import { test, expect } from "@playwright/test"

test.describe("デザインシステム - ライトテーマ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("背景色がライトテーマの色になっている", async ({ page }) => {
    // body要素の背景色を取得
    const backgroundColor = await page.evaluate(() => {
      const body = document.querySelector("body")
      if (!body) return null
      return window.getComputedStyle(body).backgroundColor
    })

    // --bg-base の色 (#f0f2ff) は rgb(240, 242, 255)
    expect(backgroundColor).toBe("rgb(240, 242, 255)")
  })

  test("カード背景色がライトテーマの色になっている", async ({ page }) => {
    // 記事カード内のarticle要素の背景色を取得
    const cardBackgroundColor = await page.evaluate(() => {
      const article = document.querySelector("main ul li article")
      if (!article) return null
      return window.getComputedStyle(article).backgroundColor
    })

    // bg-white の色 (#ffffff) は rgb(255, 255, 255)
    expect(cardBackgroundColor).toBe("rgb(255, 255, 255)")
  })

  test("フォントファミリーにInterとNoto Sans JPが含まれている", async ({ page }) => {
    const fontFamily = await page.evaluate(() => {
      const body = document.querySelector("body")
      if (!body) return null
      return window.getComputedStyle(body).fontFamily
    })

    // フォントファミリーに "Inter" と "Noto Sans JP" が含まれる
    expect(fontFamily).toContain("Inter")
    expect(fontFamily).toContain("Noto Sans JP")
  })

  test("見出しの色がブランドカラーになっている", async ({ page }) => {
    const h2Color = await page.evaluate(() => {
      const heading = document.querySelector("h2")
      if (!heading) return null
      return window.getComputedStyle(heading).color
    })

    const h3Color = await page.evaluate(() => {
      const heading = document.querySelector("h3")
      if (!heading) return null
      return window.getComputedStyle(heading).color
    })

    // h2は text-primary-dark (#3a38a0) を使用 -> rgb(58, 56, 160)
    expect(h2Color).toBe("rgb(58, 56, 160)")

    // h3は text-primary-default (#514fc9) を使用 -> rgb(81, 79, 201)
    expect(h3Color).toBe("rgb(81, 79, 201)")
  })

  test("ヘッダーリンクの色が白色になっている", async ({ page }) => {
    const headerLinkColor = await page.evaluate(() => {
      const link = document.querySelector("header a")
      if (!link) return null
      return window.getComputedStyle(link).color
    })

    // ヘッダーのリンクは text-white -> rgb(255, 255, 255)
    expect(headerLinkColor).toBe("rgb(255, 255, 255)")
  })
})

test.describe("デザインシステム - ダークモードでもライトテーマを維持", () => {
  test.beforeEach(async ({ page }) => {
    // OSのダークモード設定をエミュレート
    await page.emulateMedia({ colorScheme: "dark" })
    await page.goto("/")
  })

  test("ダークモード設定でも背景色がライトテーマのまま", async ({ page }) => {
    const backgroundColor = await page.evaluate(() => {
      const body = document.querySelector("body")
      if (!body) return null
      return window.getComputedStyle(body).backgroundColor
    })

    // ライトテーマの色 (#f0f2ff) は rgb(240, 242, 255) のまま
    expect(backgroundColor).toBe("rgb(240, 242, 255)")
  })

  test("ダークモード設定でもカード背景色がライトテーマのまま", async ({
    page,
  }) => {
    const cardBackgroundColor = await page.evaluate(() => {
      const article = document.querySelector("main ul li article")
      if (!article) return null
      return window.getComputedStyle(article).backgroundColor
    })

    // ライトテーマの色 (#ffffff) は rgb(255, 255, 255) のまま
    expect(cardBackgroundColor).toBe("rgb(255, 255, 255)")
  })

  test("ダークモード設定でもヘッダー背景色がライトテーマのまま", async ({
    page,
  }) => {
    const headerBackgroundColor = await page.evaluate(() => {
      const header = document.querySelector("header")
      if (!header) return null
      return window.getComputedStyle(header).backgroundColor
    })

    // ヘッダー背景色は bg-primary-default (#514fc9) -> rgb(81, 79, 201)
    expect(headerBackgroundColor).toBe("rgb(81, 79, 201)")
  })
})

test.describe("デザインシステム - CSS変数の定義確認", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("CSS変数が正しく定義されている", async ({ page }) => {
    const cssVariables = await page.evaluate(() => {
      const root = document.documentElement
      const styles = window.getComputedStyle(root)

      return {
        bgBase: styles.getPropertyValue("--bg-base").trim(),
        bgSurface: styles.getPropertyValue("--bg-surface").trim(),
        textPrimary: styles.getPropertyValue("--text-primary").trim(),
        textLink: styles.getPropertyValue("--text-link").trim(),
        brandPrimary: styles.getPropertyValue("--brand-primary").trim(),
      }
    })

    // プリミティブカラーが正しく定義されている
    expect(cssVariables.bgBase).toBe("#f0f2ff")
    expect(cssVariables.bgSurface).toBe("#ffffff")
    expect(cssVariables.textPrimary).toBe("#1a1a2e")
    expect(cssVariables.textLink).toBe("#514fc9")
    expect(cssVariables.brandPrimary).toBe("#514fc9")
  })

  test("ダークテーマのCSS変数が定義されていない", async ({ page }) => {
    // ダークモードをエミュレート
    await page.emulateMedia({ colorScheme: "dark" })
    await page.goto("/")

    const cssVariables = await page.evaluate(() => {
      const root = document.documentElement
      const styles = window.getComputedStyle(root)

      return {
        bgBase: styles.getPropertyValue("--bg-base").trim(),
        bgSurface: styles.getPropertyValue("--bg-surface").trim(),
      }
    })

    // ダークモードでもライトテーマの値のまま
    expect(cssVariables.bgBase).toBe("#f0f2ff")
    expect(cssVariables.bgSurface).toBe("#ffffff")
  })
})

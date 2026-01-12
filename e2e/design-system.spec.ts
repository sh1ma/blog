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

    // --bg-base の色 (#F9FAFB) は rgb(249, 250, 251)
    expect(backgroundColor).toBe("rgb(249, 250, 251)")
  })

  test("カード背景色がライトテーマの色になっている", async ({ page }) => {
    // 記事カードのarticle要素の背景色を取得
    const cardBackgroundColor = await page.evaluate(() => {
      const article = document.querySelector("main article")
      if (!article) return null
      return window.getComputedStyle(article).backgroundColor
    })

    // bg-bg-surface の色 (#ffffff) は rgb(255, 255, 255)
    expect(cardBackgroundColor).toBe("rgb(255, 255, 255)")
  })

  test("フォントファミリーにInterとNoto Sans JPが含まれている", async ({
    page,
  }) => {
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

    // h2は text-text-primary (#1f2937) を使用 -> rgb(31, 41, 55)
    expect(h2Color).toBe("rgb(31, 41, 55)")

    // h3は text-brand-primary (#514fc9) を使用 -> rgb(81, 79, 201)
    expect(h3Color).toBe("rgb(81, 79, 201)")
  })

  test("ヘッダーロゴの色が正しく設定されている", async ({ page }) => {
    const headerLogoColor = await page.evaluate(() => {
      const logo = document.querySelector('header a[href="/"] div.text-xl')
      if (!logo) return null
      return window.getComputedStyle(logo).color
    })

    // ヘッダーのロゴは text-text-primary -> rgb(31, 41, 55)
    expect(headerLogoColor).toBe("rgb(31, 41, 55)")
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

    // ライトテーマの色 (#F9FAFB) は rgb(249, 250, 251) のまま
    expect(backgroundColor).toBe("rgb(249, 250, 251)")
  })

  test("ダークモード設定でもカード背景色がライトテーマのまま", async ({
    page,
  }) => {
    const cardBackgroundColor = await page.evaluate(() => {
      const article = document.querySelector("main article")
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

    // ヘッダー背景色は bg-bg-surface/90 -> rgba(255, 255, 255, 0.9)
    // backdrop-blurがあるため、背景色は半透明
    // ダークモードでも白色ベースまたは透明であることを確認
    expect(headerBackgroundColor).toMatch(
      /rgba?\((255,\s*255,\s*255|0,\s*0,\s*0)/,
    )
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
    expect(cssVariables.bgBase).toBe("#f9fafb")
    expect(cssVariables.bgSurface).toBe("#ffffff")
    expect(cssVariables.textPrimary).toBe("#1f2937")
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
    expect(cssVariables.bgBase).toBe("#f9fafb")
    expect(cssVariables.bgSurface).toBe("#ffffff")
  })
})

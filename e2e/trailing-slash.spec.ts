import { expect, test } from "@playwright/test"

test.describe("末尾スラッシュの正規化", () => {
  const cases = [
    { from: "/about/", to: "/about" },
    { from: "/en/", to: "/en" },
    { from: "/en/about/", to: "/en/about" },
    {
      from: "/articles/20230102_helloworld/",
      to: "/articles/20230102_helloworld",
    },
    {
      from: "/en/articles/20230102_helloworld/",
      to: "/en/articles/20230102_helloworld",
    },
  ]

  for (const { from, to } of cases) {
    test(`${from} は 301 で ${to} にリダイレクトされる`, async ({
      request,
    }) => {
      const response = await request.get(from, { maxRedirects: 0 })

      expect(response.status()).toBe(301)
      expect(response.headers().location).toBe(to)
    })
  }

  test("クエリ文字列は保持される", async ({ request }) => {
    const response = await request.get("/about/?utm_source=test", {
      maxRedirects: 0,
    })

    expect(response.status()).toBe(301)
    expect(response.headers().location).toBe("/about?utm_source=test")
  })

  test("ルート (/) はリダイレクトされない", async ({ request }) => {
    const response = await request.get("/", { maxRedirects: 0 })

    expect(response.status()).toBe(200)
  })

  test("末尾スラッシュ無しの URL はリダイレクトされない", async ({
    request,
  }) => {
    const response = await request.get("/articles/20230102_helloworld", {
      maxRedirects: 0,
    })

    expect(response.status()).toBe(200)
  })
})

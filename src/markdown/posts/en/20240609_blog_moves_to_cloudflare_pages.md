---
title: Moving Blog Hosting from Vercel to Cloudflare Pages: ContentLayer Edition
publishedAt: "2024-06-09"
---

I missed writing a blog post in May. In my [2024 Happy New Year article](https://blog.sh1ma.dev/articles/20240101_akeome), I had declared, “I’ll write a blog once a month,” yet it collapsed after only four months... I lack determination.

Yesterday I felt like it was about time to write a blog article, but then I thought I wanted to migrate the blog to Cloudflare, do “real Web” with Edge Runtime, and go to the promised land. After fiddling with the code, the migration succeeded, so this article is an attempt to leave notes on that process. I’m writing from memory, so there may be parts I don’t remember accurately. (I actually wanted to write about a smart speaker I recently made, but I’ll save that for another time.)

This time I’ll talk about the part where I introduced contentlayer.

## Problem

[Next.js can be deployed to Cloudflare Pages](https://nextjs.org/docs/app/api-reference/edge) by using Edge Runtime.  
In Edge Runtime, APIs based on Web standards are available, while packages that use some Node.js APIs such as `fs` and `path` cannot be used. However, this blog depended on Node.js APIs such as `readdir()` from `fs/promises` and `path.join()`, so it could not be migrated as-is.

For example, the following kind of code existed for getting the article list.

```ts
// readdir, pathのimport
import { readdir } from "fs/promises"
import path from "path"

// 記事一覧を取得する関数
// これを記事一覧ページで使っていた
export const getArticles = async () => {
  // .mdxファイルがあるディレクトリからファイル一覧を取得
  const postDirPath = path.join(process.cwd(), "src/markdown/posts")
  const postFilePaths = await readdir(postDirPath)

  const postMetas = await Promise.all(
    // ファイルパス一覧をmapで処理していく
    postFilePath
      .map(async (filePath) => {
        // .mdxファイルから`meta`を一度インポートする。
        // `meta`にはタイトルの情報と公開日の情報が含まれている
        const { meta } = (await import(`@/markdown/posts/${filePath}`)) as {
          meta: { title: string; publishedAt: string }
        }

        // metaと記事のidを生成して返す
        return { ...meta, id: filePath.replace(/\.mdx$/, "") }
      })
      // ソートして降順にする
      .sort()
      .reverse(),
  )
  return postMetas
}
```

Unfortunately, there is nothing in edge runtime that can replace `readdir` or `path.join`. So in this case, it was necessary to fundamentally reconsider the method of “retrieving information from the file system.”

## Solution

In the first place, information such as the article list is determined at build time, so it does not need to be generated dynamically. That means it is enough if the article list can be generated at build time.  
While looking for a good tool, I found a tool called [contentlayer](https://contentlayer.dev/).

contentlayer is a tool for converting information from so-called content files such as .md files into json and making it easy to import into a typescript application.

The conversion from .md files to json only runs once at build time, it provides objects such as `allArticles` (the name `Article` depends on the configuration) for retrieving file lists, and it also adds types to the generated output, and so on... It seemed capable of meeting the earlier goal, and I could also enjoy the advantages above, so this time I adopted contentlayer without comparing it with anything else.

The article that led me to learn about contentlayer was the following.

[Trying Contentlayer, Which Is Very Useful for Personal Blog Development | stin's Blog](https://blog.stin.ink/articles/introduce-contentlayer)

Setup is explained in the [official Getting Started](https://contentlayer.dev/docs/getting-started-cddd76b7), and by following the steps I was able to introduce it without getting particularly stuck.

During setup, I needed to edit a contentlayer configuration file called `contentlayer.config.ts`. Among other things, I had to write a definition for md files like the following, so I’ll show it along with explanatory comments.

```ts

// 記事のmarkdownファイルの定義
export const Article = defineDocumentType(() => ({
  // ここで指定した名前が生成される型の名前になります
  name: "Article",
  // どのようなフォルダに入っているか指定します
  // ここではフルパスは指定しません
  // 下記のmakeSourceに渡すパスの以下をここに記述すればよいです
  filePathPattern: `**/posts/*.md`,
  // contentType: "mdx",

  // フィールドの設定です
  // フィールドではmarkdownのyaml headerに書かれたmetadataを定義しておきます
  fields: {
    title: { type: "string", required: true },
    publishedAt: { type: "date", required: true },
  },
  // computedFieldsは生成時に自動で計算されるメタデータです
  // 自分は記事のidを.mdファイルのファイル名にしたかったのでその定義を行いました
  computedFields: {
    id: {
      type: "string",
      resolve: (doc) => doc._raw.sourceFileName.replace(/\.md$/, ""),
    },
  },
}))

// about.mdの設定
export const About = ...

```

With the configuration above, the part that retrieves the article list only needs the following import.
Note: `contentlayer/generated` is the path where the automatically generated json files are located.

```ts
import { allArticles } from "contentlayer/generated"
```

Previously, retrieving the body and other information for an article page looked like this ↓

```ts
const getContent = async (slug: string) => {
  const { default: Content, meta } = (await import(
    `@/markdown/posts/${slug}.mdx`
  )) as { default: React.FC; meta: { title: string; publishedAt: string } }

  return { Content, meta }
}
```

After introducing contentlayer, it became the following.

```ts
import { allArticles } from "contentlayer/generated"
const post = allArticles.find((post) => post.id === slug)
```

## Summary

By introducing contentlayer, I was able to eliminate code that depended on the file system. I’m happy.

At this point, support for Edge Runtime was already possible, but in order to run contentlayer on Cloudflare Pages, I had to abandon mdx. The reason is that contentlayer’s mdx support is implemented using `eval`. Cloudflare Pages (Workers) does not allow code that uses `eval`. ([EvalError: Code generation from strings disallowed for this context - Developers / Cloudflare Pages - Cloudflare Community](https://community.cloudflare.com/t/evalerror-code-generation-from-strings-disallowed-for-this-context/356430))

[JavaScript and web standards · Cloudflare Workers docs](https://developers.cloudflare.com/workers/runtime-apis/web-standards/#javascript-standards)

> For security reasons, the following are not allowed:
>
> - eval()
> - new Function
> - WebAssembly.compile
> - WebAssembly.compileStreaming
> - WebAssembly.instantiate with a buffer parameter
> - WebAssembly.instantiateStreaming

I currently wasn’t using any mdx-specific features, so I was able to migrate to ordinary md files without any particular problem.

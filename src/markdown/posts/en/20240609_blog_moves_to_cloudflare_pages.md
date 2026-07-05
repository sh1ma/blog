---
title: "Moving the Blog from Vercel to Cloudflare Pages: the Contentlayer Part"
publishedAt: "2024-06-09"
---

I forgot to write a May post. In my [2024 New Year post](https://blog.sh1ma.dev/articles/20240101_akeome) I boldly declared, "I'll write a blog post once a month," and yet it fell apart after just four months. Guess I don't have the grit.

Yesterday I finally felt like writing a post, but then I got the itch to migrate the blog over to Cloudflare, run it on the Edge Runtime, and finally do "real Web" in the promised land. I started poking at the code and actually pulled the migration off, so this post is my attempt to write down the process while it's still fresh. I'm working from memory, so some parts might be a little fuzzy. (I actually wanted to write about a smart speaker I built recently, but I'll save that for next time.)

This time I'll cover the part where I brought in contentlayer.

## The problem

You can deploy Next.js to Cloudflare Pages by using the [Edge Runtime](https://nextjs.org/docs/app/api-reference/edge).  
The Edge Runtime gives you Web-standard APIs, but you can't use packages that rely on parts of Node.js like `fs` or `path`. This blog, however, was leaning on Node.js APIs like `readdir()` from `fs/promises` and `path.join()`, so it couldn't be migrated as-is.

For example, the code for fetching the article list looked something like this:

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

Unfortunately, there's no drop-in replacement for `readdir` or `path.join` on the Edge Runtime. So in this case, I had to rethink the whole "pull information from the filesystem" approach from scratch.

## The fix

Realistically, the article list is fixed at build time and doesn't need to be generated dynamically. So all I really needed was a way to generate the article list at build time.  
While looking for a good tool for this, I found [contentlayer](https://contentlayer.dev/).

Contentlayer converts content files like `.md` into JSON and makes them easy to import from a TypeScript app.

The `.md`-to-JSON conversion runs once at build time, it exposes objects like `allArticles` for grabbing the list of files (the `Article` naming comes from the config), and on top of that everything it generates comes with types... It looked like it could handle what I needed while giving me all those extras, so I went with it without bothering to compare it to anything else.

The article that put contentlayer on my radar was this one:

[個人ブログ開発でとても便利な Contentlayer を導入してみた | stin's Blog](https://blog.stin.ink/articles/introduce-contentlayer)

Setup is walked through in the [official Getting Started guide](https://contentlayer.dev/docs/getting-started-cddd76b7), and following the steps got me set up without much trouble.

Part of setup involves editing contentlayer's config file, `contentlayer.config.ts`. In there, you write out definitions for your `.md` files like the following, so I'll show what I ended up with along with commentary:

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

With the config above, fetching the article list boils down to a single import.
Note: `contentlayer/generated` is the path to the auto-generated JSON files.

```ts
import { allArticles } from "contentlayer/generated"
```

Fetching the body and metadata for an individual article page used to look like this:

```ts
const getContent = async (slug: string) => {
  const { default: Content, meta } = (await import(
    `@/markdown/posts/${slug}.mdx`
  )) as { default: React.FC; meta: { title: string; publishedAt: string } }

  return { Content, meta }
}
```

After bringing in contentlayer, it looks like this:

```ts
import { allArticles } from "contentlayer/generated"
const post = allArticles.find((post) => post.id === slug)
```

## Wrap-up

Bringing in contentlayer let me get rid of the code that depended on the filesystem. Great.

At this point everything was Edge Runtime-compatible, but to actually run contentlayer on Cloudflare Pages I had to drop mdx. The reason is that contentlayer's mdx support is implemented using `eval`, and Cloudflare Pages (Workers) doesn't allow code that uses `eval`. ([EvalError: Code generation from strings disallowed for this context - Developers / Cloudflare Pages - Cloudflare Community](https://community.cloudflare.com/t/evalerror-code-generation-from-strings-disallowed-for-this-context/356430))

[JavaScript and web standards · Cloudflare Workers docs](https://developers.cloudflare.com/workers/runtime-apis/web-standards/#javascript-standards)

> For security reasons, the following are not allowed:
>
> - eval()
> - new Function
> - WebAssembly.compile
> - WebAssembly.compileStreaming
> - WebAssembly.instantiate with a buffer parameter
> - WebAssembly.instantiateStreaming

I wasn't using any mdx-specific features at the time, so switching over to plain `.md` files was painless.

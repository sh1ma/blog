---
title: ブログのホスティングをVercelからCloudflare Pagesに移した ContentLayer編
publishedAt: "2024-06-09"
---

5月のブログを書きそびれました。[2024あけおめ記事](https://blog.sh1ma.dev/articles/20240101_akeome)で「1ヶ月に一回ブログを書く」と啖呵切っていたのにわずか4ヶ月で潰えてしまうとは・・・根性が足りないですね。

昨日そろそろブログ記事を書いてやるかとなったんですが、ブログをCloudflareに移管してEdge Runtimeで"本物のWeb"をやって約束された地に行きたいなとなって、コードがちゃがちゃ弄ってたら移管成功したので、今回の記事ではその過程をメモがてら残そうという試みです。思い出しながらなので記憶定かじゃないところあるかも。（本当は最近作ったスマートスピーカーの記事とか書きたかったんですがまた今度にします)

今回はcontentlayerを導入した部分について話そうと思います。

## 課題

[Next.jsはEdge Runtime](https://nextjs.org/docs/app/api-reference/edge)を使うことによってCloudflare Pagesにデプロイすることが可能になります。  
Edge RuntimeではWeb標準をベースとしたAPIが使用可能で、一方で`fs`や`path`などといったNode.jsの一部のAPIを使用するパッケージを使用することができません。しかしこのブログでは`fs/promises`の`readdir()`や、`path.join()`などのNode.jsのAPIに依存していて、このままでは移行できませんでした。

例えば、記事一覧の取得には以下のようなコードがありました。

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

残念ながら`readdir`や`path.join`を代替できるものはedge runtimeにはありません。なのでこのケースでは「ファイルシステムから情報を取得する」という方法を根本から見直す必要がありました。

## 解決

そもそも記事一覧の情報などはビルド時に確定しているので、動的に生成する必要がありません。なのでビルド時に記事一覧が生成できればいいわけです。  
なにかいいツールないかなと思って見つけたのが[contentlayer](https://contentlayer.dev/)というツールでした。

contentlayerは.mdファイルなどといった、いわゆるコンテンツファイルの情報をjsonに変換し、typescript上のアプリケーションに簡単にimportできるようにするためのツールです。

.mdファイルからjsonへの変換はビルド時に一回走るのみだったり、ファイルの一覧を取得するための`allArticles`(`Article`の命名は設定に依ります)のようなオブジェクトを生やしてくれたり、そのうえ生成物に型をつけてくれたり等々・・・先の目標に耐えうるし、上記の利点も享受できそうなので今回は他と比較することもなくcontentlayerを採用することにしました。

contentlayerを知るきっかけになった記事は以下でした。

[個人ブログ開発でとても便利な Contentlayer を導入してみた | stin's Blog](https://blog.stin.ink/articles/introduce-contentlayer)

セットアップは[公式のGetting Started](https://contentlayer.dev/docs/getting-started-cddd76b7)に解説されていて、手順通りに進めていくことで特に詰まることなく導入できました。

セットアップの中で`contentlayer.config.ts`という、contentlayerの設定ファイルを編集していく必要がありました。そのうち以下のようなmdファイルの定義を書く必要があったので説明コメントともに示しておきます。

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

上記のように設定すると、記事一覧を取得する部分は以下のインポートだけで済みます。
注: `contentlayer/generated`が自動生成されたjsonファイルのあるpathです。

```ts
import { allArticles } from "contentlayer/generated"
```

記事ページの本文その他情報の取得も以前は↓

```ts
const getContent = async (slug: string) => {
  const { default: Content, meta } = (await import(
    `@/markdown/posts/${slug}.mdx`
  )) as { default: React.FC; meta: { title: string; publishedAt: string } }

  return { Content, meta }
}
```

contentlayer導入後は以下のようになりました。

```ts
import { allArticles } from "contentlayer/generated"
const post = allArticles.find((post) => post.id === slug)
```

## まとめ

contentlayerを導入したことでファイルシステムに依存していたコードを廃することができました。うれしい。

ここまでで既にEdge Runtimeには対応できているのですが、Cloudflare Pagesでcontentlayerを動かすためにはmdxを廃する必要がありました。理由はcontentlayerのmdx対応は`eval`を用いて実現されているところにあります。Cloudflare Pages(Workers)では`eval`を用いたコードは許容されていないからです。([EvalError: Code generation from strings disallowed for this context - Developers / Cloudflare Pages - Cloudflare Community](https://community.cloudflare.com/t/evalerror-code-generation-from-strings-disallowed-for-this-context/356430))

[JavaScript and web standards · Cloudflare Workers docs](https://developers.cloudflare.com/workers/runtime-apis/web-standards/#javascript-standards)

> For security reasons, the following are not allowed:
>
> - eval()
> - new Function
> - WebAssembly.compile
> - WebAssembly.compileStreaming
> - WebAssembly.instantiate with a buffer parameter
> - WebAssembly.instantiateStreaming

自分は現状mdx固有の機能を使っていなかったので、特に問題なく通常のmdファイルへ移行できました。

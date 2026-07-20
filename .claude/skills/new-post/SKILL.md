---
name: new-post
description: このブログ (`sh1ma/blog`) の新規記事のボイラープレート (`src/markdown/posts/YYYYMMDD_N_slug.md`) を生成する。ユーザが「新しい記事を書きたい」「記事のテンプレを作って」「新規ポスト」「post 作って」「記事のボイラープレート」「今日の記事書き始めたい」などと言ったら明示的なスキル指定がなくても発動する。日付プレフィックスと同日内の連番 N を自動で付与し、`title` / `publishedAt` / `description` / `tags` の frontmatter 雛形を書き出す。
---

# new-post

このブログの新規記事ファイルを、命名規則 `YYYYMMDD_N_slug.md` に沿って生成するスキル。

## いつ使うか

- 新しい記事を書き始めるとき。
- 既存記事の複製・翻訳の元ファイルを作るときは対象外 (手で作るか他のスキルに任せる)。

## 生成先とパス規則

- 出力先: `src/markdown/posts/`
- ファイル名: `YYYYMMDD_N_slug.md`
  - `YYYYMMDD`: 発行日 (デフォルトは実行日)。
  - `N`: **同日投稿の連番**。同日既存記事の最大 N + 1 を script が自動で決める。同日に既存記事がなければ 1。
  - `slug`: URL / 記事 id となる部分。ASCII 小文字・数字・`_` のみ。
- 一覧ページの並び順制御は「path の N」で決まるが、`content-collections.ts` の実装により **frontmatter に `priority` があればそちらが優先**される (公開後に順序だけ変えたいときは frontmatter で調整する)。

**重要**: 一度公開した記事の path は変えない (URL が変わるため)。既存ファイルのリネームは絶対にしない。

## 使い方

script は `scripts/create.mjs`。以下の引数を取る。

- `--slug <slug>` (必須): 例 `mise_age_encrypt_env`
- `--title <title>` (必須): 記事タイトル。日本語で良い。
- `--description <desc>` (任意): meta description。
- `--tags <a,b,c>` (任意): カンマ区切り。
- `--date <YYYY-MM-DD>` (任意): 発行日をずらしたいときだけ指定。デフォルトは実行日。

呼び出しは worktree のルートから:

```bash
node .claude/skills/new-post/scripts/create.mjs --slug <slug> --title "<title>" [--description "<desc>"] [--tags "tag1,tag2"] [--date YYYY-MM-DD]
```

script は:

1. 発行日と `src/markdown/posts/` 直下 (en 配下は含めない) を見て、その日付の既存 N の最大値 + 1 を決定。
2. `src/markdown/posts/YYYYMMDD_N_slug.md` を生成。既に同名ファイルがあれば失敗する。
3. 生成した path を stdout に出す。

## 生成される frontmatter

```markdown
---
title: "<title>"
publishedAt: "<YYYY-MM-DD>"
description: "<description or 空>"
tags: [<tags or 空配列>]
---
```

英語版 (`src/markdown/posts/en/`) が必要な場合は、日本語版を先に作ってから翻訳スキル等で別途生成する。この script は日本語版だけを作る。

## 実装上の注意

- script は Node.js 標準ライブラリのみで書く (依存追加禁止のため)。
- N の採番は「同日 (`YYYYMMDD` 一致) 既存ファイルの `YYYYMMDD_N_*` / `YYYYMMDD_*` パターンを走査して決める」。旧命名 (N なし) しかない日は次を 2 から始める。

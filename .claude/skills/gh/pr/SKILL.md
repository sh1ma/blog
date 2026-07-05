---
name: gh:pr
description: GitHubのPR（プルリクエスト）を管理する。PR作成、一覧、マージ、レビュー、コメント確認時に使用。「PRを作りたい」「マージして」「レビューして」「コメントを確認」などのキーワードで発動。
---

# gh (PR) 操作

このリポジトリ (`sh1ma/blog`) の PR を `gh` CLI で管理する。

## 対象コマンド

`gh pr` 系サブコマンド (`create` / `view` / `list` / `merge` / `review` / `edit` / `checks` / `diff` / `checkout` / `ready` / `close` / `reopen`) と、レビューコメント等を取る `gh api repos/sh1ma/blog/pulls/...`。

## コマンドの使い方の調べ方

具体的なフラグや引数はこのスキルには書かない。実行時に help で確認する。

```bash
gh pr --help              # サブコマンド一覧
gh pr <subcommand> --help # 各コマンドの詳細
gh api --help             # REST API 呼び出し
```

JSON で欲しいフィールドは `gh pr view --json <TAB>` 相当のヒントが `--help` に出る。無ければ `gh pr view --json 2>&1` で候補一覧が出る。

## 絶対に守るルール

- **リポジトリは `sh1ma/blog` のみ**。`--repo` で他リポジトリを指定しない。
- **PR 作成には必ずラベルを付ける** (CI でチェックされる)。使えるラベルは [`labels.md`](./labels.md) を参照。
- **PR 作成時は assignee を `sh1ma` に設定する**。
- **PR 本文は [`.github/pull_request_template.md`](../../../.github/pull_request_template.md) のセクションをすべて埋める** (概要 / 変更内容 / 関連 Issue / テスト項目 / VRT 設定 / スクリーンショット / 備考)。空セクションで作成しない。
- **PR 作成前チェックを通してから作成する**: `pnpm check` / `pnpm typecheck` / `pnpm test:e2e`。

## VRT の扱い

PR には VRT (Visual Regression Test) が自動で走る。UI に意図的な変更を入れた場合の扱いを [`vrt.md`](./vrt.md) にまとめている。UI 変更を伴う PR では必ず読む。

## 実行フロー (PR 作成時)

1. `git log main..HEAD` / `git diff main..HEAD --stat` で差分を把握する。
2. 差分の性質から [`labels.md`](./labels.md) のラベルを 1 つ以上選ぶ。
3. `.github/pull_request_template.md` を読み、各セクションを実際の変更内容で埋める。
4. `gh pr create --help` で最新のフラグを確認しつつ、`--label` / `--assignee sh1ma` / `--body` を付けて作成する。本文は heredoc で渡す。
5. 結果 URL を日本語で報告する。

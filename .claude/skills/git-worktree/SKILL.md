---
name: git-worktree
description: Git worktreeを使った並列開発を支援する。複数のClaude Codeインスタンスで同時に異なるブランチの作業を行う際に使用する。"worktree"、"並列開発"、"別ブランチで作業"などのキーワードで発動。
---

# Git Worktree管理

Git worktreeを使って並列開発を支援するスキル。

## 重要なルール

**作業を開始する前に、必ずこのスキルを使ってworktreeとブランチを作成すること。**

## ブランチ命名規則

Conventional Commitに準じた形式でブランチ名を付ける:

```
<type>/<short-description>
```

### 利用可能なtype

| type       | 用途                                   |
| ---------- | -------------------------------------- |
| `feat`     | 新機能追加                             |
| `fix`      | バグ修正                               |
| `refactor` | リファクタリング                       |
| `docs`     | ドキュメント変更                       |
| `style`    | コードスタイル変更（フォーマットなど） |
| `test`     | テスト追加・修正                       |
| `chore`    | ビルド・設定・依存関係の変更           |
| `perf`     | パフォーマンス改善                     |

### 例

```
feat/add-dark-mode
fix/like-button-error
refactor/api-structure
docs/update-readme
chore/update-dependencies
```

## コマンド概要

### Worktree作成（推奨フロー）

```bash
# 1. worktreesディレクトリの確認・作成
ls worktrees 2>/dev/null || mkdir -p worktrees

# 2. 新しいブランチとworktreeを同時に作成
git worktree add worktrees/<branch-name> -b <type>/<short-description>

# 3. Claude設定のシンボリックリンクを作成（絶対パスを使用）
# メインリポジトリのルートディレクトリを取得
MAIN_REPO=$(git worktree list --porcelain | grep -m 1 "worktree" | cut -d' ' -f2)
# 既存のsettings.local.jsonを削除してからシンボリックリンクを作成
rm -f worktrees/<branch-name>/.claude/settings.local.json
ln -s "${MAIN_REPO}/.claude/settings.local.json" worktrees/<branch-name>/.claude/settings.local.json

# 例: feat/add-dark-mode ブランチとworktreeを作成
git worktree add worktrees/add-dark-mode -b feat/add-dark-mode
MAIN_REPO=$(git worktree list --porcelain | grep -m 1 "worktree" | cut -d' ' -f2)
rm -f worktrees/add-dark-mode/.claude/settings.local.json
ln -s "${MAIN_REPO}/.claude/settings.local.json" worktrees/add-dark-mode/.claude/settings.local.json
```

### Worktree一覧表示

```bash
git worktree list
```

### Worktree削除

```bash
# worktreeを削除（ブランチは残る）
git worktree remove worktrees/<worktree-name>

# worktreeをprune（不要な参照を削除）
git worktree prune
```

### 既存ブランチでworktree作成

```bash
git worktree add worktrees/<worktree-name> <existing-branch>
```

## 実行手順

1. ユーザーの作業内容を確認する
2. 適切なブランチ名を決定する（type/short-description形式）
3. worktreeを作成する
4. メインリポジトリのパスを取得する（`git worktree list --porcelain`を使用）
5. 既存のsettings.local.jsonを削除してから、Claude設定のシンボリックリンクを絶対パスで作成する（settings.local.jsonをメインリポジトリから参照）
6. 作成したworktreeのパスを報告する
7. 作業完了後、worktreeの削除を案内する

## ディレクトリ構造

```
blog/
├── (メインリポジトリのファイル群)
├── .gitignore            # worktrees/ を除外済み
└── worktrees/
    ├── add-dark-mode/    # feat/add-dark-mode
    ├── fix-like-button/  # fix/like-button-error
    └── refactor-api/     # refactor/api-structure
```

## 注意事項

- worktreeのディレクトリ名はブランチ名のshort-description部分を使用する
- 同じブランチで複数のworktreeは作成できない
- 作業完了後は `git worktree remove` でworktreeを削除すること
- マージ後はブランチも削除すること
- `.claude/settings.local.json` はシンボリックリンク（絶対パス）でメインリポジトリと共有される（MCP/コマンド/スキルの許可設定が全worktreeで同期される）
- シンボリックリンクは必ず絶対パスで作成すること（相対パスでは正しく動作しない場合がある）
- `git worktree add` 実行時にGitが自動的に `.claude/settings.local.json` をコピーするため、シンボリックリンク作成前に既存ファイルを削除する必要がある

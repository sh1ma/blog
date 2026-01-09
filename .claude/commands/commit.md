---
description: 変更内容を分析し、日本語でコミットメッセージを生成してコミットを実行する
allowed-tools: Bash(git:*)
---

# Git Commit

## コンテキスト

- 現在のgit status: !`git status`
- ステージされていない変更: !`git diff --stat`
- 最近のコミット履歴: !`git log --oneline -5`

## 実行手順

1. **変更内容の分析**
   - 上記のコンテキストから変更されたファイルの種類を特定
   - 変更の目的（機能追加、バグ修正、ドキュメント、リファクタリング等）を判断

2. **コミットメッセージの生成**
   - Conventional Commits 形式に従う
   - プレフィックス: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `style:`, `test:`
   - **件名・本文ともに日本語で記述する**

3. **ユーザー確認**
   - 生成したコミットメッセージを提示
   - AskUserQuestion で承認を得てからコミット実行

4. **コミット実行**
   - 必要に応じて `git add` でステージング
   - `git commit` を実行
   - Co-Authored-By は追加しない

## コミットメッセージのフォーマット

```
<type>: <subject（日本語）>

<body（任意、日本語）>
```

## 注意事項

- 機密情報（.env、credentials等）が含まれていないか確認
- 大きな変更は複数のコミットに分割することを提案
- `--amend` は使用しない（明示的に要求された場合を除く）

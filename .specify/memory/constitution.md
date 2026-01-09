<!--
Sync Impact Report
==================
Version change: N/A → 1.0.0 (Initial creation)
Modified principles: N/A (new)
Added sections:
  - Project Identity
  - Principles (5 total)
  - Governance
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ created
  - .specify/templates/spec-template.md ✅ created
  - .specify/templates/tasks-template.md ✅ created
Follow-up TODOs: None
-->

# Project Constitution

## Project Identity

- **Project Name**: blog.sh1ma.dev
- **Description**: Next.js 15 + Contentlayer2 + Cloudflare Workers (OpenNext) で構築された個人ブログ
- **Primary Language**: TypeScript
- **Runtime**: Cloudflare Workers
- **Constitution Version**: 1.0.0
- **Ratification Date**: 2026-01-09
- **Last Amended Date**: 2026-01-09

## Principles

### Principle 1: シンプルさ優先 (Simplicity First)

過度な抽象化や将来の仮想的な要件に対する設計を避け、現在の要件を満たす最小限の実装を選択する。

**規則**:
- 1回しか使わない処理に対してヘルパー関数や抽象化を作成してはならない
- 依存関係の追加は、明確な利点がある場合のみ行う
- 設定ファイルやオプションは必要最小限に留める

**根拠**: 個人ブログとして長期的に保守可能な状態を維持するため。複雑さは時間とともに理解困難になる。

### Principle 2: 型安全性の徹底 (Type Safety)

TypeScriptの型システムを最大限活用し、ランタイムエラーをコンパイル時に検出する。

**規則**:
- `any` 型の使用は禁止（やむを得ない場合は `unknown` を使用し、型ガードで絞り込む）
- 外部APIレスポンスやユーザー入力は必ずZodなどでバリデーションする
- Contentlayerが生成する型を直接使用し、手動での型定義重複を避ける

**根拠**: 型エラーはデプロイ後のバグより修正コストが低い。

### Principle 3: Cloudflare最適化 (Cloudflare-Native)

Cloudflare Workersのエッジ環境に最適化された実装を選択する。

**規則**:
- Node.js専用APIの使用を避け、Web標準APIを優先する
- D1/R2/KVへのアクセスは `getCloudflareContext()` 経由で行う
- バンドルサイズを意識し、不要なポリフィルを含めない

**根拠**: エッジコンピューティングの利点（低レイテンシ、グローバル配信）を最大化するため。

### Principle 4: コンテンツとコードの分離 (Content-Code Separation)

ブログコンテンツ（Markdown）とアプリケーションコードを明確に分離する。

**規則**:
- 記事コンテンツは `src/markdown/` 配下にのみ配置する
- 記事のメタデータは Frontmatter で管理し、コード内にハードコードしない
- コンテンツの追加・編集がコードの変更を必要としない設計を維持する

**根拠**: 記事執筆とコード開発のワークフローを独立させ、それぞれの作業効率を高めるため。

### Principle 5: 可観測性の確保 (Observability)

本番環境での問題を迅速に特定・解決できる状態を維持する。

**規則**:
- エラーは適切にログ出力し、握りつぶさない
- Cloudflare の Observability 機能を有効化する（wrangler.toml で設定済み）
- 重要な操作（いいね等）はDiscord Webhookで通知する

**根拠**: 個人運用のため常時監視は困難。問題発生時に素早く気付ける仕組みが必要。

## Governance

### 改定手続き

1. 改定提案を Issue または PR で作成する
2. 変更内容と根拠を明記する
3. 改定が承認された場合、`Last Amended Date` と `Constitution Version` を更新する

### バージョニングポリシー

- **MAJOR**: 原則の削除または根本的な再定義
- **MINOR**: 新しい原則の追加、または既存原則の大幅な拡張
- **PATCH**: 文言の明確化、誤字修正、軽微な調整

### コンプライアンスレビュー

- 新機能の実装前に、関連する原則との整合性を確認する
- コードレビュー時に原則違反がないかチェックする
- 定期的（四半期ごと）に原則の妥当性を見直す

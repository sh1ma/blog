<!--
Sync Impact Report
==================
Version change: 1.1.0 → 1.2.0
Modified principles: None
Added sections:
  - Principle 7: コード可読性 (Code Readability)
  - Principle 8: コロケーション (Colocation)
  - Principle 9: コンポーネント設計 (Component Design)
  - Principle 10: デザイン一貫性 (Design Consistency)
  - Principle 11: アクセシビリティ (Accessibility)
Removed sections: None
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ updated
  - .specify/templates/spec-template.md ✅ updated
  - .specify/templates/tasks-template.md ✅ updated
Follow-up TODOs: None
-->

# Project Constitution

## Project Identity

- **Project Name**: blog.sh1ma.dev
- **Description**: Next.js 15 + Contentlayer2 + Cloudflare Workers (OpenNext) で構築された個人ブログ
- **Primary Language**: TypeScript
- **Runtime**: Cloudflare Workers
- **Constitution Version**: 1.2.0
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

### Principle 6: URL安定性の保証 (URL Stability)

既存の公開URLパスを破壊する変更を禁止し、永続的なリンクを保証する。

**規則**:

- 既存の記事URLパス（`/articles/[slug]`）は変更してはならない
- ルーティング構造の変更時は、旧URLから新URLへのリダイレクトを必ず設定する
- 記事ファイル名（slug）の変更は原則禁止。やむを得ない場合はリダイレクト設定を必須とする
- 外部サービス（検索エンジン、SNS、他サイトからのリンク）からのアクセスを考慮する

**根拠**: ブログ記事は外部からリンクされる可能性があり、リンク切れはSEOと読者体験の両方を損なう。
Cool URIs don't change (W3C)。

### Principle 7: コード可読性 (Code Readability)

複雑な記述より読みやすさを優先し、将来の自分や他者が理解しやすいコードを書く。

**規則**:

- 変数名・関数名は単語を省略せず、意図が明確に伝わる名前を使用する
  - 良い例: `articlePublishedDate`, `userEmailAddress`
  - 悪い例: `artPubDt`, `usrEmail`
- 複雑なワンライナーより、ステップを分けた明示的な処理を選択する
- 関数型プログラミングのエッセンスを取り入れる（純粋関数、イミュータブルなデータ操作）
- 単一責任の原則を遵守し、1つの関数/コンポーネントは1つの責務のみを持つ

**根拠**: コードは書く時間より読む時間の方が長い。可読性は保守性に直結する。

### Principle 8: コロケーション (Colocation)

関連するファイルは物理的に近い場所に配置し、機能単位でディレクトリを構成する。

**規則**:

- コンポーネントとその専用スタイル/型定義/テストは同一ディレクトリに配置する
- ページ固有のコンポーネントはそのページのディレクトリ内に配置する
- 共有コンポーネントのみ `src/components/` に配置する

**根拠**: 関連ファイルが近くにあることで、機能の全体像を把握しやすくなり、変更の影響範囲が明確になる。

### Principle 9: コンポーネント設計 (Component Design)

再利用性と適切な分離を重視し、React Server Componentsの境界を意識した設計を行う。

**規則**:

- 巨大な一枚岩のコンポーネントを避け、適切な粒度で分離する
- プリミティブなUIコンポーネント（ボタン、入力フィールド等）は再利用可能な形で実装する
- アドホックな（特定の場所でしか使わない）コンポーネントと汎用コンポーネントを明確に区別する
- Server ComponentとClient Componentの境界を意識し、`"use client"` は必要最小限に留める
- クライアントコンポーネントはできるだけ末端（リーフ）に配置する

**根拠**: 適切に分離されたコンポーネントは理解・テスト・再利用が容易。RSCの境界を意識することでバンドルサイズを最適化できる。

### Principle 10: デザイン一貫性 (Design Consistency)

UIデザインの一貫性を保ち、スタイル定義を集約管理する。

**規則**:

- CSS値（色、スペーシング、フォントサイズ等）はすべてTailwindのテーマとして定義する
- マジックナンバーを直接記述せず、テーマトークンを使用する
  - 良い例: `text-primary`, `p-4`, `text-lg`
  - 悪い例: `text-[#1a1a1a]`, `p-[17px]`, `text-[15px]`
- 新しいデザイントークンが必要な場合は `tailwind.config.ts` に追加する

**根拠**: 一貫したデザインはユーザー体験を向上させ、テーマの集約管理により全体的な変更が容易になる。

### Principle 11: アクセシビリティ (Accessibility)

すべてのユーザーがコンテンツにアクセスできるよう、Webアクセシビリティに十分配慮する。

**規則**:

- 画像には適切な `alt` 属性を必ず設定する
- インタラクティブ要素はキーボード操作可能にする
- 適切なセマンティックHTML要素を使用する（`<button>`, `<nav>`, `<article>` 等）
- 色のみで情報を伝えない（色覚多様性への配慮）
- フォーカス状態を視覚的に明示する

**根拠**: アクセシビリティはすべてのユーザーへの配慮であり、SEOにも寄与する。

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

# Implementation Plan: スペーシングの統一化

**Branch**: `refactor/unify-design-system` | **Date**: 2026-01-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/refactor-unify-design-system/spec.md`

## Summary

現在のブログコードベースでハードコードされているスペーシング値（`px-4`, `py-6`, `gap-4`等）を分析し、セマンティックなデザイントークンに置き換える。見た目を変更せずに、将来のデザイン変更を容易にすることが目的。

## Technical Context

**Language/Version**: TypeScript 5.9.2 / Next.js 15.4.10
**Primary Dependencies**: Tailwind CSS 3.4.19, @tailwindcss/typography 0.5.19, React 19.1.2
**Storage**: Cloudflare D1（いいね機能）、R2（CDN）
**Testing**: 視覚的回帰テスト（スクリーンショット比較）
**Target Platform**: Cloudflare Workers (OpenNext)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: 現状維持（リファクタリングのため）
**Constraints**: 視覚的な差異ゼロ、既存のレスポンシブ動作を維持
**Scale/Scope**: 16個のTSX/SCSSファイル、約40箇所のスペーシング定義

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| 1. シンプルさ優先 | ✅ PASS | 既存の値を分析し、必要最小限のトークンのみを定義する |
| 2. 型安全性の徹底 | ✅ PASS | Tailwind CSSのテーマ拡張で型安全を維持 |
| 3. Cloudflare最適化 | ✅ PASS | CSSのみの変更、ランタイムへの影響なし |
| 4. コンテンツとコードの分離 | ✅ PASS | Markdownコンテンツには影響なし |
| 5. 可観測性の確保 | ✅ PASS | 変更なし |
| 6. URL安定性の保証 | ✅ PASS | URL変更なし |
| 7. コード可読性 | ✅ PASS | セマンティックなトークン名で意図が明確に |
| 8. コロケーション | ✅ PASS | tailwind.config.tsに集約 |
| 9. コンポーネント設計 | ✅ PASS | コンポーネント構造は変更しない |
| 10. デザイン一貫性 | ✅ PASS | **これが本フィーチャーの主目的** |
| 11. アクセシビリティ | ✅ PASS | 視覚的変更なし |

## Project Structure

### Documentation (this feature)

```text
specs/refactor-unify-design-system/
├── plan.md              # This file
├── research.md          # Phase 0 output - スペーシング分析結果
├── data-model.md        # Phase 1 output - トークン定義
├── quickstart.md        # Phase 1 output - 適用ガイド
├── contracts/           # Phase 1 output - N/A (API変更なし)
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── page.tsx                    # ホームページ - 多数のスペーシング
│   ├── layout.tsx                  # ルートレイアウト
│   ├── header.tsx                  # ヘッダー
│   ├── globals.scss                # グローバルスタイル
│   ├── syntax-highlight.scss       # シンタックスハイライト
│   ├── about/page.tsx              # Aboutページ
│   ├── tweets/page.tsx             # ツイート一覧
│   ├── console/
│   │   ├── page.tsx
│   │   └── FileUploadInput.tsx
│   └── articles/[slug]/page.tsx    # 記事詳細ページ
├── components/
│   ├── ArticleList/ArticleList.tsx
│   ├── LikeButton/LikeButton.tsx
│   └── MarkdownContent/MarkdownContent.tsx
└── tweets/TweetCard.tsx

tailwind.config.ts                   # デザイントークンを追加
```

**Structure Decision**: 既存のNext.js App Router構造を維持。デザイントークンはtailwind.config.tsのtheme.extend.spacingに追加する。

## Complexity Tracking

> 違反なし - 複雑性追跡は不要

## Current Spacing Analysis Summary

### 使用されているスペーシング値

| 値 | 用途 | 出現回数 |
|----|------|----------|
| `p-2` | 小さいパディング（ボタン、モバイル記事） | 3 |
| `p-4` | 中程度のパディング（ヘッダー、リンク、セクション） | 7 |
| `p-6` | 大きいパディング（カード、サイドバー） | 5 |
| `px-4`, `py-2` | ボタン・リンクのパディング | 4 |
| `px-4`, `py-6` | ツイートカード（モバイル） | 2 |
| `sm:px-6`, `sm:py-8` | ツイートカード（デスクトップ） | 2 |
| `gap-1` | 小さいギャップ（アイコンとテキスト） | 4 |
| `gap-2` | 中程度のギャップ（フレックスコンテナ） | 6 |
| `gap-4` | 大きいギャップ（グリッド、セクション） | 8 |
| `gap-6` | リスト間隔 | 1 |
| `pb-2` | 見出し下部のパディング | 6 |
| `mb-10` | セクション下部のマージン | 2 |
| `mb-20` | ページ下部のマージン | 1 |
| `ml-1` | 小さい左マージン | 2 |

### レスポンシブパターン

- `sm:grid-cols-[2fr_1fr]` - サイドバーレイアウト
- `sm:p-6` vs `p-2` - モバイル/デスクトップでのパディング差
- `sm:px-6 sm:py-8` vs `px-4 py-6` - ツイートカードのレスポンシブ
- `sm:[&>header]:mb-12` - ヘッダー下のマージン

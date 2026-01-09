# Data Model: スペーシングトークン定義

**Date**: 2026-01-10

## 1. Entity Overview

このフィーチャーはデータベースエンティティを持たない。代わりに、Tailwind CSSのテーマ拡張として「スペーシングトークン」を定義する。

## 2. Spacing Token Schema

### 2.1 トークン定義（tailwind.config.ts）

```typescript
// tailwind.config.ts - theme.extend.spacing に追加
spacing: {
  // ページレイアウト
  'page-x': '1rem',        // 16px - ページコンテナの左右パディング
  'page-bottom': '5rem',   // 80px - ページ下のマージン

  // カード
  'card': '1.5rem',        // 24px - カード内パディング（デスクトップ）
  'card-sm': '0.5rem',     // 8px  - カード内パディング（モバイル）

  // セクション
  'section-gap': '1rem',   // 16px - セクション間のギャップ
  'section-bottom': '2.5rem', // 40px - セクション下のマージン

  // 見出し
  'heading-bottom': '0.5rem', // 8px - 見出し下のパディング

  // ボタン
  'btn-x': '1rem',         // 16px - ボタン横パディング
  'btn-y': '0.5rem',       // 8px  - ボタン縦パディング

  // インライン要素
  'inline-x': '0.25rem',   // 4px - インライン要素横パディング
  'inline-y': '0.125rem',  // 2px - インライン要素縦パディング

  // アイコン
  'icon-gap': '0.25rem',   // 4px - アイコンとテキストのギャップ
}
```

### 2.2 トークン使用マッピング

| 既存クラス | 新しいトークンクラス | 適用箇所 |
|-----------|-------------------|---------|
| `px-4` (container) | `px-page-x` | ページコンテナ |
| `mb-20` | `mb-page-bottom` | ページ下部 |
| `p-6` | `p-card` | カード、サイドバー |
| `p-2` (mobile) | `p-card-sm` | モバイルカード |
| `gap-4` (section) | `gap-section-gap` | セクション間 |
| `mb-10` | `mb-section-bottom` | セクション下部 |
| `pb-2` (heading) | `pb-heading-bottom` | 見出し下部 |
| `px-4 py-2` (button) | `px-btn-x py-btn-y` | ボタン、リンク |
| `px-1` (inline) | `px-inline-x` | インラインコード横 |
| `py-0.5` (inline) | `py-inline-y` | インラインコード縦 |
| `gap-1` (icon) | `gap-icon-gap` | アイコンとテキスト |

## 3. Validation Rules

### 3.1 トークン命名規則

- **形式**: `{context}-{modifier}?`
- **context**: トークンが使用されるコンテキスト（`page`, `card`, `section`, `heading`, `btn`, `inline`, `icon`）
- **modifier**: オプションの修飾子（`sm`, `x`, `y`, `bottom`, `gap`）

### 3.2 値の制約

- すべてのトークン値はTailwindのデフォルトスケール（4pxの倍数）に準拠する
- `rem`単位を使用して相対的なサイズを維持する
- カスタムピクセル値（`[17px]`等）は使用しない

## 4. トークン化対象外

以下のクラスはセマンティックトークン化せず、Tailwindのデフォルトスケールを直接使用する：

| クラス | 理由 |
|--------|------|
| `gap-1`, `gap-2`, `gap-4`, `gap-6` | 汎用的なギャップで文脈依存ではない |
| `ml-1` | 微調整用途 |
| `h-20` | 高さはスペーシングとは別の関心事 |
| `sm:[&>header]:mb-12` | 特殊な用途 |

## 5. レスポンシブ適用パターン

トークン自体はレスポンシブに依存しない。レスポンシブ適用はTailwindのプレフィックスで行う：

```tsx
// Before
<div className="p-2 sm:p-6">

// After
<div className="p-card-sm sm:p-card">
```

## 6. proseスペーシング

`@tailwindcss/typography`のデフォルト設定を維持。以下のカスタマイズのみ行う：

| カスタマイズ | 目的 |
|-------------|------|
| `prose-h2:pb-2` | 見出し下のパディング（トークン化: `prose-h2:pb-heading-bottom`） |
| `prose-code:px-1 prose-code:py-0.5` | インラインコードのパディング（トークン化: `prose-code:px-inline-x prose-code:py-inline-y`） |

# Quickstart: スペーシングの統一化

**Date**: 2026-01-10

## 概要

このガイドでは、ハードコードされたスペーシング値をセマンティックトークンに置き換える手順を説明します。

## セットアップ

### 1. Tailwind設定の更新

`tailwind.config.ts`にスペーシングトークンを追加します：

```typescript
import type { Config } from "tailwindcss"
import typography from "@tailwindcss/typography"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
  ],

  plugins: [typography],
  theme: {
    extend: {
      colors: {
        primary: {
          default: "#514fc9",
          dark: "#3a38a0",
          light: "#7a79d9",
          bg: "#f0f2ff",
        },
        accent: {
          default: "#ff6b6b",
        },
      },
      fontFamily: {
        system: ["system-ui"],
      },
      // 新規追加: スペーシングトークン
      spacing: {
        'page-x': '1rem',
        'page-bottom': '5rem',
        'card': '1.5rem',
        'card-sm': '0.5rem',
        'section-gap': '1rem',
        'section-bottom': '2.5rem',
        'heading-bottom': '0.5rem',
        'btn-x': '1rem',
        'btn-y': '0.5rem',
        'inline-x': '0.25rem',
        'inline-y': '0.125rem',
        'icon-gap': '0.25rem',
      },
    },
  },
}
export default config
```

## 使用方法

### ページコンテナ

```tsx
// Before
<main className="max-w-7xl px-4">

// After
<main className="max-w-7xl px-page-x">
```

### カードコンポーネント

```tsx
// Before（レスポンシブ）
<div className="bg-white p-2 sm:p-6">

// After
<div className="bg-white p-card-sm sm:p-card">
```

### ボタン

```tsx
// Before
<button className="bg-white px-4 py-2">

// After
<button className="bg-white px-btn-x py-btn-y">
```

### 見出し

```tsx
// Before
<h2 className="border-b pb-2 text-2xl">

// After
<h2 className="border-b pb-heading-bottom text-2xl">
```

### セクション間隔

```tsx
// Before
<div className="grid gap-4">

// After
<div className="grid gap-section-gap">
```

### セクション下マージン

```tsx
// Before
<header className="mb-10">

// After
<header className="mb-section-bottom">
```

### インラインコード（prose内）

```tsx
// Before
className="prose-code:px-1 prose-code:py-0.5"

// After
className="prose-code:px-inline-x prose-code:py-inline-y"
```

### アイコンとテキスト

```tsx
// Before
<span className="flex gap-1">

// After
<span className="flex gap-icon-gap">
```

## トークン化しないクラス

以下のクラスはそのまま維持します（トークン化不要）：

- `gap-1`, `gap-2`, `gap-4`, `gap-6` - 汎用ギャップ
- `ml-1` - 微調整用
- `h-20` - 高さ指定
- `sm:[&>header]:mb-12` - 特殊用途

## 検証方法

1. 開発サーバーを起動: `pnpm dev`
2. 各ページを表示し、視覚的な差異がないことを確認
3. レスポンシブビューでモバイル・タブレット・デスクトップを確認

## トラブルシューティング

### トークンが認識されない場合

1. `tailwind.config.ts`が正しく保存されているか確認
2. 開発サーバーを再起動
3. `pnpm build:content`でContentlayerを再ビルド

### 視覚的な差異がある場合

1. 置き換え前後の値が同一か確認（例: `px-4` = `1rem` = `page-x`）
2. レスポンシブプレフィックスが正しいか確認

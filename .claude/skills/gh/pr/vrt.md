# VRT (Visual Regression Test) の扱い

PR には `.github/workflows/vrt.yaml` により VRT が自動実行される。R2 (`blog-vrt`) にあるベースラインと PR ビルドのスクリーンショットを比較し、差分を PR にコメントする。

## 意図しない差分が出た場合

コードを直して再実行する。ベースラインは更新しない。

## 意図的な UI 変更を入れた場合

1. PR テンプレートの「VRT 設定」セクションで **「スナップショットを更新する」にチェック** を入れる。
2. VRT ワークフローが再実行され、新しいスクリーンショットが R2 にアップロードされる。
3. マージ後、自動でベースラインが更新される。

UI 変更を伴う PR には `test` ラベルも付けておくと分類しやすい。

## 詳細

ワークフロー本体と E2E 定義:

- `.github/workflows/vrt.yaml`
- `e2e/vrt.spec.ts`
- `playwright.config.ts`

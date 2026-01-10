# Tasks: スペーシングの統一化

**Input**: Design documents from `/specs/refactor-unify-design-system/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Tests**: 視覚的回帰テストはspec.mdで言及されているが、自動テストフレームワークは設定されていないため、手動での視覚確認をチェックポイントとして設定

**Organization**: タスクはユーザーストーリーごとにグループ化。US4（トークン定義）はUS1/US2/US3の前提条件のためFoundationalフェーズに配置

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Next.js App Router: `src/app/`, `src/components/`
- Tailwind config: `tailwind.config.ts`

---

## Phase 1: Setup

**Purpose**: 作業開始前の準備

- [x] T001 現在のUIのスクリーンショットを撮影（ホーム、記事詳細、About、ツイート一覧の各ページ、モバイル・デスクトップ両方）
- [x] T002 開発サーバー起動確認 `pnpm dev`

---

## Phase 2: Foundational - トークン定義 (US4: P2)

**Purpose**: 全てのリファクタリングの基盤となるスペーシングトークンの定義

**⚠️ CRITICAL**: このフェーズが完了するまでUS1/US2/US3の作業は開始できない

**Goal**: セマンティックなスペーシングトークンをTailwind設定に追加

- [x] T003 [US4] スペーシングトークンを追加 in tailwind.config.ts
  - `page-x`: '1rem'
  - `page-bottom`: '5rem'
  - `card`: '1.5rem'
  - `card-sm`: '0.5rem'
  - `section-gap`: '1rem'
  - `section-bottom`: '2.5rem'
  - `heading-bottom`: '0.5rem'
  - `btn-x`: '1rem'
  - `btn-y`: '0.5rem'
  - `inline-x`: '0.25rem'
  - `inline-y`: '0.125rem'
  - `icon-gap`: '0.25rem'
- [x] T004 [US4] 開発サーバーで新トークンが認識されることを確認

**Checkpoint**: トークンが利用可能 - コンポーネントのリファクタリングを開始可能

---

## Phase 3: User Story 1 & 2 - スペーシング統一とレスポンシブ維持 (Priority: P1)

**Goal**: 全コンポーネントのハードコードされたスペーシング値をトークンに置き換え、レスポンシブデザインを維持

**Independent Test**:

- 各ページをリファクタリング前後でスクリーンショット比較
- モバイル・タブレット・デスクトップの各ブレークポイントでレイアウト確認

### Implementation

#### Core Layout Files

- [x] T005 [P] [US1] ルートレイアウトのスペーシングをトークン化 in src/app/layout.tsx
  - `mb-20` → `mb-page-bottom`
- [x] T006 [P] [US1] ヘッダーのスペーシングをトークン化 in src/app/header.tsx
  - `p-4` → `p-section-gap`

#### Home Page (src/app/page.tsx)

- [x] T007 [US1] ホームページのコンテナスペーシングをトークン化 in src/app/page.tsx
  - `px-4` → `px-page-x`
  - `gap-4` → `gap-section-gap`（セクション間）
  - `pb-2` → `pb-heading-bottom`（見出し下）
- [x] T008 [US1] ホームページの記事カードスペーシングをトークン化 in src/app/page.tsx
  - `p-6` → `p-card`
- [x] T009 [US1] ホームページのサイドバースペーシングをトークン化 in src/app/page.tsx
  - `p-6` → `p-card`
  - `px-4 py-2` → `px-btn-x py-btn-y`（ボタン/リンク）
- [x] T010 [US2] ホームページのツイートカードレスポンシブスペーシングをトークン化 in src/app/page.tsx
  - `px-4 py-6 sm:px-6 sm:py-8` → `px-btn-x py-card sm:px-card sm:py-8`（ツイートカードは特殊なため一部維持）
- [x] T011 [US1] ホームページのアイコンギャップをトークン化 in src/app/page.tsx
  - `gap-1` → `gap-icon-gap`（アイコンとテキスト間）

#### Article Page (src/app/articles/[slug]/page.tsx)

- [x] T012 [US2] 記事ページのレスポンシブパディングをトークン化 in src/app/articles/[slug]/page.tsx
  - `p-2 sm:p-6` → `p-card-sm sm:p-card`
- [x] T013 [US1] 記事ページのセクションスペーシングをトークン化 in src/app/articles/[slug]/page.tsx
  - `mb-10` → `mb-section-bottom`
  - `pb-2` → `pb-heading-bottom`
  - `gap-1` → `gap-icon-gap`

#### Other Pages

- [x] T014 [P] [US1] Aboutページのスペーシングをトークン化 in src/app/about/page.tsx
  - `px-4` → `px-page-x`
  - `mb-10` → `mb-section-bottom`
  - `pb-2` → `pb-heading-bottom`
- [x] T015 [P] [US1] Consoleページのスペーシングをトークン化 in src/app/console/page.tsx
  - `px-4` → `px-page-x`
- [x] T016 [P] [US1] ファイルアップロードボタンのスペーシングをトークン化 in src/app/console/FileUploadInput.tsx
  - `px-4 py-2` → `px-btn-x py-btn-y`

#### Shared Components

- [x] T017 [P] [US1] LikeButtonのスペーシングをトークン化 in src/components/LikeButton/LikeButton.tsx
  - `p-2` → `p-btn-y`（小さいボタンなので縦パディングトークンを使用）
- [x] T018 [P] [US1] ArticleListのスペーシング確認 in src/components/ArticleList/ArticleList.tsx
  - `gap-6` は汎用ギャップのためトークン化せず維持

#### Tweet Components

- [x] T019 [US2] TweetCardのレスポンシブスペーシングをトークン化 in src/tweets/TweetCard.tsx
  - `px-4 py-6 sm:px-6 sm:py-8` → レスポンシブパターン維持しつつ可能な箇所をトークン化
  - `gap-1` → `gap-icon-gap`

**Checkpoint**: US1とUS2完了 - 全ページで視覚的差異がないことを確認

---

## Phase 4: User Story 3 - proseコンテンツのスペーシング統一 (Priority: P2)

**Goal**: Markdown記事のproseスタイルにおけるスペーシングをトークン化

**Independent Test**: Markdown記事ページで見出し・段落・リストなどの間隔が維持されていることを確認

### Implementation

- [x] T020 [US3] MarkdownContentのproseスペーシングをトークン化 in src/components/MarkdownContent/MarkdownContent.tsx
  - `prose-h2:pb-2` → `prose-h2:pb-heading-bottom`
  - `prose-code:px-1 prose-code:py-0.5` → `prose-code:px-inline-x prose-code:py-inline-y`

**Checkpoint**: US3完了 - 記事ページで視覚的差異がないことを確認

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: 最終確認と整合性検証

- [ ] T021 全ページの視覚的回帰テスト（Phase 1で撮影したスクリーンショットと比較）
- [ ] T022 モバイル（< 640px）での全ページ表示確認
- [ ] T023 タブレット（640px - 1024px）での全ページ表示確認
- [ ] T024 デスクトップ（> 1024px）での全ページ表示確認
- [ ] T025 Lint実行 `pnpm lint`
- [ ] T026 Format実行 `pnpm format`
- [ ] T027 ビルド確認 `pnpm build`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - 即時開始可能
- **Foundational (Phase 2)**: Setupに依存 - **全ユーザーストーリーをブロック**
- **US1 & US2 (Phase 3)**: Foundationalの完了に依存
- **US3 (Phase 4)**: Foundationalの完了に依存（US1/US2と並行可能だが、同じパターンを適用するため順次が推奨）
- **Polish (Phase 5)**: 全ユーザーストーリー完了に依存

### User Story Dependencies

- **US4 (トークン定義)**: 全ストーリーの前提条件 → Foundationalフェーズ
- **US1 & US2 (P1)**: 同時に作業（レスポンシブを考慮しながら各コンポーネントを更新）
- **US3 (P2)**: US1/US2完了後（同じトークンパターンを適用）

### Within Phase 3 (US1 & US2)

以下のタスクは並行実行可能（[P]マーク）：

- T005, T006（コアレイアウト）
- T014, T015, T016（その他ページ）
- T017, T018（共有コンポーネント）

以下は順次実行：

- T007 → T008 → T009 → T010 → T011（ホームページ - 同一ファイル）
- T012 → T013（記事ページ - 同一ファイル）

### Parallel Opportunities

```bash
# Phase 3の並列実行可能タスク:
T005 [P] src/app/layout.tsx
T006 [P] src/app/header.tsx
T014 [P] src/app/about/page.tsx
T015 [P] src/app/console/page.tsx
T016 [P] src/app/console/FileUploadInput.tsx
T017 [P] src/components/LikeButton/LikeButton.tsx
T018 [P] src/components/ArticleList/ArticleList.tsx
```

---

## Implementation Strategy

### MVP First (US4 + US1 + US2)

1. Phase 1: Setup完了
2. Phase 2: Foundational完了（トークン定義）
3. Phase 3: US1 & US2完了
4. **STOP and VALIDATE**: 全ページで視覚的差異なしを確認
5. 必要に応じてデプロイ

### Incremental Delivery

1. Setup + Foundational → トークン定義完了
2. US1 & US2 → 主要コンポーネントのトークン化完了 → 確認
3. US3 → proseコンテンツのトークン化完了 → 確認
4. Polish → 最終確認 → デプロイ

---

## Notes

- [P] tasks = 異なるファイル、依存関係なし
- [Story] label = 特定のユーザーストーリーへのマッピング
- 各ユーザーストーリーは独立してテスト可能
- 変更後は必ずブラウザで視覚確認
- 問題発見時は即座にrevert可能な小さなコミット単位で作業
- トークン化しないクラス: `gap-1`, `gap-2`, `gap-4`, `gap-6`（汎用ギャップ）, `ml-1`（微調整）, `h-20`（高さ）

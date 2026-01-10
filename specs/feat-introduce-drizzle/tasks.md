# Tasks: Drizzle ORM導入

**Input**: Design documents from `/specs/feat-introduce-drizzle/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/db-functions.md

**Tests**: テストは手動テスト（ローカル開発サーバー + Cloudflare Pagesプレビュー）で実施。自動テストタスクは含まない。

**Organization**: タスクはユーザーストーリーごとにグループ化されている。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列実行可能（異なるファイル、依存関係なし）
- **[Story]**: タスクが属するユーザーストーリー（US1, US2, US3）
- 説明には正確なファイルパスを含む

## Path Conventions

- **Web application (Next.js App Router)**: `src/` at repository root
- スキーマ: `src/db/schema.ts`
- Server Actions: `src/db.ts`, `src/tweets/tweetDomain.ts`
- 設定: `drizzle.config.ts` (repository root)

---

## Phase 1: Setup (環境セットアップ)

**Purpose**: Drizzle ORMパッケージのインストールと基本設定

- [x] T001 Install drizzle-orm as dependency via `pnpm add drizzle-orm`
- [x] T002 Install drizzle-kit as devDependency via `pnpm add -D drizzle-kit`
- [x] T003 [P] Create drizzle.config.ts at repository root with d1-http driver configuration (requires CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DATABASE_ID, CLOUDFLARE_D1_TOKEN env vars)

---

## Phase 1.5: Migration Baseline (マイグレーション移行)

**Purpose**: 既存のwranglerマイグレーションをDrizzleマイグレーション管理に移行

**⚠️ CRITICAL**: リモートD1の既存スキーマをintrospectし、Drizzleの初期マイグレーションとして登録

### 環境変数の準備

以下の環境変数を設定する必要がある（`.env`ファイルまたはexport）:

- `CLOUDFLARE_ACCOUNT_ID`: CloudflareアカウントID
- `CLOUDFLARE_DATABASE_ID`: D1データベースID (`63fa4c1b-5b4c-46e2-b2de-e412ae5deca9`)
- `CLOUDFLARE_D1_TOKEN`: Cloudflare APIトークン（D1読み取り権限が必要）

### タスク

- [x] T003a Set up environment variables for drizzle-kit (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DATABASE_ID, CLOUDFLARE_D1_TOKEN)
- [x] T003b Run `pnpm drizzle-kit pull --init` to introspect remote D1 schema and mark as initial migration
- [x] T003c Move generated drizzle/schema.ts to src/db/schema.ts (overwrite if exists)
- [x] T003d Verify drizzle/meta/\_journal.json was created with initial migration entry
- [x] T003e Verify drizzle/meta/0000_snapshot.json was created
- [x] T003f Update wrangler.toml: add `migrations_dir = "drizzle"` and `migrations_table = "__drizzle_migrations"` to d1_databases binding
- [x] T003g Run `wrangler d1 migrations list blog-iine-counter --remote` to verify Drizzle migration is recognized
- [x] T003h Keep migrations/ directory as reference (do not delete)

**Checkpoint**: Drizzleマイグレーション基盤が確立 - 今後のスキーマ変更はDrizzle経由で管理

---

## Phase 2: Foundational (スキーマ定義)

**Purpose**: Drizzleスキーマ定義（全ユーザーストーリーの前提条件）

**⚠️ CRITICAL**: ユーザーストーリーの作業はこのフェーズ完了後に開始可能

- [x] T004 Create src/db/ directory
- [x] T005 Create src/db/schema.ts with articles table definition per data-model.md
- [x] T006 Add likes table definition to src/db/schema.ts with foreign key to articles
- [x] T007 Add tweets table definition to src/db/schema.ts
- [x] T008 Export type definitions (Article, Like, Tweet, NewLike) from src/db/schema.ts using InferSelectModel/InferInsertModel

**Checkpoint**: スキーマ定義完了 - Server Actions移行が開始可能

---

## Phase 3: User Story 1+2 - 型安全なDBクエリ & 既存機能の移行 (Priority: P1)

**Goal**: 既存の5つのServer ActionをDrizzle ORMベースに移行し、型安全なデータベースアクセスを実現する

**Independent Test**:

- TypeScriptコンパイルが型エラーなしで通過する
- ローカル開発サーバーでいいねボタンが動作する
- ツイート一覧が正しく表示される

### Implementation for User Story 1+2

#### src/db.ts の移行（記事・いいね関連）

- [x] T009 [US1+2] Update imports in src/db.ts to add drizzle, eq, count from drizzle-orm and schema imports
- [x] T010 [US1+2] Migrate getAllArticles function in src/db.ts from DB.prepare to drizzle select per contracts/db-functions.md
- [x] T011 [US1+2] Migrate countLikes function in src/db.ts from DB.prepare to drizzle select with count() per contracts/db-functions.md
- [x] T012 [US1+2] Migrate likeArticle function in src/db.ts from DB.prepare to drizzle insert per contracts/db-functions.md (preserve Discord webhook)
- [x] T013 [US1+2] Remove TweetDBRecord type from src/tweets/tweetDomain.ts (will use schema type)

#### src/tweets/tweetDomain.ts の移行（ツイート関連）

- [x] T014 [US1+2] Update imports in src/tweets/tweetDomain.ts to add drizzle, desc from drizzle-orm and tweets schema
- [x] T015 [US1+2] Migrate getAllTweets function in src/tweets/tweetDomain.ts from DB.prepare to drizzle select with orderBy per contracts/db-functions.md
- [x] T016 [US1+2] Migrate getRecentTweets function in src/tweets/tweetDomain.ts from DB.prepare to drizzle select with orderBy and limit per contracts/db-functions.md
- [x] T017 [US1+2] Update recordToModel function in src/tweets/tweetDomain.ts to accept Drizzle schema type instead of TweetDBRecord

**Checkpoint**: 全Server ActionがDrizzle ORMに移行完了、手動テストで検証可能

---

## Phase 4: User Story 3 - スキーマ定義の一元管理 (Priority: P2)

**Goal**: Phase 2で作成したスキーマ定義が既存SQLマイグレーションと整合していることを確認

**Independent Test**: src/db/schema.tsの定義がmigrations/0001_initial.sql, migrations/0002_add_tweets_table.sqlと同一構造である

### Verification for User Story 3

- [x] T018 [US3] Verify articles table schema in src/db/schema.ts matches migrations/0001_initial.sql (id: text PK, created_at: text)
- [x] T019 [US3] Verify likes table schema in src/db/schema.ts matches migrations/0001_initial.sql (id: integer PK auto, article_id: text FK, created_at: text)
- [x] T020 [US3] Verify tweets table schema in src/db/schema.ts matches migrations/0002_add_tweets_table.sql (id: integer PK auto, created_at: text, content: text)

**Checkpoint**: スキーマ整合性確認完了

---

## Phase 5: Polish & Verification

**Purpose**: 最終検証とクリーンアップ

- [x] T021 Run TypeScript compilation via `pnpm build` to verify no type errors
- [ ] T022 Run local development server via `pnpm dev` and manually test like button functionality
- [ ] T023 Verify tweet list displays correctly on local development server
- [ ] T024 Run Cloudflare Pages preview via `pnpm preview` and verify all functionality works
- [x] T025 Verify no DB.prepare() calls remain in src/db.ts and src/tweets/tweetDomain.ts (SC-004)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存なし - 即座に開始可能
- **Migration Baseline (Phase 1.5)**: Setup完了後に開始 - Drizzleマイグレーション基盤の確立
- **Foundational (Phase 2)**: Phase 1.5完了後に開始（スキーマはintrospectで生成済み）
- **User Story 1+2 (Phase 3)**: Foundational完了後に開始
- **User Story 3 (Phase 4)**: Phase 2のスキーマ定義後に検証可能（Phase 3と並列可能）
- **Polish (Phase 5)**: Phase 3, 4完了後に実施

### User Story Dependencies

- **User Story 1+2 (P1)**: Phase 2（スキーマ定義）完了後に開始可能
- **User Story 3 (P2)**: Phase 2完了後に検証可能、Phase 3の実装とは独立

### Within Each Phase

- T001, T002: 依存なし、順次実行
- T003: T001, T002完了後（パッケージインストール後）
- T003a-T003h: T003完了後、順次実行（マイグレーション移行）
- T004: Phase 1.5完了後
- T005-T008: T004完了後、順次実行（スキーマは依存関係あり: articles → likes）
- T009-T017: Phase 2完了後、ファイルごとに並列可能
- T018-T020: Phase 2完了後、並列実行可能
- T021-T025: Phase 3, 4完了後、順次実行

### Parallel Opportunities

```text
# Phase 1 - 順次実行（パッケージインストール）
T001 → T002 → T003

# Phase 1.5 - 順次実行（マイグレーション移行）
T003a → T003b → T003c → T003d → T003e → T003f → T003g → T003h

# Phase 2 - 順次実行（スキーマ調整・型定義追加）
T004 → T005 → T006 → T007 → T008

# Phase 3 - ファイル単位で並列可能
[T009, T010, T011, T012] (src/db.ts)
  can run parallel with
[T014, T015, T016, T017] (src/tweets/tweetDomain.ts)
T013 (cleanup) after both

# Phase 4 - 並列実行可能
[T018, T019, T020] - all parallel

# Phase 5 - 順次実行（検証）
T021 → T022 → T023 → T024 → T025
```

---

## Parallel Example: Phase 3 Implementation

```bash
# Launch db.ts migration tasks:
Task: "Update imports in src/db.ts"
Task: "Migrate getAllArticles function in src/db.ts"
Task: "Migrate countLikes function in src/db.ts"
Task: "Migrate likeArticle function in src/db.ts"

# Launch tweetDomain.ts migration tasks (can run in parallel with db.ts):
Task: "Update imports in src/tweets/tweetDomain.ts"
Task: "Migrate getAllTweets function in src/tweets/tweetDomain.ts"
Task: "Migrate getRecentTweets function in src/tweets/tweetDomain.ts"
Task: "Update recordToModel function in src/tweets/tweetDomain.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1+2)

1. Complete Phase 1: Setup（パッケージインストール）
2. Complete Phase 2: Foundational（スキーマ定義）
3. Complete Phase 3: User Story 1+2（Server Actions移行）
4. **STOP and VALIDATE**: TypeScriptコンパイル + ローカルテスト
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → スキーマ定義完了
2. User Story 1+2 → テスト → Deploy (MVP!)
3. User Story 3 → 整合性検証 → 完了
4. Polish → 最終検証

---

## Notes

- User Story 1（型安全性）とUser Story 2（既存機能移行）は同時に達成されるため統合
- [P] マーク = 異なるファイル、依存関係なし
- `"use server"` ディレクティブは維持すること
- Discord Webhook通知は変更しない（likeArticle内）
- TweetDBRecord型はDrizzleスキーマ型で置き換え
- 手動テストで検証：ローカル開発サーバー + Cloudflare Pagesプレビュー

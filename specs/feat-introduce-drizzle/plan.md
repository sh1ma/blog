# Implementation Plan: Drizzle ORM導入

**Branch**: `feat/introduce-drizzle` | **Date**: 2026-01-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/feat-introduce-drizzle/spec.md`

## Summary

Cloudflare D1データベースにDrizzle ORMを導入し、既存の生SQLクエリ（`db.ts`、`tweetDomain.ts`）を型安全なDrizzle ORM実装に移行する。既存のwranglerマイグレーション（`d1_migrations`テーブル）とDrizzleマイグレーションの整合性を取りながら、既存機能を維持したまま移行を完了する。

## Technical Context

**Language/Version**: TypeScript 5.9 + Next.js 15.4
**Primary Dependencies**: drizzle-orm, drizzle-kit, @opennextjs/cloudflare, Hono
**Storage**: Cloudflare D1 (SQLite互換)
**Testing**: 手動テスト（pnpm build、pnpm preview）
**Target Platform**: Cloudflare Workers
**Project Type**: web（Next.js App Router）
**Performance Goals**: 既存機能と同等のパフォーマンス
**Constraints**: Cloudflare Workers環境で動作すること、既存データを保持すること

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| P1: シンプルさ優先 | ✅ PASS | Drizzle ORMは最小限の抽象化で型安全性を提供。過度な抽象化なし |
| P2: 型安全性の徹底 | ✅ PASS | Drizzle ORMの主目的が型安全なSQLクエリ。`any`不使用 |
| P3: Cloudflare最適化 | ✅ PASS | Drizzle ORMはD1をネイティブサポート。Web標準API使用 |
| P4: コンテンツとコードの分離 | ✅ PASS | 変更なし |
| P5: 可観測性の確保 | ✅ PASS | 既存のエラーハンドリング・通知を維持 |
| P6: URL安定性の保証 | ✅ PASS | URL構造に変更なし |
| P7: コード可読性 | ✅ PASS | Drizzleスキーマは宣言的で可読性が高い |
| P8: コロケーション | ✅ PASS | スキーマ定義は`src/db/`に配置 |
| P9: コンポーネント設計 | ✅ PASS | Server Actions維持、RSC境界に変更なし |
| P10: デザイン一貫性 | ✅ PASS | UI変更なし |
| P11: アクセシビリティ | ✅ PASS | UI変更なし |

## Project Structure

### Documentation (this feature)

```text
specs/feat-introduce-drizzle/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API変更なしのためスキップ)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── db/
│   ├── schema.ts        # [NEW] Drizzleスキーマ定義
│   └── index.ts         # [NEW] Drizzle client初期化
├── db.ts                # [MODIFY] Drizzle ORM版に書き換え
└── tweets/
    └── tweetDomain.ts   # [MODIFY] Drizzle ORM版に書き換え

drizzle/                 # [NEW] Drizzle migration output
├── meta/
│   ├── _journal.json
│   └── 0000_snapshot.json
└── 0000_initial_baseline.sql

migrations/              # [KEEP] 既存のwranglerマイグレーション（参照用）
├── 0001_initial.sql
└── 0002_add_tweets_table.sql

drizzle.config.ts        # [NEW] Drizzle Kit設定
wrangler.toml            # [MODIFY] migrations_dirをdrizzle/に変更
```

**Structure Decision**: 既存のNext.js App Router構造を維持しつつ、`src/db/`ディレクトリにDrizzle関連ファイルを配置。マイグレーションファイルは`drizzle/`ディレクトリに出力。

## Migration Strategy: 既存マイグレーションとDrizzleの整合性

### 現状分析

**リモートD1の状態:**
- テーブル: `articles`, `likes`, `tweets`, `d1_migrations`, `_cf_KV`, `sqlite_sequence`
- `d1_migrations`テーブルの内容:
  | id | name | applied_at |
  |----|------|------------|
  | 1 | 0001_initial.sql | 2024-06-15 04:35:32 |
  | 2 | 0002_add_tweets_table.sql | 2024-07-15 09:23:21 |

**既存マイグレーションファイル:**
- `migrations/0001_initial.sql`: articles, likesテーブル作成
- `migrations/0002_add_tweets_table.sql`: tweetsテーブル作成

### 移行プラン

#### Option A: `drizzle-kit pull --init`を使用（推奨）

1. **Drizzle設定ファイル作成**
   - `drizzle.config.ts`を作成し、`d1-http`ドライバーを設定

2. **既存スキーマのintrospect**
   ```bash
   pnpm drizzle-kit pull --init
   ```
   - リモートD1から現在のスキーマを取得
   - `--init`フラグで初期マイグレーションとしてマーク
   - `drizzle/`ディレクトリに以下が生成される:
     - `meta/_journal.json`: マイグレーション履歴
     - `meta/0000_snapshot.json`: スキーマスナップショット
     - `0000_*.sql`: 初期マイグレーションSQL（既に適用済みとしてマーク）

3. **スキーマファイルの整理**
   - 生成された`drizzle/schema.ts`を`src/db/schema.ts`に移動
   - 手動でスキーマを精査し、型を調整

4. **wrangler.tomlの更新**
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "blog-iine-counter"
   database_id = "63fa4c1b-5b4c-46e2-b2de-e412ae5deca9"
   migrations_dir = "drizzle"
   migrations_table = "__drizzle_migrations"
   ```

5. **マイグレーション履歴の整合性**
   - `drizzle-kit pull --init`により、Drizzleは現在のスキーマを「適用済み」として認識
   - 今後の`drizzle-kit generate`は差分のみを生成
   - 既存の`d1_migrations`テーブルはwranglerが使用していたもので、Drizzleは`__drizzle_migrations`テーブルを使用

### 重要な注意点

- **2つのマイグレーションテーブルが共存**: `d1_migrations`（旧wrangler）と`__drizzle_migrations`（Drizzle）
- 旧`migrations/`ディレクトリは参照用として保持（削除しない）
- 今後のスキーマ変更は`drizzle-kit generate` → `wrangler d1 migrations apply`のフローを使用

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | - | - |

---

## References

- [Drizzle ORM - Migrations](https://orm.drizzle.team/docs/migrations)
- [drizzle-kit pull](https://orm.drizzle.team/docs/drizzle-kit-pull)
- [Drizzle ORM - Custom migrations](https://orm.drizzle.team/docs/kit-custom-migrations)
- [Drizzle ORM - Cloudflare D1](https://orm.drizzle.team/docs/connect-cloudflare-d1)
- [How do you run Drizzle migrations on D1? - GitHub Discussion](https://github.com/drizzle-team/drizzle-orm/discussions/1388)

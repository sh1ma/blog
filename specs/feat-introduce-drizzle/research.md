# Research: Drizzle ORM導入

**Created**: 2026-01-10
**Status**: Complete

## 調査事項

### 1. Drizzle ORMとCloudflare D1の統合方法

**Decision**: `drizzle-orm/d1`パッケージを使用し、`getCloudflareContext().env.DB`から取得したD1インスタンスをdrizzleに渡す

**Rationale**:
- Drizzle ORMはCloudflare D1を公式にサポートしている
- `drizzle(env.DB)`のように直接D1バインディングを渡すだけで接続できる
- 既存の`wrangler.toml`の設定（`binding = "DB"`）をそのまま活用可能

**Alternatives considered**:
- D1 HTTP API経由での接続: リモートDB操作には便利だが、Workers内での実行には直接バインディングの方が効率的
- 他のORM（Prisma等）: D1サポートが限定的、またはCloudflare環境での動作に追加設定が必要

**References**:
- [Drizzle ORM - Cloudflare D1](https://orm.drizzle.team/docs/connect-cloudflare-d1)

### 2. スキーマ定義のベストプラクティス

**Decision**: `src/db/schema.ts`にDrizzleスキーマを定義し、SQLite固有の型を使用する

**Rationale**:
- `drizzle-orm/sqlite-core`からインポートした型（sqliteTable, integer, text）を使用
- D1はSQLiteベースのため、SQLite固有の型とシンタックスを使用する
- timestampは`text().default(sql\`(CURRENT_TIMESTAMP)\`)`で表現（SQLiteにはネイティブのdatetime型がない）

**Schema Example**:
```typescript
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

export const articles = sqliteTable("articles", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
})

export const likes = sqliteTable("likes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  articleId: text("article_id").notNull().references(() => articles.id),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
})

export const tweets = sqliteTable("tweets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  content: text("content").notNull(),
})
```

**References**:
- [Drizzle ORM - SQLite column types](https://orm.drizzle.team/docs/column-types/sqlite)

### 3. 必要なパッケージ

**Decision**: `drizzle-orm`をdependencies、`drizzle-kit`をdevDependenciesに追加

**Packages**:
- `drizzle-orm`: ランタイムで使用するORM本体
- `drizzle-kit`: マイグレーション生成、スキーマプッシュ用CLI（開発時のみ使用）

**Installation**:
```bash
pnpm add drizzle-orm
pnpm add -D drizzle-kit
```

### 4. マイグレーション戦略

**Decision**: 既存のマイグレーションファイル（`migrations/`）は維持し、Drizzleスキーマは既存DBに合わせて定義する

**Rationale**:
- 既に本番環境でマイグレーションが適用済み
- Drizzleのマイグレーション機能（drizzle-kit generate/push）は今回は使用しない
- スキーマ定義は既存のテーブル構造に完全に一致させる
- 将来的に新しいテーブル追加時はDrizzle kitを使用可能

**Alternatives considered**:
- Drizzle kitでマイグレーション全体を再生成: 既存の本番データに影響を与えるリスク
- wranglerのマイグレーション機能との併用: 複雑性が増すため、現状維持が最もシンプル

### 5. Cloudflare Workers環境での互換性

**Decision**: 現在の`wrangler.toml`設定で問題なし

**Rationale**:
- `compatibility_flags = [ "nodejs_compat" ]`が既に設定済み
- Drizzle ORMはCloudflare Workers環境でネイティブにサポートされている
- 追加のポリフィルは不要

### 6. drizzle.config.ts設定

**Decision**: ローカル開発とマイグレーション確認用にdrizzle.config.tsを作成

**Configuration**:
```typescript
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
})
```

**Note**:
- 本番マイグレーションには使用しない（既存の`migrations/`を継続使用）
- Drizzle Studioでのローカル確認に使用可能

### 7. 既存コードの移行パターン

**Current Pattern**:
```typescript
const { results } = await context.env.DB.prepare("select * from articles").all()
```

**New Pattern**:
```typescript
import { drizzle } from "drizzle-orm/d1"
import { articles } from "@/db/schema"

const db = drizzle(context.env.DB)
const results = await db.select().from(articles)
```

**Type Safety Improvement**:
- 現在: `first<{ "count(*)": string }>()`のような手動型注釈が必要
- 移行後: スキーマから型が自動推論される

## 解決された懸念事項

| 懸念 | 解決策 |
|------|--------|
| D1固有の型マッピング | SQLite型を使用、timestampはtext + CURRENT_TIMESTAMP |
| 既存マイグレーションとの整合性 | Drizzleスキーマを既存構造に合わせて定義 |
| Workers環境での動作 | nodejs_compat互換フラグで対応済み |

---

## 追加調査: 既存マイグレーションファイルのDrizzle移行

### 8. リモートD1の現状分析

**調査日**: 2026-01-10

**リモートD1テーブル一覧** (`blog-iine-counter`):
- `articles` - 記事メタデータ
- `likes` - いいね記録
- `tweets` - ツイートコンテンツ
- `d1_migrations` - wranglerマイグレーション履歴
- `_cf_KV` - Cloudflare内部テーブル
- `sqlite_sequence` - SQLite自動採番管理

**d1_migrationsテーブルの内容**:
| id | name | applied_at |
|----|------|------------|
| 1 | 0001_initial.sql | 2024-06-15 04:35:32 |
| 2 | 0002_add_tweets_table.sql | 2024-07-15 09:23:21 |

### 9. マイグレーション管理の整合性確保

**Decision**: `drizzle-kit pull --init`を使用し、wranglerの`migrations_dir`と`migrations_table`をDrizzle用に更新

**Rationale**:
- `drizzle-kit pull --init`は既存DBスキーマをintrospectし、初期マイグレーションとしてマーク
- `--init`フラグにより、Drizzleは現在のスキーマを「適用済み」として認識
- 今後の`drizzle-kit generate`は差分のみを生成
- wranglerの`migrations_dir = "drizzle"`設定により、wranglerコマンドでDrizzleマイグレーションを適用可能

**wrangler.toml更新内容**:
```toml
[[d1_databases]]
binding = "DB"
database_name = "blog-iine-counter"
database_id = "63fa4c1b-5b4c-46e2-b2de-e412ae5deca9"
migrations_dir = "drizzle"
migrations_table = "__drizzle_migrations"
```

**drizzle.config.ts更新内容**（d1-httpドライバー使用）:
```typescript
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
})
```

**Alternatives considered**:
- 手動で`_journal.json`を作成: エラーが発生しやすく、Drizzleの内部構造に依存
- 既存の`migrations/`ディレクトリをそのまま使用: ファイル命名規則がDrizzleと異なり、管理が複雑化

### 10. Drizzleマイグレーションファイル構造

**生成されるファイル構造**:
```
drizzle/
├── meta/
│   ├── _journal.json       # マイグレーション履歴
│   └── 0000_snapshot.json  # スキーマスナップショット
├── 0000_*.sql              # 初期マイグレーション（適用済みとしてマーク）
└── schema.ts               # introspectで生成（src/db/schema.tsに移動）
```

**_journal.jsonの構造**:
```json
{
  "version": "7",
  "dialect": "sqlite",
  "entries": [
    {
      "idx": 0,
      "version": "7",
      "when": 1736502000000,
      "tag": "0000_initial_baseline",
      "breakpoints": true
    }
  ]
}
```

### 11. マイグレーションテーブルの共存

**重要な注意点**:
- 2つのマイグレーションテーブルが共存する:
  - `d1_migrations`: 旧wranglerが使用（読み取り専用として保持）
  - `__drizzle_migrations`: Drizzle/新wranglerが使用
- 旧`migrations/`ディレクトリは参照用として保持（削除しない）
- 今後のスキーマ変更フロー:
  1. `drizzle-kit generate` でマイグレーションファイル生成
  2. `wrangler d1 migrations apply <db> --remote` で適用

**References**:
- [drizzle-kit pull](https://orm.drizzle.team/docs/drizzle-kit-pull)
- [GitHub Discussion: How do you run Drizzle migrations on D1?](https://github.com/drizzle-team/drizzle-orm/discussions/1388)
- [Drizzle ORM - Migrations](https://orm.drizzle.team/docs/migrations)

# Feature Specification: Drizzle ORM導入

**Feature Branch**: `feat/introduce-drizzle`
**Created**: 2026-01-10
**Status**: Draft
**Input**: User description: "cloudflare d1にdrizzle ORMを導入し、d1のクエリを直接入力する形式から移行します"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 型安全なデータベースクエリの実行 (Priority: P1)

開発者として、D1データベースに対するクエリを型安全に記述し、コンパイル時にエラーを検出したい。

**Why this priority**: 型安全性はプロジェクトのConstitutionで重要視されており、現在の生SQLクエリはランタイムエラーの原因となりうる。

**Independent Test**: 既存の`countLikes`関数をDrizzle ORMを使った実装に置き換え、型推論が正しく動作することを確認できる。

**Acceptance Scenarios**:

1. **Given** Drizzleスキーマが定義されている, **When** likesテーブルをクエリする, **Then** 結果の型が自動的に推論される
2. **Given** 存在しないカラム名を指定した, **When** クエリを記述する, **Then** TypeScriptコンパイルエラーが発生する

---

### User Story 2 - 既存機能の移行 (Priority: P1)

開発者として、既存のD1直接クエリ（db.ts, tweetDomain.ts）をDrizzle ORMに移行し、機能を維持したい。

**Why this priority**: 既存機能を壊さずに移行することが必須であり、これなしではリリースできない。

**Independent Test**: 既存の各Server Action（getAllArticles, countLikes, likeArticle, getAllTweets, getRecentTweets）がDrizzle ORM版で同一の結果を返すことを確認できる。

**Acceptance Scenarios**:

1. **Given** Drizzle ORMに移行済み, **When** いいねボタンを押す, **Then** 従来通りlikesレコードが挿入される
2. **Given** Drizzle ORMに移行済み, **When** 記事一覧ページを表示する, **Then** いいね数が正しく表示される
3. **Given** Drizzle ORMに移行済み, **When** ツイート一覧を取得する, **Then** 最新順でツイートが取得できる

---

### User Story 3 - スキーマ定義の一元管理 (Priority: P2)

開発者として、データベーススキーマをTypeScriptファイルで定義し、SQLマイグレーションファイルと整合性を保ちたい。

**Why this priority**: スキーマの一元管理により、今後のスキーマ変更時の保守性が向上する。

**Independent Test**: Drizzleスキーマ定義ファイルが存在し、既存の3テーブル（articles, likes, tweets）が正確に表現されていることを確認できる。

**Acceptance Scenarios**:

1. **Given** Drizzleスキーマが定義されている, **When** スキーマファイルを確認する, **Then** 既存のSQLマイグレーションと同一構造のテーブルが定義されている

---

### Edge Cases

- D1固有の型（TIMESTAMP等）がDrizzleでどのようにマッピングされるか？
- 既存のマイグレーションファイルとDrizzleスキーマの整合性をどう維持するか？
- Cloudflare Workers環境でDrizzle ORMが正常に動作するか？

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST Drizzle ORMを使用してD1データベースに接続できる
- **FR-002**: System MUST 既存のarticles, likes, tweetsテーブルをDrizzleスキーマで表現できる
- **FR-003**: System MUST 既存のServer Action（getAllArticles, countLikes, likeArticle, getAllTweets, getRecentTweets）と同等の機能をDrizzle ORMで提供する
- **FR-004**: System MUST getCloudflareContext()から取得したD1インスタンスをDrizzleに渡せる
- **FR-005**: System MUST 既存のマイグレーションファイルを維持し、Drizzleのマイグレーション機能と競合しないようにする

### Key Entities

- **Article**: 記事のメタデータ（id, created_at）
- **Like**: いいねの記録（id, article_id, created_at）、Articleへの外部キー参照
- **Tweet**: ツイートコンテンツ（id, created_at, content）

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 既存の全Server Action（5関数）がDrizzle ORM版に置き換わっている
- **SC-002**: TypeScriptコンパイルが型エラーなしで通過する
- **SC-003**: 本番環境（Cloudflare Workers）で既存機能が正常に動作する
- **SC-004**: 生SQLクエリ（DB.prepare）の使用箇所が0になる

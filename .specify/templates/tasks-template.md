# Tasks: [FEATURE_NAME]

## Task Categories

タスクは以下のカテゴリに分類される（Constitution原則に基づく）:

- **CORE**: 機能の主要な実装
- **TYPE**: 型定義、バリデーション関連
- **EDGE**: Cloudflare Workers固有の対応
- **OBS**: 可観測性（ログ、通知）関連
- **URL**: URL安定性（リダイレクト設定、パス変更対応）関連
- **UI**: コンポーネント設計、デザイン一貫性関連
- **A11Y**: アクセシビリティ対応

## Task List

### Pending

- [ ] [CORE] [タスク1の説明]
  - 依存: なし
  - ファイル: `path/to/file.ts`

- [ ] [TYPE] [タスク2の説明]
  - 依存: タスク1
  - ファイル: `path/to/file.ts`

### In Progress

（なし）

### Completed

（なし）

## Dependency Graph

```
タスク1 (CORE)
    └── タスク2 (TYPE)
        └── タスク3 (OBS)
```

## Notes

- [実装時の注意点]

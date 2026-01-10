-- テスト用ツイートデータ（既存データがあれば削除して挿入）
DELETE FROM tweets;

INSERT INTO tweets (content, created_at) VALUES
  ('テスト用つぶやき1', datetime('now', '-1 hour')),
  ('テスト用つぶやき2', datetime('now', '-2 hours')),
  ('テスト用つぶやき3', datetime('now', '-3 hours')),
  ('テスト用つぶやき4', datetime('now', '-4 hours')),
  ('テスト用つぶやき5', datetime('now', '-5 hours'));

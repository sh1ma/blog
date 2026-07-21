---
name: deploy
description: このブログ (`sh1ma/blog`) を本番環境 (blog.sh1ma.dev) にデプロイするためのリリースを作成する。「デプロイして」「本番出して」「本番にあげて」「リリースして」「リリースする」「production release 作って」など、本番反映を意図した依頼で必ず発動する。staging は main への push で自動デプロイされるためこのスキルの対象外。
---

# deploy (本番リリース)

`sh1ma/blog` の本番デプロイフローを起動する。

## デプロイフローの全体像

一次ソース: `.github/workflows/` 配下の各 yaml。要点だけ:

- `main` に push → `staging-deploy.yaml` が自動で staging に反映。
- `main` の最新コミットに対して **GitHub Release を publish** する → `production-deploy.yaml` がそのタグを checkout して本番へデプロイ。

このスキルが担当するのは **リリース作成の一手**。publish 後はワークフロー run の完走まで見届ける。

## やること

1. **前提を確認する**。
   - `main` が最新かつ CI が通っている想定。心配ならユーザに ask する。
   - 直近のリリースを `gh release list` で確認し、次に切るバージョンを決める。バージョニング方針が不明ならユーザに ask する。
2. **リリースタグとリリースノートを決める**。
   - タグ名の付け方は過去タグ (`git tag --list --sort=-creatordate | head` など) を確認して合わせる。
   - リリースノートは `gh release create --generate-notes` で自動生成できる。追加編集したい場合はユーザに ask する。
3. **`main` の最新コミットで GitHub Release を publish する**。
   - 使うコマンドは `gh release create`。フラグは実行時に `gh release create --help` で確認する。
   - `--target main` を明示し、`main` の HEAD に対してタグを打つ。
4. **本番デプロイの run を見届ける**。
   - Release publish で `production-deploy.yaml` が発火する。`gh run list --workflow=production-deploy.yaml` から run を特定し、`gh run watch` で完走まで見届ける。
   - `conclusion` が `success` であることを確認する。失敗していたら報告して調査する。「publish した」で終わらせない。
5. **結果を報告する**。
   - リリースの URL と run の URL、本番反映が完了した旨をユーザに日本語で伝える。

## 絶対に守るルール

- **対象リポジトリは `sh1ma/blog` のみ**。`--repo` で他リポジトリを指定しない。
- **リリース作成前にユーザ確認を取る**。タグ名・対象コミット (通常は `main` の HEAD) が意図と合っているかを確認してから publish する。publish した瞬間に本番デプロイが走るので後戻りできない。
- **staging を触ろうとしない**。staging は `main` push で自動なので、このスキルからは何もしない。
- **`gh` CLI の具体的なフラグは記憶で使わず、`--help` で確認する**。関連は [`gh` スキル](../gh/SKILL.md)。

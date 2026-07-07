---
name: deploy
description: このブログ (`sh1ma/blog`) を本番環境 (blog.sh1ma.dev) にデプロイするための本番PRを起動する。「デプロイして」「本番出して」「本番にあげて」「リリースして」「リリースする」「production PR 作って」など、本番反映を意図した依頼で必ず発動する。staging は main への push で自動デプロイされるためこのスキルの対象外。
---

# deploy (本番リリース)

`sh1ma/blog` の本番デプロイフローを起動する。

## デプロイフローの全体像

一次ソース: `.github/workflows/` 配下の各 yaml。要点だけ:

- `main` に push → `staging-deploy.yaml` が自動で staging に反映。
- `Create Production PR` ワークフロー (`create-production-pr.yaml`) を **手動起動** → `main` → `deploy` の PR が作られる。
- その PR をマージ → `deploy` ブランチに push されて `production-deploy.yaml` が本番へデプロイ。

このスキルが担当するのは **真ん中の「手動起動」の一手だけ**。PR のマージやマージ後の状況は担当しない (必要なら `gh:pr` スキルを使う)。

## やること

1. **前提を確認する**。
   - `main` が最新かつ CI が通っている想定。心配ならユーザに ask する。
   - 既に open な本番 PR (base: `deploy`, head: `main`) がないかを `gh pr list` で確認する。ある場合は起動せずユーザに存在を伝える (ワークフロー側でも重複作成は防いでいるが、無駄な run を避ける)。
2. **`Create Production PR` ワークフローを起動する**。
   - 使うコマンドは `gh workflow run`。フラグは実行時に `gh workflow run --help` で確認する。ワークフローファイル名は `create-production-pr.yaml`。
   - 対象ブランチは `main` (workflow_dispatch なのでこのワークフロー定義があるブランチで走る)。
3. **run の完走を確認する**。
   - 起動しっぱなしにしない。`gh run watch` などで完走まで見届け、`conclusion` が `success` であることを確認する。
   - 失敗していたら報告して調査する。「起動した」で終わらせない (過去、workflow YAML が壊れて全 run が失敗していたのに気付かれなかった実績あり)。
4. **結果を報告する**。
   - 完走した run の URL と、新しく作られた本番 PR (base: `deploy`, head: `main`) の URL を `gh pr list` から取り、ユーザに日本語で伝える。
   - 「マージすると本番反映される」ことも一言添える。マージ自体はユーザの判断。

## 絶対に守るルール

- **対象リポジトリは `sh1ma/blog` のみ**。`--repo` で他リポジトリを指定しない。
- **勝手にマージまでしない**。このスキルは PR 作成の起動まで。マージするか、いつマージするかはユーザが決める。
- **staging を触ろうとしない**。staging は `main` push で自動なので、このスキルからは何もしない。
- **`gh` CLI の具体的なフラグは記憶で使わず、`--help` で確認する**。関連は [`gh` スキル](../gh/SKILL.md)。

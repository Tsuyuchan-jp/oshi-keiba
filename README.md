# oshi-keiba

Neko長明さんのウマ娘メンバーシップにおける、推し活イベントレース向けの**仮想馬券（ポイント）システム**。

GitHub Pages は使いません。閉じた経路で URL を渡します。

## 読む順

1. [docs/README.md](docs/README.md) — Docs の地図
2. [docs/now.md](docs/now.md) — いまのフェーズ・仮置き
3. 当日オペなら [docs/playbook.md](docs/playbook.md)

## 運用上の絶対条件（要約）

- 仮想ポイントのみ。換金・現物のやり取りはしない
- メンバーシップ外に出さない
- 主催者（Neko長明さん）の既存儀式（note の予想・実況・結果）を邪魔しない

## ローカルで動かす

ローカル用の認証情報は、Git管理しない `.dev.vars` に設定します。`ADMIN_PASSWORD`、`ADMIN_USER_ID`、`MEMBER_PASSWORD`、`SESSION_SECRET` を用意し、`ADMIN_USER_ID` には [0014_admin_identity.sql](migrations/0014_admin_identity.sql) の固定UUIDを設定してください。本番の認証情報は Cloudflare Secrets で管理します。

```powershell
npm install
npm run dev:setup
npx playwright install chromium
npm run verify
npm run dev
```

`npm run verify` は型検査、単体テスト、D1・R2を含むWorker結合テスト、PC・モバイルの実ブラウザE2Eをまとめて実行します。詳しくは [デプロイ前の自動テスト](docs/testing.md) を参照してください。

- 入室: http://localhost:8787/login （共有パスは `.dev.vars` を参照）
- 場内: http://localhost:8787/
- 投票: http://localhost:8787/bet
- 管理者: http://localhost:8787/admin （パスワードは `.dev.vars` を参照）

G=3000 スペ（投票中にその開催へ参加したとき。入室だけでは入らない）。賭式は単勝・馬連・馬単・3連複・3連単（1点買い）。評価点は直置き（画面表記は Strength のことがある）。ローカルのデモ初期化は `.dev.vars` の `ALLOW_DEMO_RESET=1`。

## 本番 URL

- https://oshi-keiba.tsuyuchan-jp.workers.dev/
- 入室用・管理者用の認証情報は、主催者からメンバーへ別経路で共有します。
- 管理者: https://oshi-keiba.tsuyuchan-jp.workers.dev/admin

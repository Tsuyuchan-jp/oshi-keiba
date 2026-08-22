# oshi-keiba

Neko長明さんのウマ娘メンバーシップにおける、推し活イベントレース向けの**仮想馬券（ポイント）システム**の設計・実装リポジトリです。

**試運転版**（日曜ルムマ）の要件は [docs/09-trial-run.md](docs/09-trial-run.md)。本線の長期方針は Docs 01〜08。GitHub Pages は使いません。

## 読む順

1. [docs/README.md](docs/README.md) — Docs の地図
2. [docs/00-status.md](docs/00-status.md) — いま決まっていること / 未決
3. 試運転なら [docs/09-trial-run.md](docs/09-trial-run.md)

## 運用上の絶対条件（要約）

- 仮想ポイントのみ。換金・現物のやり取りはしない
- メンバーシップ外に出さない
- 主催者（Neko長明さん）の既存儀式（note の予想・実況・結果）を邪魔しない

## ローカルで動かす（試運転）

仮パスワードは `.dev.vars.example` を `.dev.vars` にコピーして使います。コミットしない。

```powershell
copy .dev.vars.example .dev.vars
npm install
npm run dev:setup
npm test
npm run dev
```

- 入室: http://localhost:8787/login （共有パス `demo-member`）
- 場内: http://localhost:8787/
- 投票: http://localhost:8787/bet
- 管理者: http://localhost:8787/admin 仮パス `demo-admin`

G=3000 スペ。賭式は単勝・馬連・馬単・3連複・3連単（1点買い）。Seed は単勝のみ直置き。

## 手土産 URL（Cloudflare）

閉じた試作です。検索に出さない前提で、URL を知っている人だけに渡します。

- https://oshi-keiba.tsuyuchan-jp.workers.dev/
- 管理者: https://oshi-keiba.tsuyuchan-jp.workers.dev/admin 仮パス `demo-admin`

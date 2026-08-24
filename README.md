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

仮パスワードは `.dev.vars.example` を `.dev.vars` にコピーして使います。コミットしない。

```powershell
copy .dev.vars.example .dev.vars
npm install
npm run dev:setup
npm test
npm run dev
```

- 入室: http://localhost:8787/login （共有パス `loh`）
- 場内: http://localhost:8787/
- 投票: http://localhost:8787/bet
- 管理者: http://localhost:8787/admin 仮パス `demo-admin`

G=3000 スペ。賭式は単勝・馬連・馬単・3連複・3連単（1点買い）。評価点は直置き（画面表記は Strength のことがある）。

## 本番 URL

- https://oshi-keiba.tsuyuchan-jp.workers.dev/
- 入室の共有パス: `loh`
- 管理者: https://oshi-keiba.tsuyuchan-jp.workers.dev/admin 仮パス `demo-admin`

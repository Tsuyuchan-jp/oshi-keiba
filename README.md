# oshi-keiba

Neko長明さんのウマ娘メンバーシップにおける、推し活イベントレース向けの**仮想馬券（ポイント）システム**の設計・実装リポジトリです。

現時点は手土産 MVP をローカル（Cloudflare Workers + D1）で回している途中です。方針の正本は Docs（[docs/08-mvp-consult.md](docs/08-mvp-consult.md)）。GitHub Pages は使いません。

## 読む順

1. [docs/README.md](docs/README.md) — Docs の地図
2. [docs/00-status.md](docs/00-status.md) — いま決まっていること / 未決
3. 以降は `docs/` 配下の各文書

## 運用上の絶対条件（要約）

- 仮想ポイントのみ。換金・現物のやり取りはしない
- メンバーシップ外に出さない
- 主催者（Neko長明さん）の既存儀式（note の予想・実況・結果）を邪魔しない

## ローカルで動かす（手土産 MVP）

仮パスワードは `.dev.vars.example` を `.dev.vars` にコピーして使います。コミットしない。

```powershell
copy .dev.vars.example .dev.vars
npm install
npm run dev:setup
npm test
npm run dev
```

- オッズ表: http://localhost:8787/
- デモ用投票画面（10人分を同じ画面で投票）: http://localhost:8787/demo （管理者で入室）
- 管理者: http://localhost:8787/admin 仮パス `demo-admin`

Seed は直置き。U-tools のデモレギと本番 URL はまだです。

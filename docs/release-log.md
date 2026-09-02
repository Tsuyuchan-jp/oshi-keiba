# 本番リリース記録

秘密の値や認証情報は記録しない。復旧手順は [release.md](release.md) を参照する。

## v0.4.0 — 2026-09-02 16:51 JST

- 担当者: Codex（ユーザー承認のもと実行）
- リリース対象コミット: `d311138`（本番リリース版をv0.4.0に更新する）
- 公開URL: `https://oshi-keiba.tsuyuchan-jp.workers.dev/`
- リリース前Worker ID: `679ec4ca-bf50-4b9c-ad18-65121a85589b`
- `ADMIN_USER_ID` Secret設定時の中間Worker ID: `fe6de7d9-31a1-4435-ae33-11c45d7302df`
- リリース後Worker ID: `2d78612d-4826-45f4-ae80-93a4c564a9e1`
- リリース前D1ブックマーク: `00000103-00000000-000050da-ea8683d021e5475c4acd07d088f504c1`
- 適用migration: `0010_horse_uma_dress.sql`〜`0015_r2_pending_deletions.sql`（6件）
- R2: `oshi-keiba-shots` の存在を確認
- Secrets: 必須4項目の名前を確認。`ALLOW_DEMO_RESET` と `ALLOW_ADMIN_UNDO` がないことを確認

### 自動確認

- 型検査: 成功
- Node単体テスト: 148件成功
- Worker結合テスト: 93件成功
- Playwright E2E: 3件成功（デスクトップ2件、モバイル1件）
- Wrangler dry-run: 成功。D1 `oshi-keiba` とR2 `oshi-keiba-shots` のbindingを確認
- 公開後: `/login`、`/`、`/bet`、`/admin/login` がHTTP 200
- 公開後: 上記4経路で `v0.4.0` 表示を確認
- 公開後: 未適用migrationがないことを確認
- 公開後: 固定UUIDの管理者レコードが1件あることを確認

### 補足

- `npm run deploy` 内の重複E2E実行で、E2EサーバーがWindows例外コード `3221226505` により一度起動失敗した。公開前に同一コミットの全検証を2回成功済みで、コード変更もなかったため、既存のローカル開発プロセスを停止せず `npx wrangler deploy` で公開した。
- デプロイ時に、ローカル設定がCloudflare Dashboard上の設定を上書きする旨の警告が出た。公開後のD1・R2 bindingとworkers.dev URLは正常。Routes / Custom Domainsは人間がDashboardで確認する。
- ログイン、実データ、OCR/R2画像、Dashboardログ、公開範囲の目視確認は人間による確認待ち。

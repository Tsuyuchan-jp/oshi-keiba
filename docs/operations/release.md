# 本番リリースと復旧

本番を更新する担当者向けの手順。秘密の**値**を記録・共有・コミットしない。確認するのは設定名と結果だけ。

対象は Worker `oshi-keiba`、D1 `oshi-keiba`、R2 `oshi-keiba-shots`。アプリの版番号は `package.json`、変更内容は [changelog.md](../history/changelog.md) を正とする。

## 事前に一度だけ確認すること

- Cloudflare へログインできる。自動化する場合は、対象アカウントだけの短期・閲覧専用 API トークンを使う
- Worker の Secrets に `ADMIN_PASSWORD`、`ADMIN_USER_ID`、`MEMBER_PASSWORD`、`SESSION_SECRET` がある。値は見ない
- `ALLOW_DEMO_RESET` と `ALLOW_ADMIN_UNDO` は Secrets に置かない。`wrangler.jsonc` の vars 既定は `"0"`。ローカルだけ `npm run dev` が `"1"` を渡す
- D1 の Time Travel が利用可能か、Cloudflare ダッシュボードまたは `npx wrangler d1 info oshi-keiba` で確認する
- R2 バケット `oshi-keiba-shots` がある

Time Travel が使える D1 は、直近の状態へ復元できる。保持期間はプランにより異なるため、開催記録をそれより長く残す必要が出たときだけ、別途 D1 export の保管を検討する。

## リリース前

1. [version.md](version.md) の版上げチェックを行い、`changelog.md` の対象版と `package.json` / `package-lock.json` の版番号を一致させる
2. [testing.md](testing.md) に従い、型検査・単体・Worker結合・実ブラウザE2Eをまとめて通す。初回だけ `npx playwright install chromium` も実行する

   ```powershell
   npm run verify
   ```

3. 全自動テストを再確認したうえでCloudflareのビルドとバインディングを確認する

   ```powershell
   npm run deploy:dry-run
   ```

4. 本番 Worker の Secrets 名を確認する。`ADMIN_PASSWORD`、`ADMIN_USER_ID`、`MEMBER_PASSWORD`、`SESSION_SECRET` があればよい。値は表示しない

   ```powershell
   npx wrangler secret list --format=pretty
   ```

   `wrangler.jsonc` の必須設定により、4項目のいずれかがない状態では実際の `npm run deploy` は失敗する。

5. `0014_admin_identity.sql` を初めて適用するリリースでは、そのファイルに記載された UUID を `ADMIN_USER_ID` Secret に設定する。UUID は管理者の不変IDであり、表示名やパスワードではない。

   ```powershell
   npx wrangler secret put ADMIN_USER_ID
   ```

6. 本番 DB の未適用 migration を確認する

   ```powershell
   npx wrangler d1 migrations list oshi-keiba --remote
   ```

7. D1 の復元基準として、実施時刻（JST）と現在のブックマークをリリース記録に控える

   ```powershell
   npx wrangler d1 time-travel info oshi-keiba
   ```

8. 現在の Worker のデプロイメント ID を Cloudflare ダッシュボードの Workers & Pages → `oshi-keiba` → Deployments で控える

9. Cloudflare ダッシュボードで公開範囲を確認し、リリース記録に結果を残す。現在の方針は、`https://oshi-keiba.tsuyuchan-jp.workers.dev/` を参加者へ共有する正規URLとし、独自ドメインの Route は設定しない。`workers.dev` が有効であること、Routes / Custom Domains に意図しないURLがないことを確認する。

## リリース

1. R2 バケットが未作成の初回だけ、次を実行する

   ```powershell
   npx wrangler r2 bucket create oshi-keiba-shots
   ```

2. `0014_admin_identity.sql` が未適用のリリースでは、`ADMIN_USER_ID` Secret が同ファイルの固定 UUID と一致していることを確認してから、migration を適用する。管理ログインは、このSecretとDBに作られる専用管理者レコードの一致が必須である。

3. migration 一覧で未適用があるときだけ、適用する。`0014` を含む場合は、**Worker の公開より先に**この操作を完了させる

   `0018_event_settlements.sql` は、既に公開済みの開催（第1回を含む）について `全投票額 − 全払戻・返還額` を開催別に記録し、その合計を管理者固定アカウントへ一度だけ加算する。適用前に Time Travel のブックマークを必ず控え、適用後は管理の「台帳」で開催別精算と管理スペ残高を確認する。

   ```powershell
   npx wrangler d1 migrations apply oshi-keiba --remote
   ```

4. Worker を公開する

   ```powershell
   npm run deploy
   ```

5. 表示された Worker の新しいデプロイメント ID と実施時刻を控える

## 公開直後の確認

- 本番 URL の `/login`、`/`、`/bet`、`/admin/login` が開ける
- Cloudflare ダッシュボードで、正規URL、`workers.dev` の有効状態、Routes / Custom Domains の一覧がリリース前の確認結果と一致する
- メンバー用・管理者用のパスでログインできる（値を記録しない）
- 管理画面で現在の開催、出走、台帳が想定どおり読める。公開済み開催では、台帳の有効投票・払戻・純還元率がやり直しを含まず、場への移管だけが全額返還込みになっていること
- OCR を使うリリースでは、管理者として画像を1枚登録し、表示できることを確認する
- Cloudflare ダッシュボードの Worker のログ／エラーに新しい異常がない
- `changelog.md` の「未デプロイ」表記を外し、以下をリリース記録へ残す
  - 版番号、日時、担当者
  - Git コミット ID
  - migration の適用有無
  - リリース前 D1 ブックマーク
  - 新旧 Worker デプロイメント ID
  - 確認結果と障害の有無

## 障害時の一次対応

まず、影響をメモして「コードだけの問題」か「データの問題」かを分ける。投票・残高・払戻を含む開催中は、独断で D1 を復元しない。

| 状況 | 最初にすること | 戻し方 |
|---|---|---|
| 画面表示・ログインなどコードだけの障害 | 直前の正常 Worker ID、migration の有無を確認 | Cloudflare ダッシュボードの Deployments で直前の版へ Rollback。D1 と R2 は戻らない |
| migration 後に旧コードへ戻したい | 新旧コードが現在の DB 構造を読めるか確認 | 互換性を確認できない場合は Worker を戻さず、修正版を出す。Worker のロールバックだけでは DB 構造は戻らない |
| 誤った更新・削除など D1 データ障害 | 直ちに管理操作を止め、復元したい時刻と、その後の投票・残高変更への影響を確認 | Time Travel で復元する。実行前の現在ブックマークを必ず控える |
| R2 の画像が消えた | 対象の馬・開催・画像キーを記録 | D1 復元では画像本体は戻らない。元画像から再登録する。`published` 開催の画像は自動削除しない。 |

### D1 を復元する場合

これは DB 全体を過去の時点で上書きし、実行中の処理も中断する操作。主催者が、失われる可能性のある投票・残高・払戻を確認してから実行する。

```powershell
# まず現在の状態を控える（この値が復元の取り消しにも使える）
npx wrangler d1 time-travel info oshi-keiba

# 控えた時刻またはブックマークへ復元する
npx wrangler d1 time-travel restore oshi-keiba --bookmark=<復元先のブックマーク>
```

復元後は公開直後の確認を再度行う。復元前に控えたブックマークがあれば、誤復元もそこへ戻せる。

## この手順で扱わないこと

- Time Travel の保持期間より長いデータ保管は、必要になった時点で D1 export の保管方針を追加する

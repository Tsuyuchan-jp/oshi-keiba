# 本番リリース記録

## v0.9.1 — 2026-10-01 16:33 JST

- リリース対象コミット: `d8a4b00`（リリース手順から今回限りの migration 注記を外す。版 0.9.1 の文書確定は `b78dfa3`）
- 本番URL: `https://oshi-keiba.tsuyuchan-jp.workers.dev/`
- リリース前Worker ID: `dc31f5ba-35e7-45f8-b9e1-df8c372dc421`
- リリース後Worker ID: `135bd653-98c5-4017-babb-3eb6221fb534`
- リリース前D1ブックマーク: `0000170d-00000000-000050f7-9e6af9cc4284aded8276e54c83ac258f`（2026-10-01 16:28 JST）
- 適用migration: なし（本番に未適用migrationなし）
- Secrets: 必須名（`ADMIN_PASSWORD` / `ADMIN_USER_ID` / `MEMBER_PASSWORD` / `SESSION_SECRET`）の設定を確認
- R2: `oshi-keiba-shots` 既存
- 認証: 通常の Wrangler ログイン。API トークンは使っていない
- 本番vars: `ALLOW_DEMO_RESET=0`
- 公開範囲: deploy 結果に出たURLは `https://oshi-keiba.tsuyuchan-jp.workers.dev` のみ。`wrangler.jsonc` に独自ドメインの Route はない

### 公開前検証

- 型検査: 成功
- Nodeテスト: 216件成功
- Workerテスト: 113件成功
- Playwright E2E: 12件成功（初回はPlaywright Chromium未導入で失敗したため `npx playwright install chromium` のあと再実行）
- Wrangler dry-run: 成功。D1 `oshi-keiba`、R2 `oshi-keiba-shots`、本番用vars `ALLOW_DEMO_RESET=0` を確認
- `npm run deploy` の直前にも同じ自動テストが成功した

### 公開後確認

- `/login`、`/`、`/admin/login`: HTTP 200
- 未認証の `/bet`: `/login` へ HTTP 303
- `/login` で `v0.9.1` の表示を確認
- `wrangler deployments status` で新Worker IDが100%配信されていることを確認
- 新Worker IDのエラーログを短時間監視し、上記URLへの確認アクセス中にエラーは出なかった
- パスワードを使うログインと、管理画面の開催・出走・台帳の目視は未実施

今回のリリースではWorkerコードと静的アセットだけを更新し、D1とR2のデータ変更は行っていない。障害時はリリース前Worker IDへ戻し、D1データ障害が確認された場合に限り上記ブックマークを使う。

## v0.9.0 — 2026-09-27 23:17 JST

- リリース対象コミット: `d8e81a2`（結合テストの開催に余剰スタミナ評価の選択を入れる。版 0.9.0 は `046ea39`）
- 本番URL: `https://oshi-keiba.tsuyuchan-jp.workers.dev/`
- リリース前Worker ID: `8da10b69-74b6-4e2d-8e04-fc1f74fe004b`
- リリース後Worker ID: `dc31f5ba-35e7-45f8-b9e1-df8c372dc421`
- リリース前D1ブックマーク: `000016e9-00000000-000050f3-f501db4820bb085350837311cec00504`
- 適用migration: `0020_pre_race_assessments.sql`、`0021_analysis_exotic_archives.sql`
- Secrets: 必須名（`ADMIN_PASSWORD` / `ADMIN_USER_ID` / `MEMBER_PASSWORD` / `SESSION_SECRET`）の設定を確認
- R2: `oshi-keiba-shots` 既存
- 認証: 通常の Wrangler ログイン。API トークンは使っていない
- 本番vars: `ALLOW_DEMO_RESET=0`

### 公開前検証

- 型検査: 成功
- Nodeテスト: 214件成功
- Workerテスト: 113件成功
- Playwright E2E: 12件成功
- 適用前の migration 一覧は `0020` と `0021` のみ。適用後は未適用なし

### 公開後確認

- `/login`、`/`、`/admin/login`: HTTP 200
- 未認証の `/bet`: `/login` へ HTTP 303
- `/login` で `v0.9.0` の表示を確認
- `wrangler deployments list` で新Worker IDが100%配信されていることを確認

適用した migration はテーブルと列の追加だけ。既存の投票・残高・払戻は書き換えていない。障害時、画面だけの問題はリリース前Worker IDへ戻せる。D1 の構造は戻らないので、データ障害が確認された場合に限り上記ブックマークを使う。

## v0.8.6 — 2026-09-14 22:31 JST

- リリース対象コミット: `8b99ffe`（場の会計表示を実装クローズし docs と版を 0.8.6 にする）
- 本番URL: `https://oshi-keiba.tsuyuchan-jp.workers.dev/`
- リリース前Worker ID: `3cc6273c-16f5-406d-ba54-4f686e7bf45f`
- リリース後Worker ID: `8da10b69-74b6-4e2d-8e04-fc1f74fe004b`
- リリース前D1ブックマーク: `00000823-00000000-000050e6-2ffc878614a23c2720aabd8700c39161`
- 適用migration: なし（本番に未適用migrationなし）
- Secrets: 必須名（`ADMIN_PASSWORD` / `ADMIN_USER_ID` / `MEMBER_PASSWORD` / `SESSION_SECRET`）の設定を確認
- R2: `oshi-keiba-shots` 既存

### 公開前検証

- 型検査: 成功
- Nodeテスト: 193件成功
- Workerテスト: 107件成功
- Playwright E2E: 10件成功（初回はPlaywright Chromium未導入で失敗したため `npx playwright install chromium` のあと再実行）
- Wrangler dry-run: 成功。D1 `oshi-keiba`、R2 `oshi-keiba-shots`、本番用vars `ALLOW_DEMO_RESET=0` / `ALLOW_ADMIN_UNDO=0` を確認

### 公開後確認

- `/login`、`/`、`/admin/login`: HTTP 200
- 未認証の `/bet`: `/login` へ HTTP 303
- `/login` で `v0.8.6` の表示を確認
- `wrangler deployments list` で新Worker IDが100%配信されていることを確認

今回のリリースではWorkerコードだけを更新し、D1とR2のデータ変更は行っていない。障害時はリリース前Worker IDへ戻し、D1データ障害が確認された場合に限り上記ブックマークを使う。管理台帳の有効投票・純還元率は、ログイン後に目視確認する。

## v0.8.5 緊急修正 — 2026-09-13 20:42 JST

- リリース対象コミット: `1e10c56`（緊急対応としてUndo機能を停止する）
- 本番URL: `https://oshi-keiba.tsuyuchan-jp.workers.dev/`
- リリース前Worker ID: `8b1ec3b6-27a8-40e2-adf0-e1556e5d7dd8`
- リリース後Worker ID: `3cc6273c-16f5-406d-ba54-4f686e7bf45f`
- リリース前D1ブックマーク: `000006e2-00000008-000050e5-b8f7c8e4ee30d78abf759d4e47dfe926`
- 適用migration: なし（本番に未適用migrationなし）
- Secrets: 必須名（`ADMIN_PASSWORD` / `ADMIN_USER_ID` / `MEMBER_PASSWORD` / `SESSION_SECRET`）の設定を確認

### 公開前検証

- 型検査・Nodeテスト: 成功（Node 192件）
- Workerテスト: 107件成功
- Playwright E2E: 10件成功
- Wrangler dry-run: 成功。D1 `oshi-keiba`、R2 `oshi-keiba-shots`、本番用vars `ALLOW_DEMO_RESET=0` / `ALLOW_ADMIN_UNDO=0` を確認

### 公開後確認

- `/login`、`/`、`/admin/login`: HTTP 200
- 未認証の `/bet`: HTTP 303
- `wrangler deployments list` で新Worker IDが100%配信されていることを確認
- 本番D1を読み取り確認し、現在開催は `closed`、17頭、保存済み着順0件、順位重複0件であることを確認
- 既存の `admin_undo` 1行は削除・更新せず保持。新しいUndo生成とUndo画面・実行経路を緊急停止

今回のリリースではWorkerコードだけを更新し、D1とR2のデータ変更は行っていない。障害時はリリース前Worker IDへ戻し、D1データ障害が確認された場合に限り上記ブックマークを使う。

## v0.8.5 — 2026-09-12 09:31 JST

- リリース対象コミット: `aa9f736`（v0.8.5のリリース準備を行う）
- 本番URL: `https://oshi-keiba.tsuyuchan-jp.workers.dev/`
- リリース前Worker ID: `2bbaedeb-06f6-4e14-8b8d-1c2fb9cb6299`
- リリース後Worker ID: `8b1ec3b6-27a8-40e2-adf0-e1556e5d7dd8`
- リリース前D1ブックマーク: `0000053c-00000000-000050e4-f6fadb0c27081aab1bfadca4e4b58f8d`
- 適用migration: なし（本番に未適用migrationなし）
- Secrets: 必須名（`ADMIN_PASSWORD` / `ADMIN_USER_ID` / `MEMBER_PASSWORD` / `SESSION_SECRET`）の設定を確認

### 公開前検証

- 型検査・Nodeテスト・Workerテスト: 成功（Worker 107件）
- Playwright E2E: 10件成功
- Wrangler dry-run: 成功。D1 `oshi-keiba`、R2 `oshi-keiba-shots`、本番用vars `ALLOW_DEMO_RESET=0` / `ALLOW_ADMIN_UNDO=0` を確認

### 公開後確認

- `/login`、`/`、`/admin/login`: HTTP 200
- 未認証の `/bet`: `/login` へ HTTP 303
- `/login` で `v0.8.5` の表示を確認
- `wrangler deployments list` で新Worker IDが100%配信されていることを確認

`npm run deploy` の事前E2EでWindowsのテスト用Workerが一度だけ異常終了したが、同一コミットの直前dry-runと再実行したE2E 10件は成功した。コード変更なしで `npx wrangler deploy` を実行した。

## v0.8.4 — 2026-09-12 08:38 JST

- リリース対象コミット: `cf71915`（v0.8.4のリリース準備を行う）
- 本番URL: `https://oshi-keiba.tsuyuchan-jp.workers.dev/`
- リリース前Worker ID: `7f0e8a67-31f0-4c9b-adde-10bb631e132b`
- リリース後Worker ID: `2bbaedeb-06f6-4e14-8b8d-1c2fb9cb6299`
- リリース前D1ブックマーク: `00000530-00000000-000050e3-4fa2936a187f4f953f2fa16b5d158426`
- 適用migration: なし（本番に未適用migrationなし）
- Secrets: 必須4件（`ADMIN_PASSWORD` / `ADMIN_USER_ID` / `MEMBER_PASSWORD` / `SESSION_SECRET`）の名前のみ確認

### 事前検証

- 型検査: 成功
- Worker統合テスト: 107件成功
- Playwright E2E: 10件成功
- Wrangler dry-run: 成功。D1 `oshi-keiba`、R2 `oshi-keiba-shots`、本番用vars `ALLOW_DEMO_RESET=0` / `ALLOW_ADMIN_UNDO=0` を確認

### 公開後確認

- `/login`、`/`、`/admin/login`: HTTP 200
- 未認証の`/bet` → `/login`: HTTP 303
- `/login` で `v0.8.4` の表示を確認
- `wrangler deployments list` で新Worker IDが100%配信されていることを確認

障害時はリリース前Worker IDへ戻し、必要時のみ上記D1ブックマークを使う。手順は [release.md](../operations/release.md) を参照する。

## v0.8.3 — 2026-09-12 04:12 JST

- リリース対象コミット: `061ea01`（メンバー向けウマ柱の実機確認完了、v0.8.3）
- 本番URL: `https://oshi-keiba.tsuyuchan-jp.workers.dev/`
- リリース前Worker ID: `bd6a00b3-81a2-4318-8717-3e5c699a20b1`
- リリース後Worker ID: `0c237b3a-4f69-4f55-855d-e29eb6e43dec`
- リリース前D1ブックマーク: `000004f9-00000000-000050e3-71b63ae0dcb17322857ba4574c8371f9`
- 適用migration: なし（本番に未適用migrationなし）
- Secrets: 必須4件（`ADMIN_PASSWORD` / `ADMIN_USER_ID` / `MEMBER_PASSWORD` / `SESSION_SECRET`）の名前のみ確認

### 事前検証

- 型検査: 成功
- Worker統合テスト: 107件成功
- Playwright E2E: 10件成功
- Wrangler dry-run: 成功。D1 `oshi-keiba`、R2 `oshi-keiba-shots`、本番用vars `ALLOW_DEMO_RESET=0` / `ALLOW_ADMIN_UNDO=0` を確認

### 公開後確認

- `/login`、`/`、`/admin/login`: HTTP 200
- 未認証の`/bet` → HTTP 303、`/admin` → HTTP 303
- `/login` で `v0.8.3` の表示を確認
- `wrangler deployments list` で新Worker IDが100%配信されていることを確認

障害時はリリース前Worker IDへ戻し、必要時のみ上記D1ブックマークを使う。手順は [release.md](../operations/release.md) を参照する。

## v0.8.1 — 2026-09-09 19:50 JST

- リリース対象コミット: `ea5dcbd`（出走編集スキル再照合を文書化）
- 本番URL: `https://oshi-keiba.tsuyuchan-jp.workers.dev/`
- リリース前Worker ID: `fb35bcb6-0acf-4841-b379-4554a9b28efd`
- リリース後Worker ID: `1ae83de5-6a32-485f-be07-61d14db91c12`
- リリース前D1ブックマーク: `00000262-00000000-000050e1-15fa747f7c36766ed2ddb5095e27003a`
- 適用migration: なし（本番に未適用migrationなし）
- Secrets: 必須4項目の設定を確認（値は未表示）

### 事前検証

- 型検査: 成功
- Node単体テスト: 185件成功
- Worker統合テスト: 107件成功
- Playwright E2E: 10件成功
- Wrangler dry-run: 成功。D1、R2、Assetsのbindingと本番用vars（`ALLOW_DEMO_RESET=0` / `ALLOW_ADMIN_UNDO=0`）を確認

### 公開後確認

- `/login`、`/`、`/admin/login`: HTTP 200
- 未認証の`/bet` → `/login`、`/admin` → `/admin/login`: HTTP 303
- `/login`で`v0.8.1`表示を確認

秘密の値や認証情報は記録しない。復旧手順は [release.md](../operations/release.md) を参照する。

## v0.8.0 — 2026-09-09 19:07 JST

- 担当者: Codex（ユーザー承認のもと実行）
- リリース対象コミット: `3b95519`（v0.8.0のリリース準備を記録する）
- 公開URL: `https://oshi-keiba.tsuyuchan-jp.workers.dev/`
- リリース前Worker ID: `fb35bcb6-0acf-4841-b379-4554a9b28efd`
- リリース後Worker ID: `941c85ea-9446-4bdd-a68e-c40e4a9cd2a2`
- リリース前D1ブックマーク: `00000259-00000000-000050e1-9eab13d51d106db6a094e4809f91f70e`
- 適用migration: なし（本番に未適用migrationなし）
- Secrets: 必須4項目の名前を確認
- 公開範囲: `workers_dev: true` の公開URLを確認。設定ファイルに Routes / Custom Domains の指定はなく、Wrangler CLIでは一覧取得に未対応のためDashboardでの目視確認は未実施

### 自動確認

- 型検査: 3構成成功
- Node単体テスト: 184件成功
- Worker結合テスト: 107件成功
- Playwright E2E: 10件成功
- Wrangler dry-run: 成功。D1、R2、Assets のbindingと本番用vars（`ALLOW_DEMO_RESET=0` / `ALLOW_ADMIN_UNDO=0`）を確認
- 公開後: `/login`、`/`、`/admin/login` がHTTP 200、未認証の `/bet` は `/login` へHTTP 303、未認証の `/admin` は `/admin/login` へHTTP 303
- 公開後: `/login` で `v0.8.0` 表示を確認

### 補足

- 回復スキルと有効な自己スタミナ消費スキルを、緑スキルを含む実効スタミナへ反映した。相手へのスタミナデバフは計算対象外
- 認証情報を使う操作は行わず、管理者・メンバーのログイン後確認は実機確認済みとしてユーザーから承認を受けた

## v0.6.0 — 2026-09-08 20:54 JST

- 担当者: Codex（ユーザー承認のもと実行）
- リリース対象コミット: `1953caf`（場の管理スペと開催別精算を追加）
- 公開URL: `https://oshi-keiba.tsuyuchan-jp.workers.dev/`
- リリース前Worker ID: `aabfefc9-28fa-4b58-bc4f-092bc41cc7a4`
- リリース後Worker ID: `a085904f-f2fb-4003-a685-6940ea512549`
- リリース前D1ブックマーク: `00000144-00000000-000050e0-5c4827f0292433c76a2b3b2386087fe1`
- 適用migration: `0016_analysis_snapshots.sql`〜`0018_event_settlements.sql`（3件）
- 第1回精算: 投票58,500スペ、払戻・返還50,980スペ、管理者移管7,520スペ

### 自動確認

- 型検査: 3構成成功
- Node単体テスト: 179件成功
- Worker結合テスト: 107件成功
- Playwright E2E: 10件成功（デスクトップ6件、モバイル4件。台帳のページ固定・枠内スクロールを含む）
- Wrangler dry-run: 成功。D1、R2、Assets のbindingと本番用varsを確認
- 公開後: `/login`、`/`、`/admin/login` がHTTP 200、未認証の `/bet` は `/login` へHTTP 303、未認証の `/admin` は `/admin/login` へHTTP 303
- 公開後: `/login` で `v0.6.0` 表示を確認
- 公開後: 管理者ログインと台帳表示を確認。管理スペ残高7,520スペ、総発行スペ48,000スペ、第1回開催名が本番DBと一致

### 補足

- `0018_event_settlements.sql` は公開済み開催を実際の投票・払戻履歴から一度だけ遡及精算した。適用後、開催精算レコードと管理者残高がともに7,520スペで一致することをD1で確認した
- 台帳はPC・モバイルともページ本体を固定し、開催別精算・メンバー残高・全投票の枠内だけをスクロールする

## v0.5.1 — 2026-09-06 01:19 JST

- 担当者: Cursor Grok（ユーザー承認のもと実行）
- リリース対象コミット: `d49088e`（本番リリース版をv0.5.1に更新する）
- 公開URL: `https://oshi-keiba.tsuyuchan-jp.workers.dev/`
- リリース前Worker ID: `dca0db24-db51-4ff3-b562-236b35207b76`
- リリース後Worker ID: `3dcd6696-5868-4862-8c78-fad7f0233939`
- リリース前D1ブックマーク: `0000012e-00000000-000050dd-bcd054a39aeddcab82dcfded73af5711`
- 適用migration: なし（`0015_r2_pending_deletions.sql` まで適用済み）
- R2: `oshi-keiba-shots` の存在を確認
- Secrets: 必須4項目の名前を確認

### 自動確認

- 型検査: 成功
- Node単体テスト: 179件成功
- Worker結合テスト: 104件成功
- Playwright E2E: 9件成功（デスクトップ6件、モバイル3件。パドック18頭の画面高収まりを含む）
- Wrangler dry-run: 成功。D1、R2、Assets の binding と本番用 vars（`ALLOW_DEMO_RESET=0` / `ALLOW_ADMIN_UNDO=0`）を確認
- 公開後: `/login`、`/`、`/admin/login` がHTTP 200、未認証の `/bet`・`/paddock` は `/login` へHTTP 303、未認証の `/admin` は `/admin/login` へHTTP 303
- 公開後: `/login` と `/` で `v0.5.1` 表示を確認
- 公開後: 更新された静的ファイルは `/paddock-mobile.css` と `/paddock.js` の2件。本番CSSに画面高適応、本番JSに `fitMobileHeight` / `enableSwipeToClose` があることを確認
- 公開後: 号外背景・立ち絵は未認証でHTTP 404

### 補足

- 差分はパドックのスマホ向けCSS/JSとE2E・Docsのみ。Worker本体、D1、R2、Secretsは変更していない
- v0.5.0記録のリリース後ID `9c83fc8d-1374-4e64-8605-13a51c5e7d50` のあと、同日 22:38 JST に未記録の Worker `dca0db24-db51-4ff3-b562-236b35207b76` があった。本リリースはそれを直前版として更新した
- 管理者パスでのログインと、管理・ウマ柱・号外・パドック実機の目視確認は人間による確認待ち。Routes / Custom Domains も Dashboard での目視確認待ち

## v0.5.0 — 2026-09-05 22:18 JST

- 担当者: Codex（ユーザー承認のもと実行）
- リリース対象コミット: `afd3ab1`（号外背景を認証付きR2配信へ切り替える）
- 公開URL: `https://oshi-keiba.tsuyuchan-jp.workers.dev/`
- リリース前Worker ID: `2d78612d-4826-45f4-ae80-93a4c564a9e1`
- リリース後Worker ID: `9c83fc8d-1374-4e64-8605-13a51c5e7d50`
- リリース前D1ブックマーク: `0000011f-00000000-000050dd-9ed10b74943c7f1e2373dd1ab4f52ca6`
- 適用migration: なし（`0015_r2_pending_deletions.sql` まで適用済み）
- R2: `oshi-keiba-shots` の存在を確認。号外背景を `_app-assets/gougai_bg.png` へ配置
- Secrets: 必須4項目の名前を確認

### 自動確認

- 型検査: 成功
- Node単体テスト: 179件成功
- Worker結合テスト: 104件成功（保護画像の未認証拒否・R2認証配信を含む）
- Playwright E2E: 8件成功（デスクトップ6件、モバイル2件）
- Wrangler dry-run: 成功。D1、R2、認証付きAssetsのbindingと本番用varsを確認
- 公開後: `/login`、`/`、`/admin/login` がHTTP 200、未認証の `/bet` は `/login` へHTTP 303
- 公開後: 管理、ウマ柱、号外、窓口で `v0.5.0` 表示を確認
- 公開後: 号外背景・縦書き画像・立ち絵は未認証でHTTP 404、管理者認証後に `image/png` でHTTP 200
- 公開後: 管理者ログイン成功、管理・ウマ柱・号外・窓口の主要画面がHTTP 200

### 補足

- `gougai_bg.png` はWindows上でWranglerから直接開けずStatic Assetsで欠落したため、同一見た目に再エンコードしたPNGを非公開R2へ置き、管理者認証後だけ元のURLから配信する構成にした。
- 途中確認用Worker IDは `9405828e-5b4f-46df-9d4c-0df3527e8ca1`、`999d76de-1a43-466b-a0e2-1496417c6439`、`a3b5fcf5-2395-46e9-8bce-34da48e4094a`。いずれも画像URLの未認証拒否は有効だった。
- 最終の `npm run deploy` は、WindowsのE2E状態ファイル競合（`EBUSY`）でデプロイ前に停止した。同一コミットで型検査・Node・Workerが成功し、残存プロセス解消後のE2E 8件も成功したため、コード変更なしで `npx wrangler deploy` を実行した。

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

# デプロイ前の自動テスト

本番へ出す前は、次の1コマンドを実行する。

```powershell
npm run verify
```

これは型検査と全自動テストを順番に実行し、1件でも失敗すると途中で終了する。`npm run deploy` の直前にも同じ検証が自動実行される。自動テストはバグが絶対にないことを保証するものではないが、人手だけでは確認しきれない主要仕様と回帰を毎回同じ条件で検査できる。

## 初回だけ必要な準備

```powershell
npm install
npx playwright install chromium
```

Chromium は実際の画面操作を再現するE2Eテストに使う。

## 検査する範囲

| 検査 | 現在の件数 | 主な対象 |
|---|---:|---|
| TypeScript 型検査 | 3構成 | アプリ本体、Worker結合テスト、ブラウザE2E |
| Node 単体テスト | 179件 | 配当・評価点・管理操作・ウマ柱・号外などの純粋ロジック |
| Worker 結合テスト | 105件 | 認証、権限、全経路、開催進行、全5賭式、同時投票、やり直し、取消・返還、分析ログCSV、全migration、D1・R2画像管理 |
| Playwright E2E | 9件 | PCでのメンバー投票、管理画面、OCR、ウマ柱・号外の画像書き出し、Pixel 7相当の横はみ出し、パドック18頭の画面高収まり |

合計293件の自動テストを実行する。件数はテスト追加により増えるため、最終的な実行件数はコマンド結果を正とする。

テスト用のD1・R2・認証情報は本番から分離されている。E2E開始時に消去するのは、リポジトリ内の専用領域 `.wrangler/e2e-state` だけであり、本番データや通常のローカル開発データには触れない。

## 一部だけ再実行する場合

失敗原因を直した直後は、該当部分だけ再実行できる。最後は必ず `npm run verify` で全体を通す。

```powershell
npm run typecheck
npm test
npm run test:worker
npm run test:e2e
```

E2E失敗時のスクリーンショットや記録は `test-results/` に出力される。Worker結合テストでは、workerd が日本語のフォーム送信をテキストとして読む際に `application/x-www-form-urlencoded` の警告を表示することがある。テスト結果が成功なら既知の診断表示であり、失敗ではない。

## 自動化だけでは確認できないこと

ローカルの自動テストでは、本番Cloudflare上のSecretの有無、未適用migration、公開URL・Route、実際のログを検証できない。デプロイ時は [本番リリースと復旧](release.md) に従い、次も確認する。

- 本番Secretは値を表示せず、必要な名前だけ確認する
- 本番D1の未適用migrationと復元用ブックマークを確認する
- `npm run deploy:dry-run` で全自動テストとCloudflareビルド確認を通す
- 公開直後にログイン、主要画面、画像1枚、Workerログを最小限確認する

`npm run verify` と `npm run deploy:dry-run` は本番へ公開しない。実際に公開するのは `npm run deploy` である。

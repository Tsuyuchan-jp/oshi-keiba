# Docs 地図

方針が変わったら **該当ファイルを直してから** 会話と実装を続ける。記憶やチャット履歴より、ここを正とする。

連番カタログや REQ 番号は使わない。開催ごとの比較・再生は Docs に積まず [`reports/`](../reports/) へ置く。

## 読む順

1. このファイル
2. [いま](now.md) — 現在のフェーズ・仮置き・未決
3. [次に取り組むこと](next.md) — 作業キュー
4. 作業に応じて、下の分類から必要な資料だけ読む

本番に出すときは [自動テスト](operations/testing.md) を実行してから、[本番リリースと復旧](operations/release.md) の手順を使う。`npm run deploy` だけでは D1 migration と R2 作成が反映されず、復旧判断もできない。

## 資料の分類

| 分類 | ファイル | 内容 |
|---|---|---|
| 直下 | [now.md](now.md) / [next.md](next.md) / [product.md](product.md) | 現在地、次の作業、プロダクトの判断軸 |
| 仕様 | [specifications/](specifications/) | [オッズ](specifications/odds.md)、[評価点](specifications/score.md)、[OCR](specifications/ocr.md)、[OCR例外](specifications/ocr-aliases.md)、[分析ログ](specifications/analysis-log.md) |
| 運用 | [operations/](operations/) | [当日オペ](operations/playbook.md)、[テスト](operations/testing.md)、[リリースと復旧](operations/release.md)、[版上げ](operations/version.md) |
| 機能別 | [features/](features/) | [号外](features/gougai.md)、[ウマ柱](features/umabashira.md) |
| 履歴 | [history/](history/) | [変更履歴](history/changelog.md)、[本番リリース記録](history/release-log.md)、[デプロイ前レビュー記録](history/predeploy-fix-list.md) |
| 参考 | [reference/](reference/) | [見送った案](reference/rejected.md) |
| モック | [mocks/](mocks/) | 画面・紙面のモックと素材 |

内部の点数は **評価点**。通常のメンバー画面には出さず、ウマ柱の紙面だけ例外として表示する。

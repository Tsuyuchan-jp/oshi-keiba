# Docs 地図

方針が変わったら **該当ファイルを直してから** 会話と実装を続ける。記憶やチャット履歴より、ここを正とする。

連番カタログや REQ 番号は使わない。開催ごとの比較・再生は Docs に積まず [`reports/`](../reports/) へ置く。

## 読む順

1. このファイル
2. [now.md](now.md) — いまのフェーズ・仮置き・未決
3. 触る作業だけ、下の該当ファイル。毎回全部は読まない
4. 第2回までにやることは [next.md](next.md)（作業キュー。式の本文は置かない）

本番に出すときは [testing.md](testing.md) で自動検証し、[release.md](release.md) の手順を使う。`npm run deploy` だけでは D1 migration と R2 作成が反映されず、復旧判断もできない。OCR 固有の補足は [ocr.md](ocr.md)。

## ファイル

| ファイル | 内容 |
|---|---|
| [now.md](now.md) | いまのフェーズ、開催の仮置き数字、未決 |
| [product.md](product.md) | 何を作るか、役割、ガードレール、儀式 |
| [odds.md](odds.md) | 投票・参考オッズ・確定配当・ポイント |
| [playbook.md](playbook.md) | 画面・当日オペ・入場パス |
| [score.md](score.md) | 評価点の正本（式・保存）。読みの根拠は同ファイル後半 |
| [ocr.md](ocr.md) | 本戦スクショの読み取り |
| [ocr-aliases.md](ocr-aliases.md) | OCR スキル名の例外対応（誤読→正式名） |
| [version.md](version.md) | 画面版の表示位置と版上げ手順 |
| [changelog.md](changelog.md) | リリースごとの変更内容と SemVer の運用 |
| [testing.md](testing.md) | デプロイ前の全自動テスト、対象範囲、失敗時の見方 |
| [release.md](release.md) | 本番リリース前後の確認、障害時の復旧判断 |
| [rejected.md](rejected.md) | 見送った案と理由 |
| [next.md](next.md) | 次に取り組む項目名と参照 |

内部の点数は **評価点**。メンバー画面には出さない。

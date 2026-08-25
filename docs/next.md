# 次に取り組むこと

作業キュー。式や画面の本文はここには書かない。完了したら該当する Docs を直し、項目はリストから外して末尾アーカイブへ移す。

## 現在進行中

- （空き）

## そのあと

- 場内デザインを本番へ（モック仮置き。実装は後）— [venue-board](mocks/venue-board/layout-venue.html)
- 窓口デザインを本番へ（案A・マークカード仮置き。実装は後）— [quiet.html](mocks/bet-window/quiet.html)
- 入場デザインを本番へ（モック仮置き。実装は後）— [gate](mocks/gate/index.html)
- Neko長明さんへの評価点の式確認（手土産＝動く実装は揃った）— [score.md](score.md)
- 管理画面の Strength 表記を評価点に揃える
- OCR / 評価点の細かい調整（読取・表示 UI など）— [ocr.md](ocr.md)・[score.md](score.md)
- 特払いのキャリーオーバーをコミュニティ向けに出すか — [trial-odds-report](../reports/2026-08-23/trial-odds-report.md) 末尾
- 投票中ボードの監査ログ（スナップショット）を足すか — 同レポートの実装メモ
- 飛び入り時のアプリ扱い
- 投票開始と部屋立ての前後
- 連勝への Seed（参考のみ。確定は触らない）
- メンバーシップ本認証、景品
- 管理者ポイントの管理について相談。場の総スペ数を把握するため、投票したメンバーが失ったポイントと控除率 D で引かれたスペを管理者ポイントとして管理したい — [odds.md](odds.md)

---

## アーカイブ

完了済みの控え。普段は見ない。復帰・迷い時だけ。新しい順。

- 入場デザイン仮置き・採用（静かな窓口トーン。⋯は枠内、PCは右下にも使い方／管理者）— [gate](mocks/gate/index.html)
- 窓口デザイン仮置き（案A・マークカード・所持スペ帯・買うは下固定。ナビ名は窓口、見出しは発売所）— [quiet.html](mocks/bet-window/quiet.html)
- 場内デザイン仮置き（アプリシェル＋場の背景イラスト＋LED電光。列は Grid。脚質列あり。本番未適用）— [layout-venue.html](mocks/venue-board/layout-venue.html)
- OCR 受け入れ画像に WebP を追加（PNG / JPEG と共通の MIME 正規化・実機確認済み）— [ocr.md](ocr.md)
- OCR・評価点まわり実装クローズ（細かい修正は後）。開催 `score_setup`・出走 `score_input`・ファジー ID 化・脚質 UI・`computeScore`→Strength→Seed・直置き逃げ・実機確認済み — [score.md](score.md)・[ocr.md](ocr.md)
- 出走のステ・スキル id・適性・脚質を `computeScore` に渡し、管理画面の評価点へ（直置き併用）。OCR 脚質 UI（S1つ初期選択）とファジー ID 化も含む — [score.md](score.md)・[ocr.md](ocr.md)
- U-tools 有効スキル id を開催保存時にスナップショット（コース×4脚質、ranked 全件、照合は id）— [score.md](score.md)
- OCR（本戦のみ）クローズ — 1頭ずつ読取・名前流し・読取画像の R2 保存。一括枠なし。細かい調整と表示 UI は後 — [ocr.md](ocr.md)

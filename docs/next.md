# 次に取り組むこと

作業キュー。式や画面の本文はここには書かない。完了したタスクは削除だけで終えない。該当する Docs を直し、項目はリストから外して末尾の「アーカイブ」先頭へ移す。完了報告・コミット前にこの移動を確認する。

## 次にやること

- PC場内のシェル拡大と字スケール（A/B）のユーザー実機確認 — [playbook.md](operations/playbook.md)

## そのあと

- 票入り台帳の絞り込み実機 — [ledger.html](mocks/admin-dash/ledger.html)
- 飛び入り時のアプリ扱い
- 投票開始と部屋立ての前後
- 連勝への Seed（参考のみ。確定は触らない）
- メンバーシップ本認証、景品

---

## アーカイブ

- スマホの場内・窓口ヘッダーを実装クローズ（タイトル行と状態行を分離。投票中は場内でも締切時刻を出す。実機確認OK）— [playbook.md](operations/playbook.md)

- 場内からパドックへの足元導線を実装クローズ（投票中は「パドックを見る」と「馬券を買う」を並べ、開催準備中と締切後は「出走馬をパドックで見る」。結果公開後の足元には出さない。既存ナビは残す。実機確認OK）— [paddock.md](features/paddock.md)・[playbook.md](operations/playbook.md)

- スタミナ計算を実装クローズ（`master.mdb` 由来の回復率・自己スタミナ消費率を出走登録へ表示し、緑スキルと合わせた実効スタミナで目標値を判定。相手へのスタミナデバフは計算対象外。実機確認OK）— [score.md](specifications/score.md)・[ocr.md](specifications/ocr.md)

- 場の会計を実装。結果公開時に `全投票額 − 全払戻・返還額` を管理者固定アカウントへ一度だけ移し、台帳に管理スペ残高・総発行スペ・未精算プール・全開催の精算履歴を表示。第1回を含む公開済み開催は migration で遡及精算する。PC・モバイルともページ全体を固定し、枠内スクロールを自動テストで確認 — [odds.md](specifications/odds.md)

- 分析ログを実装クローズ（投票復旧・Undoとのログ連動を含め実機確認OK）。投票開始・投票・やり直し・取消・5分ごと・締切で板を保存し、管理の「分析ログ」からCSV一式（snapshots / odds / horses）をZIP出力。`formula_version=odds-v2` / `schema_version=analysis-log-v1` を保存し、ログ保存失敗は投票を妨げず管理画面へ件数を表示する — [analysis-log.md](specifications/analysis-log.md)

- パドックのスマホ表示を画面高へ適応（最大18頭を横幅維持で収める）。詳細カードは閉じた状態からタップ／上スワイプで開き、開いた状態から下スワイプで閉じる。実機確認OK — [playbook.md](operations/playbook.md)

- テスト追従をクローズ（ウマ柱・号外の PNG / WebP 書き出し、号外の保存・画像編集・本文編集、OCR 配列 JSON、モバイルのウマ柱表示。型検査・Node 179件・Worker 99件・E2E 8件、計286件成功）— [testing.md](operations/testing.md)
- 号外タブを実装クローズ（プレビュー・編集・PNG/WebP、右列画像のモーダル選択、メインビュー画像の切り抜き、未登録アイコン。実機確認OK）— [gougai.md](features/gougai.md)
- ウマ柱 PNG で左列「印／オッズ」の「オッズ」だけ字折れするのを修正（`.stub-split` に nowrap。実機確認OK）— [umabashira.md](features/umabashira.md)
- 号外の管理タブを追加（左プレビュー・右編集。誌名・縦書き・右列画像・本文。PNG/WebP。1着未入力はプレースホルダ。chara_stand はローカル stand/）— [gougai.md](features/gougai.md)
- ウマ柱第1段をクローズ（ローカル実機確認OK。プレビュー・PNG/WebP。枠色は見た目専用。ノイズは不透明度 0.1。評価点・SP点数の色箱は PNG を正）— [umabashira.md](features/umabashira.md)
- ウマ柱 PNG の開催名折り返し・右列の狭まり・外枠切れを修正（実機確認OK。ウマ番・脚質の字下げは 0.06em）— [umabashira.md](features/umabashira.md)
- ウマ柱を出走登録中（setup）でも参考オッズを出す（実機確認OK。現在の紙面を正とする）— [umabashira.md](features/umabashira.md)
- ローカル進行タブの Undo 復旧列を `npm run dev` の vars で再表示（実機確認OK。`secrets.required` が `.dev.vars` のフラグを落としていた）
- OCRが配列JSONを返したときの空確認画面を修正（実機確認OK。登録時の `r2_pending_deletions` 未適用はローカル migration で解消）— [ocr.md](specifications/ocr.md)
- ウマ柱タブを一旦の正とした（実機確認OK。見た目の正は本番 `/admin/umabashira`。モック上段は控え）— [umabashira.md](features/umabashira.md)
- ウマ柱の管理タブ（モック上段移植・差し込み・プレビュー・PNG/WebP。ナビは開催設定の下）— [umabashira.md](features/umabashira.md)
- ウマ柱実装前の未決を閉じた（左列残す・PNG+WebP・タブ「ウマ柱」`/admin/umabashira`）— [umabashira.md](features/umabashira.md)
- ウマ柱の見た目をモック上段で正とする（案B寄せ。案A列頭印は見送り）— [umabashira.md](features/umabashira.md)
- ウマ柱のスキルは名前を出さずスキルパワー（有効・金の枚数）。レイアウト仮決めとモック2案 — [umabashira.md](features/umabashira.md)・[モック](mocks/umabashira/index.html)
- ウマ柱の掲載方針（コミュニティ公開画像。評価点と印を出す。投票機能はファンツールに出さない）— [umabashira.md](features/umabashira.md)
- P1-08 管理操作の誤操作防止と開始条件を強化（開始前確認モーダル、サーバー側の開始条件、スタミナ勝負の明示選択、メンバー利用停止の再認証。実機確認OK）— [playbook.md](operations/playbook.md)
- 出走登録タブにウマ番編集を追加（ヒーロー右の一括編集モーダル。1〜出走頭数の重複なしで保存。枠番は扱わない）
- パドックページを追加（脚質別の出走表示・詳細カード・育成スクリーンショット・投票候補の窓口引き継ぎ。窓口の金額操作は `+100 / +500 / +1,000 / 全額を入力 / リセット`、不足項目の案内、スマホ向け44pxタップ領域へ更新。ユーザー実機確認OK）— [playbook.md](operations/playbook.md)
- 出走登録の育成ウマ娘・衣装ID保存、`0010` デフォルメ画像の安全な共通解決、DMM版 `master.mdb` 由来の衣装カタログ／総合スキル辞書更新 — [ocr.md](specifications/ocr.md)
- 相対評価点: U-toolsコース別キャラスペック（固有・進化スキルの有効バ身数、中央値R、倍率）を取得・評価点へ反映。開催設定・出走内訳・再計算一覧を表示。実機確認OK — [score.md](specifications/score.md)
- 型チェックの整備: `npx tsc --noEmit` が通るよう、TypeScript 設定・既存の重複 import・テスト用 Node 型を整理（`npm test` 109件も成功）
- 脚質毎のスタミナ目標値入力機能（実機確認OK・クローズ）
- 相対評価点: スキル点の重み `n` を試算・決定し、開催設定から調整できるようにする — [score.md](specifications/score.md)
- 再計算確認モーダルの初期フォーカスを見出しへ移動し、管理画面のキーボード用フォーカス表示を統一
- 出走の再計算確認を通常モーダルへ統一（背景暗転・外側クリック・Escape時の復帰を他の管理モーダルと揃える）
- 管理画面の通常モーダルを共通化（中央配置・寸法・背景・下部操作を統一。スクショ全画面とメンバー画面は対象外）
- 管理画面の非進行タブのヒーローと操作ボタンを共通化（出走登録・出走・台帳・オッズ・開催設定。進行タブは対象外）
- 既存 CSS を整理しデザイントークン化（管理画面とメンバー画面の色を共通変数へ集約。本番CSSのみ、モックは対象外）
- OCR / 評価点 UI 調整クローズ（読取確認5段・OCR読取時の直置き pill・自動算出ラベル・編集画面 pill 統一・出走登録タブ細部）— [ocr.md](specifications/ocr.md)・[score.md](specifications/score.md)
- OCR: 戦略例外スキル（D1 正本・グローバル見送り・読取確認5段・ヒーローユーティリティ帯・モーダル管理・JSON export・S0 加算・U-tools 二重除外）— [score.md](specifications/score.md)
- OCR: カタログ同名 multiple・ファジー遺産寄せ（継承／継承進化 id）・千錬＋編集距離≤1。skillBase はリスト外 inherit を数えない — [ocr.md](specifications/ocr.md)
- store 分割: Types / Read / Board / Members / Horses / Event / Race + `store.ts` barrel。公開 API 不変。`storeFlow` 79 パス — パス2クローズ
- store 結合テスト: メモリ SQLite（D1 互換）で投票→締切→着順→公開・やりなおし・残高不変。`npm test` に `storeFlow` — 分割前の安全網
- 整理パス2: setup 電光化・メンバーCSS共通化・旧 layout 退役・`memberRoutes` で index 分割（ユーザー実機 OK〜分割実装）
- 整理パス1（安全な整理）: `ui.ts` 死コード削除・メンバー⋯スクリプト共通化。`npm test` 75 パス — レビュー報告はチャット
- 入場をゲートモックで差し替え（1枚2ボタン・⋯にログアウトなし。ユーザー実機 OK）。メンバー画面の見た目差し替えクローズ — [gate](mocks/gate/index.html)
- 窓口をマークカードで差し替え（quiet トーン・入れ子 form 修正含む。ユーザー実機 OK）— [quiet.html](mocks/bet-window/quiet.html)
- 場内 published を電光モックで差し替え（払戻盤＋確定盤→全頭。着差なし。ユーザー実機 OK）— [layout-venue.html](mocks/venue-board/layout-venue.html)
- 場内 closed を電光モックで差し替え（確定配当・買うなし・着なし・成立／特払い予定。ユーザー実機 OK）— [layout-venue.html](mocks/venue-board/layout-venue.html)
- 場内 voting を電光モックで差し替え（LED・背景3種・⋯・ライブ5秒。ユーザー実機 OK。締切・公開は別）— [layout-venue.html](mocks/venue-board/layout-venue.html)
- 管理6タブ見た目差し替えを閉じる（開催設定〜進行・登録・出走・台帳・オッズ。ユーザー実機 OK。開催設定の見出しは本番「イベント概要／レギュレーション」が正。票入り台帳絞り込みとメンバー画面は別）— [admin-dash](mocks/admin-dash/index.html)
- 出走内訳は S 倍率を先に出し算出式を後ろへ（小数第3位・一行式ラベル付き）— [horses.html](mocks/admin-dash/horses.html)
- 進行タブ全フェーズ実機（投票開始〜強制締切〜着順保存〜公開。開閉レール確認。公開後着順は読み専用に修正。票なしのため台帳絞り込みは未）— [progress-places.html](mocks/admin-dash/progress-places.html)
- 出走登録タブ一旦完了（面寄せ・ドロップ／読取案内・チップ・不採用保存・seed_source 自動／直置き・名簿から外す。OCR 精度改善は後）— [register.html](mocks/admin-dash/register.html)
- 出走タブ：緑→ステへのスキル対応表示と評価点直上の一行式 — [horses.html](mocks/admin-dash/horses.html)
- 出走登録の作業台をモックに寄せる（選ぶ／読取チップ／直置きの面切替。#ocr-out 廃止。掛かりスタミナ2欄は出さない）— [register.html](mocks/admin-dash/register.html)
- 出走タブ実機（行選択でパイプ切替、直置き内訳、スクショサムネ→全面、取消モーダルはやめるまで。取消 POST は未実行）— [horses.html](mocks/admin-dash/horses.html)
- 出走登録タブをモック HTML の箱で差し替え（左名簿・右作業台。キーはヒーロー右・password にしない。#ocr-file はスクロール外。チップ作業台は後回し）— [register.html](mocks/admin-dash/register.html)
- 進行タブをモック HTML の箱で差し替え（説明注なし。フェーズ比較バーは出さない。着順案3・開閉レールは残す）— [progress-places.html](mocks/admin-dash/progress-places.html)
- 出走タブをモック HTML の箱で差し替え（名簿＋内訳。注釈なし。取消・スクショは残す）— [horses.html](mocks/admin-dash/horses.html)
- 台帳タブをモック HTML の箱で差し替え（枠内スクロール。額フィルタはすべて／500以上／3000以上。ヒーロー注なし）— [ledger.html](mocks/admin-dash/ledger.html)
- オッズタブをモック HTML の箱で差し替え（5賭式同時・使わない賭式は空パネル。ヒーロー注なし。内部計算モーダルは残す）— [odds.html](mocks/admin-dash/odds.html)
- 開催設定タブをモック HTML の箱で差し替え（既存 name/POST。フェーズ切替バーは出さない。D は 0〜0.99）— [settings.html](mocks/admin-dash/settings.html)
- 管理6タブを本番に載せた（進行・出走登録・出走・台帳・オッズ・開催設定。着順案3・開閉レール・スクショGET・評価点表記。脚質別スタミナ目標値8項目を実装。メンバー画面は未着手。実機確認済み）— [admin-dash](mocks/admin-dash/index.html)
- 管理画面の Strength 表記を出走・出走登録で評価点に揃えた（式の記号は内部計算モーダル）
- 管理刷新モック6タブ採用（進行・出走登録・出走・台帳・オッズ・開催設定。本番未適用）— [admin-dash](mocks/admin-dash/index.html)
- 管理の出走登録タブ採用（左・名簿、右・1頭の作業台。OCRまたは直置き。掛かりスタミナ2欄。スクショは左寄せ全画面。適性はバ場／距離／脚質。一括なし。本番未適用）— [register.html](mocks/admin-dash/register.html)
- 管理の開催設定タブ採用（上から今日のレース→評価点の条件→参考数字。賭式はボタン。本番の入力グリッドは不採用。本番未適用）— [settings.html](mocks/admin-dash/settings.html)
- 管理のオッズタブ採用（5賭式同時。左・単勝全頭、右・連勝2×2は実票のみ。参考／確定。枠内スクロール。賭式切替は不採用。本番未適用）— [odds.html](mocks/admin-dash/odds.html)
- 出走タブのスクショは元画像をCSSで上端だけ見せる（別切り抜きファイルなし。見出し右に小さく。モーダルは薄暗い）— [horses.html](mocks/admin-dash/horses.html)
- 管理の台帳タブ採用（左・残高／右・全投票。枠内スクロール。絞り込みは賭式・結果・誰・額。本番未適用）— [ledger.html](mocks/admin-dash/ledger.html)
- 管理の出走タブ採用（評価点名簿＋行の掛け算内訳。脚質は逃げ・先行・差し・追込。Strengthなし。OCR編集は出さない。本番未適用）— [horses.html](mocks/admin-dash/horses.html)
- 管理進行ホームの下段をフェーズで変える（votingは単勝参考＋直近票。着順は案3のまま。本番未適用）— [progress-places.html](mocks/admin-dash/progress-places.html)
- 管理進行の着順は案3採用（左・未着順1列、右は上から折る2列。案2スロットは不採用。他タブ未稿。本番未適用）— [progress-places.html](mocks/admin-dash/progress-places.html)
- 場内・窓口モックに入場と同じ ⋯（枠内右上。PCは枠外右下に使い方／管理者。スマホは⋯だけ。使い方に特払い段落。入場はログアウトなし。本番未適用）— [layout-venue.html](mocks/venue-board/layout-venue.html)・[quiet.html](mocks/bet-window/quiet.html)・[gate](mocks/gate/index.html)
- 場内デザイン採用（投票中〜締切〜結果公開。払戻＋縦長確定→全頭。着差なし。本番未適用）— [layout-venue.html](mocks/venue-board/layout-venue.html)
- 場内結果公開：払戻＋確定の横並び盤→全頭表（モック。本番未適用）— [layout-venue.html](mocks/venue-board/layout-venue.html)
- 場内の締切後・結果公開を盤の続きとして仮置き（着は公開まで出さない。買うは投票中だけ）— [layout-venue.html](mocks/venue-board/layout-venue.html)
- 入場デザイン仮置き・採用（静かな窓口トーン。⋯は枠内、PCは右下にも使い方／管理者。ログアウトなし）— [gate](mocks/gate/index.html)
- 窓口デザイン仮置き（案A・マークカード・所持スペ帯・買うは下固定。ナビ名は窓口、見出しは発売所。⋯は場内・入場と揃える）— [quiet.html](mocks/bet-window/quiet.html)
- 場内デザイン仮置き（アプリシェル＋場の背景イラスト＋LED電光。列は Grid。脚質列あり。本番未適用）— [layout-venue.html](mocks/venue-board/layout-venue.html)
- OCR 受け入れ画像に WebP を追加（PNG / JPEG と共通の MIME 正規化・実機確認済み）— [ocr.md](specifications/ocr.md)
- OCR・評価点まわり実装クローズ（細かい修正は後）。開催 `score_setup`・出走 `score_input`・ファジー ID 化・脚質 UI・`computeScore`→Strength→Seed・直置き逃げ・実機確認済み — [score.md](specifications/score.md)・[ocr.md](specifications/ocr.md)
- 出走のステ・スキル id・適性・脚質を `computeScore` に渡し、管理画面の評価点へ（直置き併用）。OCR 脚質 UI（S1つ初期選択）とファジー ID 化も含む — [score.md](specifications/score.md)・[ocr.md](specifications/ocr.md)
- U-tools 有効スキル id を開催保存時にスナップショット（コース×4脚質、ranked 全件、照合は id）— [score.md](specifications/score.md)
- OCR（本戦のみ）クローズ — 1頭ずつ読取・名前流し・読取画像の R2 保存。一括枠なし。細かい調整と表示 UI は後 — [ocr.md](specifications/ocr.md)


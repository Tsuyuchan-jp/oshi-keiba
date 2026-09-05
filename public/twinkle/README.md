# 月刊トゥインクル紙面パック（個人利用・非公開）

このフォルダは別リポジトリの再現アプリへ **フォルダごとコピー** するための構成要素です。

**著作権は株式会社Cygamesに帰属します。** 再配布・公開サイトへの掲載・ストア公開はしないでください。調査・個人アプリ開発の手元素材専用です。詳細は同梱の `NOTICE.txt`。

PNG は git に入れていません。別リポへ渡すときは、このフォルダをエクスプローラーで **フォルダごとコピー** してください（画像も含まれます）。git clone だけでは画像は来ません。再抽出は調査リポで `python scripts/export_twinkle_magazine.py`。

## フォルダ

```
twinkle-magazine/
  README.md                 … この説明
  NOTICE.txt                … 著作権
  layout.json               … 増刊号／号外の組み立て方
  manifest.json             … 抽出した画像の一覧とサイズ
  frames/                   … 紙面背景
    gogai_bg.png            … 号外（配信用に再エンコードした `gogai_cover_bg_v2.png` も使用）
    zokan_page1_heading.png … 増刊1面の舞台絵（アーチ）
    zokan_page1_bg.png      … 増刊1面ぼかし
    zokan_page2_bg.png      … 増刊2面
    zokan_page3_bg.png      … 増刊3面
  titles/                   … 焼き込み縦書き大見出し（ファイル名 = ID 3桁）
  subtitles/                … 焼き込み縦書きサブ（同様）
  chrome/                   … ニュースボタン等の小物
  texts/                    … 文言 CSV（UTF-8 BOM、Excel可）
  data/                     … 選択ロジック用 JSON（champions_news_*）
```

メインの3D写真・全キャラアイコン・緑帯マストヘッド完成PNGは入れていません。`layout.json` の `not_included` を見てください。

## アプリ側での使い方（最短）

1. `frames/gogai_bg.png` をキャンバス背景にする。
2. `data/champions_news_win_title.json` から round・着差で1行選び、`sub_title` を取る。
3. `titles/{id}.png` / `subtitles/{id}.png` があれば画像として右に重ねる。無ければ `texts/229_overlay_vertical.csv` の同 ID を縦書きテキストで描く。
4. `texts/230_headline_body.csv` を条件キーで選び、`<character_name>` `<username>` `<bashin>` を置換する。
5. `texts/gogai_interview.csv` を `chara_id` + `round_id` で引く。
6. 中央だけ呼び出し元アプリの3D／スクショを合成する。

増刊号は `zokan_page*_bg.png` ＋ `texts/zokan_interview.csv` ＋ `data/champions_news_title.json`。

`round_id` の意味は `layout.json` を参照。

## 再抽出

ゲーム更新後は、調査リポで次を実行するとこのフォルダを上書きします。

```
python scripts/export_twinkle_magazine.py
```

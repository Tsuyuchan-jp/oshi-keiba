# アプリ版（人間確認用）

画面に出る版は `package.json` の `version` を `v` 付きで表示する（例: `0.3.0` → **v0.3.0**）。
コード側の読み出しは `src/lib/version.ts`。変更内容の履歴と SemVer の運用は [changelog.md](changelog.md) を正とする。

表示位置:

- メンバー（入場・場内・窓口）: PC 右下「管理者」の直上
- 管理: サイドバー「OSHI KEIBA · 管理」の横

SemVer（0.x）。git タグは任意。本番デプロイ手順そのものは [release.md](release.md) を正とする。OCR 固有の補足は [ocr.md](ocr.md) を参照する。

## 上げ方（チェック）

1. [changelog.md](changelog.md) の `Unreleased` を対象バージョンへ確定し、日付と変更内容を記す
2. `package.json` と `package-lock.json` の `version` を同じ数字にする
3. ローカルでメンバー右下と管理タイトル横の表示を目視
4. 本番に出すときは [release.md](release.md) の手順を通す（R2 → D1 `--remote` → `npm run deploy` を含む）

未デプロイの版は、[changelog.md](changelog.md) の見出しに「未デプロイ」と添え、本番反映後に外してよい。

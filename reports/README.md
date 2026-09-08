# reports

イベント日ごとのフォルダに、人間用 HTML と AI 参照用 Markdown を置く。現行の式・オペは [docs/](../docs/)（[odds.md](../docs/specifications/odds.md) / [playbook.md](../docs/operations/playbook.md)）。ここは日付付きの証拠。

```
reports/
  YYYY-MM-DD/
    trial-odds-report.md              # 第1回再生の知見（エージェント参照の正）
    trial-odds-replay.html            # 同上・閲覧用
    trial-odds-proposal-1.md          # 第2回向け改善案1（設定比較）
    trial-odds-proposal-1.html        # 同上・閲覧用
    trial-odds-proposal-2.md          # 第2回向け仮値5案（Imputed を TV に入れる）
    trial-odds-proposal-2.html        # 同上・閲覧用
```

日付はレース／投票日（JST）。試運転（メンバーシップエクストラLoH）は [2026-08-23/](2026-08-23/)。

分析ログを使う開催では、管理から出したCSV一式と、AIが生成した分析用 Markdown / HTML も同じ日付フォルダへ置く。分析の前提・CSV契約は [analysis-log.md](../docs/specifications/analysis-log.md) を正とする。

HTML の再生成:

- 第1回再生: `node --experimental-strip-types scripts/trial-odds-report.ts`
- 改善案1の比較: `node --experimental-strip-types scripts/trial-odds-proposal-1.ts`
- 第2回仮値5案: `node --experimental-strip-types scripts/trial-odds-proposal-2.ts`

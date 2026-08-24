# reports

イベント日ごとのフォルダに、人間用 HTML と AI 参照用 Markdown を置く。現行の式・オペは [docs/](../docs/)（[odds.md](../docs/odds.md) / [playbook.md](../docs/playbook.md)）。ここは日付付きの証拠。

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

HTML の再生成:

- 第1回再生: `node --experimental-strip-types scripts/trial-odds-report.ts`
- 改善案1の比較: `node --experimental-strip-types scripts/trial-odds-proposal-1.ts`
- 第2回仮値5案: `node --experimental-strip-types scripts/trial-odds-proposal-2.ts`

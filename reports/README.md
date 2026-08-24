# reports

イベント日ごとのフォルダに、人間用 HTML と AI 参照用 Markdown を置く。

```
reports/
  YYYY-MM-DD/
    trial-odds-report.md    # 知見・数字（エージェント・ドキュメント参照の正）
    trial-odds-replay.html  # 同じ内容の閲覧用
```

日付はレース／投票日（JST）。試運転（メンバーシップエクストラLoH）は [2026-08-23/](2026-08-23/)。

HTML の再生成: `node --experimental-strip-types scripts/trial-odds-report.ts`（出力先はスクリプト内の日付フォルダ）。

/** 窓口マークカードの枠定義。ui / store に依存しない（テストから直接読む） */
import type { BetKind } from "./bets.ts";

export type BetSlotSpec = {
  labels: string[];
  ordered: boolean;
  hint: string;
};

export function betKindSlots(kind: BetKind): BetSlotSpec {
  switch (kind) {
    case "win":
      return {
        labels: ["1着"],
        ordered: true,
        hint: "番号を1つタップ。もう一度で解除。",
      };
    case "umaren":
      return {
        labels: ["1頭", "2頭"],
        ordered: false,
        hint: "異なる番号を2つ。順不同。枠をタップで消す。",
      };
    case "umatan":
      return {
        labels: ["1着", "2着"],
        ordered: true,
        hint: "1着→2着の順にタップ。枠をタップで消す。",
      };
    case "sanrenpuku":
      return {
        labels: ["1頭", "2頭", "3頭"],
        ordered: false,
        hint: "異なる番号を3つ。順不同。",
      };
    case "sanrentan":
      return {
        labels: ["1着", "2着", "3着"],
        ordered: true,
        hint: "1着→2着→3着の順にタップ。",
      };
  }
}

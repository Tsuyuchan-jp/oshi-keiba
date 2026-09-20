const horses = [
  [1, "ジェンティルドンナ", "つゆちゃん", "8.8"], [2, "メジロパーマー", "Neko長明", "13.1"],
  [3, "シュヴァルグラン", "Neko長明", "7.9"], [4, "ナリタトップロード", "Raiko", "15.6"],
  [5, "オグリキャップ", "GEDO", "22.5"], [6, "ウインバリアシオン", "アイビー", "9.5"],
  [7, "セイウンスカイ", "dai", "13.2"], [8, "ステイゴールド", "アイビー", "7.8"],
  [9, "ナリタブライアン", "satie", "9.1"], [10, "マヤノトップガン", "GEDO", "7.6"],
  [11, "オルフェーヴル", "Raiko", "10.0"], [12, "キタサンブラック", "GEDO", "11.6"],
  [13, "ビワハヤヒデ", "b-men", "9.0"], [14, "マンハッタンカフェ", "Raiko", "9999.9+"],
  [15, "ゼンノロブロイ", "陸カヤック", "51.7"], [16, "メジロマックイーン", "うどん", "13.3"],
  [17, "エピファネイア", "Neko長明", "8.5"], [18, "トウカイテイオー", "ゲスト", "18.0"],
];
const markets = {
  umaren: [["8-10", "22.4", true], ["3-10", "25.1", true], ["10-17", "28.7", false], ["8-13", "31.4", false], ["3-8", "34.8", true], ["9-10", "38.2", false], ["6-10", "41.6", false], ["3-17", "46.0", false]],
  umatan: [["10→8", "48.7", true], ["8→10", "51.2", false], ["10→3", "53.8", true], ["3→10", "57.4", false], ["10→17", "61.9", false], ["8→3", "65.3", false], ["3→8", "68.5", false], ["13→10", "72.1", false]],
  sanrenpuku: [["3-8-10", "97.3", true], ["8-10-17", "108.6", false], ["3-10-17", "116.2", false], ["8-10-13", "126.4", false], ["3-8-10", "134.9", false], ["3-9-10", "142.1", false], ["6-8-10", "154.7", false], ["10-13-17", "169.8", false]],
  sanrentan: [["10→8→3", "400.1", true], ["10→3→8", "401.8", false], ["8→10→3", "403.1", false], ["3→10→8", "406.4", false], ["8→3→10", "408.4", false], ["3→8→10", "410.2", false], ["10→8→17", "447.8", false], ["10→17→8", "463.7", false]],
};
function sheet(list) {
  const rows = list.map(([n, name, runner, odds]) => `<div class="sheet-row"><span class="num">${n}</span><span class="horse">${name}</span><span class="runner">${runner}</span><span class="odds">${odds}</span></div>`).join("");
  return `<section class="sheet"><div class="sheet-row head"><span>#</span><span>ウマ娘</span><span>トレーナー</span><span class="odds">オッズ</span></div>${rows}</section>`;
}
function market(kind, title, realOnly = false) {
  const rows = markets[kind].map(([selection, odds, real], i) => `<div class="market-row"><span class="selection">${selection}${real ? '<small class="tag real">実票</small>' : i < 4 ? '<small class="tag">人気</small>' : ''}</span><span class="odds">${realOnly && !real ? "—" : odds}</span></div>`).join("");
  return `<section class="market"><div class="market-head"><b>${title}</b><span>${realOnly ? "実票あり" : "人気上位 8組"}</span></div><div class="market-list">${rows}</div></section>`;
}
function render() {
  const win = document.querySelector("#win");
  if (win) win.innerHTML = sheet(horses.slice(0, 9)) + sheet(horses.slice(9));
  for (const el of document.querySelectorAll("[data-market]")) {
    const [left, right] = el.dataset.market.split(",");
    el.innerHTML = market(left, el.dataset.leftTitle) + market(right, el.dataset.rightTitle, el.dataset.realOnly === "true");
  }
  const tabs = [...document.querySelectorAll("[role=tab]")];
  for (const tab of tabs) tab.addEventListener("click", () => {
    const target = tab.dataset.target;
    for (const t of tabs) t.setAttribute("aria-selected", String(t === tab));
    for (const view of document.querySelectorAll(".view")) view.classList.toggle("on", view.id === target);
  });
}
render();

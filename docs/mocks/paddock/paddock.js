const runners = [
  { n: 1, name: "スペシャルウィーク", trainer: "トレーナーI", style: "leader", label: "先行", odds: "4.8倍", skill: 32, note: "有効 22　金相当 4　戦略 +2", image: "petit_1001_100101_0010.png", comment: "終盤加速を意識して組みました！", apt: "芝A　中距離S　先行A", stats:[1200,950,1100,850,1000] },
  { n: 2, name: "サイレンススズカ", trainer: "トレーナーM", style: "runner", label: "逃げ", odds: "3.6倍", skill: 31, note: "有効 21　金相当 4　戦略 +2", image: "petit_1002_100201_0010.png", comment: "大逃げで自分の形を作ります。", apt: "芝A　中距離A　逃げS", stats:[1180,1000,1060,780,1120] },
  { n: 3, name: "トウカイテイオー", trainer: "トレーナーJ", style: "leader", label: "先行", odds: "5.2倍", skill: 30, note: "有効 20　金相当 4　戦略 +2", image: "petit_1003_100301_0010.png", comment: "がんばります！", apt: "芝A　中距離A　先行A", stats:[1190,920,1080,880,1050] },
  { n: 4, name: "マルゼンスキー", trainer: "トレーナーA", style: "runner", label: "逃げ", odds: "8.1倍", skill: 26, note: "有効 18　金相当 3　戦略 +2", image: "petit_1004_100401_0010.png", comment: "先手を取って粘り込みます。", apt: "芝A　中距離A　逃げA", stats:[1160,900,1050,820,980] },
  { n: 5, name: "フジキセキ", trainer: "トレーナーN", style: "betweener", label: "差し", odds: "12.5倍", skill: 27, note: "有効 19　金相当 3　戦略 +2", image: "petit_1005_100501_0010.png", comment: "展開が向けば一発を狙います。", apt: "芝A　中距離A　差しA", stats:[1110,960,1040,840,1020] },
  { n: 6, name: "オグリキャップ", trainer: "トレーナーB", style: "leader", label: "先行", odds: "6.4倍", skill: 34, note: "有効 24　金相当 4　戦略 +2", image: "petit_1006_100601_0010.png", comment: "勝ちに行きます。", apt: "芝A　中距離S　先行A", stats:[1210,1080,1100,900,970] },
  { n: 7, name: "ゴールドシップ", trainer: "トレーナーO", style: "chaser", label: "追込", odds: "9.4倍", skill: 29, note: "有効 19　金相当 4　戦略 +2", image: "petit_1007_100701_0010.png", comment: "最後方から全部差します。", apt: "芝A　長距離A　追込S", stats:[1170,1040,1080,910,930] },
  { n: 8, name: "ウオッカ", trainer: "トレーナーF", style: "betweener", label: "差し", odds: "11.2倍", skill: 28, note: "有効 20　金相当 3　戦略 +2", image: "petit_1008_100801_0010.png", comment: "直線勝負で行きます。", apt: "芝A　中距離A　差しA", stats:[1140,920,1090,860,1030] },
  { n: 9, name: "ダイワスカーレット", trainer: "トレーナーK", style: "leader", label: "先行", odds: "4.3倍", skill: 33, note: "有効 23　金相当 4　戦略 +2", image: "petit_1009_100901_0010.png", comment: "前でしぶとく踏ん張ります。", apt: "芝A　中距離S　先行S", stats:[1200,980,1090,900,1080] },
  { n:10, name: "タイキシャトル", trainer: "トレーナーP", style: "runner", label: "逃げ", odds: "18.0倍", skill: 24, note: "有効 17　金相当 3　戦略 +1", image: "petit_1010_101001_0010.png", comment: "マイル以外も挑戦です！", apt: "芝A　中距離B　逃げA", stats:[1100,860,1030,790,1010] },
  { n:11, name: "グラスワンダー", trainer: "トレーナーG", style: "betweener", label: "差し", odds: "14.3倍", skill: 27, note: "有効 19　金相当 3　戦略 +2", image: "petit_1011_101101_0010.png", comment: "静かに勝機を待ちます。", apt: "芝A　中距離A　差しA", stats:[1130,970,1060,880,990] },
  { n:12, name: "ヒシアマゾン", trainer: "トレーナーC", style: "chaser", label: "追込", odds: "16.1倍", skill: 25, note: "有効 17　金相当 3　戦略 +2", image: "petit_1012_101201_0010.png", comment: "届く位置から差し切りたいです。", apt: "芝A　中距離A　追込A", stats:[1120,950,1070,870,940] },
  { n:13, name: "メジロマックイーン", trainer: "トレーナーL", style: "leader", label: "先行", odds: "7.3倍", skill: 32, note: "有効 22　金相当 4　戦略 +2", image: "petit_1013_101301_0010.png", comment: "持久力を活かしますわ。", apt: "芝A　長距離S　先行A", stats:[1160,1150,1030,900,1000] },
  { n:14, name: "エルコンドルパサー", trainer: "トレーナーD", style: "leader", label: "先行", odds: "8.8倍", skill: 30, note: "有効 21　金相当 3　戦略 +3", image: "petit_1014_101401_0010.png", comment: "先行から押し切ります！", apt: "芝A　中距離A　先行A", stats:[1170,980,1110,860,980] },
  { n:15, name: "テイエムオペラオー", trainer: "トレーナーH", style: "leader", label: "先行", odds: "10.2倍", skill: 29, note: "有効 20　金相当 4　戦略 +1", image: "petit_1015_101501_0010.png", comment: "覇王の走りをお見せします。", apt: "芝A　中距離A　先行A", stats:[1150,1020,1060,900,1010] },
  { n:16, name: "ナリタブライアン", trainer: "トレーナーQ", style: "leader", label: "先行", odds: "13.4倍", skill: 28, note: "有効 19　金相当 3　戦略 +2", image: "petit_1016_101601_0010.png", comment: "真っ向勝負だ。", apt: "芝A　中距離A　先行A", stats:[1150,980,1120,870,920] },
  { n:17, name: "シンボリルドルフ", trainer: "トレーナーR", style: "leader", label: "先行", odds: "15.8倍", skill: 27, note: "有効 19　金相当 3　戦略 +2", image: "petit_1017_101701_0010.png", comment: "皇帝の走りを披露しよう。", apt: "芝A　中距離A　先行A", stats:[1140,970,1080,850,1030] },
  { n:18, name: "エアグルーヴ", trainer: "トレーナーS", style: "runner", label: "逃げ", odds: "20.1倍", skill: 23, note: "有効 16　金相当 3　戦略 +1", image: "petit_1018_101801_0010.png", comment: "自分のリズムで運びます。", apt: "芝A　中距離A　逃げA", stats:[1100,900,1050,860,1000] },
];

const fade = new URLSearchParams(location.search).get("fade");
if (fade === "standard" || fade === "slow") document.body.classList.add(`entry-${fade}`);

const imageUrl = (image) => `../../../public/images/umamusume/petit/${image}`;
const stats = ["スピード", "スタミナ", "パワー", "根性", "賢さ"];
const detail = (runner) => {
  document.querySelector("#detail-image").src = imageUrl(runner.image);
  document.querySelector("#detail-image").alt = runner.name;
  document.querySelector("#detail-style").textContent = runner.label;
  document.querySelector("#detail-number").textContent = `${runner.n}番`;
  document.querySelector("#detail-name").textContent = runner.name;
  document.querySelector("#detail-odds").textContent = runner.odds;
  document.querySelector("#detail-trainer").textContent = runner.trainer;
  document.querySelector("#detail-comment").textContent = `「${runner.comment}」`;
  document.querySelector("#detail-skill").textContent = runner.skill;
  document.querySelector("#detail-skill-note").textContent = runner.note;
  document.querySelector("#detail-aptitude").textContent = `適性　${runner.apt}`;
  document.querySelector("#detail-stats").innerHTML = runner.stats.map((value, index) => `<div class="stat"><span>${stats[index]}</span><span class="bar"><i style="width:${Math.min(value / 12.5, 100)}%"></i></span><b>${value}</b></div>`).join("");
  document.querySelectorAll(".runner-card").forEach((card) => card.classList.toggle("selected", Number(card.dataset.number) === runner.n));
  document.querySelector(".detail").classList.add("open");
};

for (const runner of runners) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "runner-card";
  card.dataset.number = runner.n;
  card.innerHTML = `<img src="${imageUrl(runner.image)}" alt=""><span class="runner-copy"><strong><i class="number">${runner.n}</i>${runner.name}</strong><small><i class="trainer-dot"></i>${runner.trainer}</small></span>`;
  card.addEventListener("click", () => detail(runner));
  document.querySelector(`[data-style="${runner.style}"]`).append(card);
}
document.querySelectorAll(".switch").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll(".switch").forEach((item) => item.classList.toggle("is-active", item === button));
  document.querySelector("#paddock-layout").classList.toggle("adaptive", button.dataset.layout === "adaptive");
}));
document.querySelector(".detail-close").addEventListener("click", () => document.querySelector(".detail").classList.remove("open"));
detail(runners[0]);

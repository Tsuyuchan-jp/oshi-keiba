const runners = [
  { n: 1, name: "スペシャルウィーク", trainer: "トレーナー I", style: "leader", label: "先行", odds: "4.8倍", skill: 32, note: "有効 22　金相当 4　戦略 +2", image: "petit_1001_100101_0010.png", comment: "持てる力を発揮して走ります！", apt: "芝 S　中距離 S　先行 A", stats: [1200, 950, 1100, 850, 1000] },
  { n: 2, name: "サイレンススズカ", trainer: "トレーナー M", style: "runner", label: "逃げ", odds: "3.6倍", skill: 31, note: "有効 21　金相当 4　戦略 +2", image: "petit_1002_100201_0010.png", comment: "大逃げで自分の形を作ります。", apt: "芝 A　中距離 A　逃げ S", stats: [1180, 1000, 1060, 780, 1120] },
  { n: 3, name: "トウカイテイオー", trainer: "トレーナー J", style: "leader", label: "先行", odds: "5.2倍", skill: 30, note: "有効 20　金相当 4　戦略 +2", image: "petit_1003_100301_0010.png", comment: "がんばります！", apt: "芝 A　中距離 A　先行 A", stats: [1190, 920, 1080, 880, 1050] },
  { n: 4, name: "マルゼンスキー", trainer: "トレーナー A", style: "runner", label: "逃げ", odds: "8.1倍", skill: 26, note: "有効 18　金相当 3　戦略 +2", image: "petit_1004_100401_0010.png", comment: "最高の走りを見せちゃうわ！", apt: "芝 A　中距離 A　逃げ A", stats: [1160, 900, 1050, 820, 980] },
  { n: 5, name: "フジキセキ", trainer: "トレーナー N", style: "betweener", label: "差し", odds: "12.5倍", skill: 27, note: "有効 19　金相当 3　戦略 +2", image: "petit_1005_100501_0010.png", comment: "終盤の一発を狙います。", apt: "芝 A　中距離 A　差し A", stats: [1110, 960, 1040, 840, 1020] },
  { n: 6, name: "オグリキャップ", trainer: "トレーナー B", style: "leader", label: "先行", odds: "6.4倍", skill: 34, note: "有効 24　金相当 4　戦略 +2", image: "petit_1006_100601_0010.png", comment: "先頭に食らいつきます。", apt: "芝 S　中距離 S　先行 A", stats: [1210, 1080, 1100, 900, 970] },
  { n: 7, name: "ゴールドシップ", trainer: "トレーナー O", style: "chaser", label: "追込", odds: "9.4倍", skill: 29, note: "有効 19　金相当 4　戦略 +2", image: "petit_1007_100701_0010.png", comment: "最後は全力で差し切ります。", apt: "芝 A　長距離 A　追込 S", stats: [1170, 1040, 1080, 910, 930] },
  { n: 8, name: "ウオッカ", trainer: "トレーナー F", style: "betweener", label: "差し", odds: "11.2倍", skill: 28, note: "有効 20　金相当 3　戦略 +2", image: "petit_1008_100801_0010.png", comment: "展開を読んで行きます。", apt: "芝 A　中距離 A　差し A", stats: [1140, 920, 1090, 860, 1030] },
  { n: 9, name: "ダイワスカーレット", trainer: "トレーナー K", style: "leader", label: "先行", odds: "4.3倍", skill: 33, note: "有効 23　金相当 4　戦略 +2", image: "petit_1009_100901_0010.png", comment: "先行でしっかり粘ります！", apt: "芝 S　中距離 S　先行 S", stats: [1200, 980, 1090, 900, 1080] },
  { n: 10, name: "タイキシャトル", trainer: "トレーナー P", style: "runner", label: "逃げ", odds: "18.0倍", skill: 24, note: "有効 17　金相当 3　戦略 +1", image: "petit_1010_101001_0010.png", comment: "マイル女王も挑戦です！", apt: "芝 B　中距離 B　逃げ A", stats: [1100, 860, 1030, 790, 1010] },
  { n: 11, name: "グラスワンダー", trainer: "トレーナー G", style: "betweener", label: "差し", odds: "14.3倍", skill: 27, note: "有効 19　金相当 3　戦略 +2", image: "petit_1011_101101_0010.png", comment: "静かに力を溜めています。", apt: "芝 A　中距離 A　差し A", stats: [1130, 970, 1060, 880, 990] },
  { n: 12, name: "ヒシアマゾン", trainer: "トレーナー C", style: "chaser", label: "追込", odds: "16.1倍", skill: 25, note: "有効 17　金相当 3　戦略 +2", image: "petit_1012_101201_0010.png", comment: "追い込みの末脚を見てください。", apt: "芝 A　中距離 A　追込 A", stats: [1120, 950, 1070, 870, 940] },
  { n: 13, name: "メジロマックイーン", trainer: "トレーナー L", style: "leader", label: "先行", odds: "7.3倍", skill: 32, note: "有効 22　金相当 4　戦略 +2", image: "petit_1013_101301_0010.png", comment: "穏やかな走りをお見せしますわ。", apt: "芝 S　長距離 S　先行 A", stats: [1160, 1150, 1030, 900, 1000] },
  { n: 14, name: "エルコンドルパサー", trainer: "トレーナー D", style: "leader", label: "先行", odds: "8.8倍", skill: 30, note: "有効 21　金相当 3　戦略 +3", image: "petit_1014_101401_0010.png", comment: "先行から突き抜けます！", apt: "芝 A　中距離 A　先行 A", stats: [1170, 980, 1110, 860, 980] },
  { n: 15, name: "テイエムオペラオー", trainer: "トレーナー H", style: "leader", label: "先行", odds: "10.2倍", skill: 29, note: "有効 20　金相当 4　戦略 +1", image: "petit_1015_101501_0010.png", comment: "観衆の熱を受け止めます。", apt: "芝 A　中距離 A　先行 A", stats: [1150, 1020, 1060, 900, 1010] },
  { n: 16, name: "ナリタブライアン", trainer: "トレーナー Q", style: "leader", label: "先行", odds: "13.4倍", skill: 28, note: "有効 19　金相当 3　戦略 +2", image: "petit_1016_101601_0010.png", comment: "勝つために走るだけだ。", apt: "芝 A　中距離 A　先行 A", stats: [1150, 980, 1120, 870, 920] },
  { n: 17, name: "シンボリルドルフ", trainer: "トレーナー R", style: "leader", label: "先行", odds: "15.8倍", skill: 27, note: "有効 19　金相当 3　戦略 +2", image: "petit_1017_101701_0010.png", comment: "皇帝の走りを見届けよう。", apt: "芝 A　中距離 A　先行 A", stats: [1140, 970, 1080, 850, 1030] },
  { n: 18, name: "エアグルーヴ", trainer: "トレーナー S", style: "runner", label: "逃げ", odds: "20.1倍", skill: 23, note: "有効 16　金相当 3　戦略 +1", image: "petit_1018_101801_0010.png", comment: "自分のリズムで走ります。", apt: "芝 A　中距離 A　逃げ A", stats: [1100, 900, 1050, 860, 1000] }
];
const styleOrder = ["chaser", "betweener", "leader", "runner"];
const imageUrl = image => `../../../public/images/umamusume/petit/${image}`;
const statNames = ["スピード", "スタミナ", "パワー", "根性", "賢さ"];
function showDetail(runner) {
  const detail = document.querySelector(".detail");
  const image = document.querySelector("#detail-image");
  image.src = imageUrl(runner.image);
  image.alt = runner.name;
  document.querySelector("#detail-style").textContent = runner.label;
  document.querySelector("#detail-number").textContent = `${runner.n}番`;
  document.querySelector("#detail-name").textContent = runner.name;
  document.querySelector("#detail-trainer").textContent = runner.trainer;
  document.querySelector("#detail-odds").textContent = runner.odds;
  document.querySelector("#detail-comment").textContent = `「${runner.comment}」`;
  document.querySelector("#detail-skill").textContent = runner.skill;
  document.querySelector("#detail-skill-note").textContent = runner.note;
  document.querySelector("#detail-aptitude").textContent = `適性　${runner.apt}`;
  document.querySelector("#detail-stats").innerHTML = runner.stats.map((value, i) => `<div class="stat"><span>${statNames[i]}</span><span class="bar"><i style="width:${Math.min(value / 12.5, 100)}%"></i></span><b>${value}</b></div>`).join("");
  document.querySelectorAll(".horse").forEach(item => item.classList.toggle("selected", Number(item.dataset.number) === runner.n));
  detail.classList.add("open");
}
const groups = Object.fromEntries(styleOrder.map(style => [style, runners.filter(runner => runner.style === style)]));
const totalWeight = styleOrder.reduce((sum, style) => sum + 2 + groups[style].length, 0);
let cursor = 1;
styleOrder.forEach(style => {
  const group = document.querySelector(`[data-style="${style}"]`);
  const guide = document.querySelector(`.guide--${style}`);
  const width = ((2 + groups[style].length) / totalWeight) * 98;
  group.style.left = `${cursor}%`;
  group.style.width = `${width}%`;
  guide.style.left = `calc(${cursor + width / 2}% - 75px)`;
  cursor += width;
});
styleOrder.forEach(style => groups[style].forEach((runner, index) => {
  const group = document.querySelector(`[data-style="${runner.style}"]`);
  const rows = runner.style === "leader" || groups[runner.style].length > 4 ? 2 : 1;
  const row = rows === 1 ? 0 : index % rows;
  const column = Math.floor(index / rows);
  const columns = Math.ceil(groups[runner.style].length / rows);
  const x = ((column + .5) / columns) * 100;
  const bottom = row === 0 ? 0 : 61;
  const horse = document.createElement("button");
  horse.type = "button"; horse.className = "horse"; horse.dataset.number = runner.n;
  horse.style.left = `calc(${x}% - 71px)`; horse.style.bottom = `${bottom}px`;
  const listImage = runner.image.replace("_0010.png", "_0011.png");
  horse.innerHTML = `<img src="${imageUrl(listImage)}" alt="" onerror="this.onerror=null;this.src='${imageUrl(runner.image)}'"><i class="horse__number">${runner.n}</i><span class="horse__name">${runner.name}</span>`;
  horse.addEventListener("click", () => showDetail(runner));
  group.append(horse);
}));
document.querySelector(".detail-close").addEventListener("click", () => document.querySelector(".detail").classList.remove("open"));
showDetail(runners[0]);

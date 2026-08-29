const runners = [
  { n: 1, name: "スペシャルウィーク", style: "先行", trainer: "トレーナー I", odds: "4.8倍", skill: 32, note: "有効 22　金相当 4　戦略 +2", comment: "持てる力を発揮して走ります！", image: "petit_1001_100101_0010.png", stats: [1200, 950, 1100, 850, 1000], apt: "適性　芝 S　中距離 S　先行 A" },
  { n: 2, name: "サイレンススズカ", style: "逃げ", trainer: "トレーナー M", odds: "3.6倍", skill: 31, note: "有効 21　金相当 4　戦略 +2", comment: "大逃げで自分の形を作ります。", image: "petit_1002_100201_0010.png", stats: [1180, 1000, 1060, 780, 1120], apt: "適性　芝 A　中距離 A　逃げ S" },
  { n: 3, name: "トウカイテイオー", style: "先行", trainer: "トレーナー J", odds: "5.2倍", skill: 30, note: "有効 20　金相当 4　戦略 +2", comment: "がんばります！", image: "petit_1003_100301_0010.png", stats: [1190, 920, 1080, 880, 1050], apt: "適性　芝 A　中距離 A　先行 A" },
  { n: 5, name: "フジキセキ", style: "差し", trainer: "トレーナー N", odds: "12.5倍", skill: 27, note: "有効 19　金相当 3　戦略 +2", comment: "自分らしい一走を見せます。", image: "petit_1005_100501_0010.png", stats: [1110, 960, 1040, 840, 1020], apt: "適性　芝 A　中距離 A　差し A" },
  { n: 7, name: "ゴールドシップ", style: "追込", trainer: "トレーナー O", odds: "9.4倍", skill: 29, note: "有効 19　金相当 4　戦略 +2", comment: "最後の直線で差し切ります！", image: "petit_1007_100701_0010.png", stats: [1170, 1040, 1080, 910, 930], apt: "適性　芝 A　長距離 A　追込 S" },
  { n: 9, name: "ダイワスカーレット", style: "先行", trainer: "トレーナー K", odds: "4.3倍", skill: 33, note: "有効 23　金相当 4　戦略 +2", comment: "先行からしっかり粘ります！", image: "petit_1009_100901_0010.png", stats: [1200, 980, 1090, 900, 1080], apt: "適性　芝 S　中距離 S　先行 S" },
  { n: 13, name: "メジロマックイーン", style: "先行", trainer: "トレーナー L", odds: "7.3倍", skill: 32, note: "有効 22　金相当 4　戦略 +2", comment: "落ち着いて走りを見せますわ。", image: "petit_1013_101301_0010.png", stats: [1160, 1150, 1030, 900, 1000], apt: "適性　芝 S　長距離 S　先行 A" },
  { n: 18, name: "エアグルーヴ", style: "逃げ", trainer: "トレーナー S", odds: "20.1倍", skill: 23, note: "有効 16　金相当 3　戦略 +1", comment: "自分のリズムで走ります。", image: "petit_1018_101801_0010.png", stats: [1100, 900, 1050, 860, 1000], apt: "適性　芝 A　中距離 A　逃げ A" }
];
runners.push(
  { n: 4, name: "マルゼンスキー", style: "逃げ", trainer: "トレーナー A", odds: "8.1倍", skill: 26, note: "有効 18　金相当 3　戦略 +2", comment: "最高の走りを見せちゃう！", image: "petit_1004_100401_0010.png", stats: [1160, 900, 1050, 820, 980], apt: "適性　芝 A　中距離 A　逃げ A" },
  { n: 6, name: "オグリキャップ", style: "先行", trainer: "トレーナー B", odds: "6.4倍", skill: 34, note: "有効 24　金相当 4　戦略 +2", comment: "全力で走る。", image: "petit_1006_100601_0010.png", stats: [1210, 1080, 1100, 900, 970], apt: "適性　芝 S　中距離 S　先行 A" },
  { n: 8, name: "ウオッカ", style: "差し", trainer: "トレーナー F", odds: "11.2倍", skill: 28, note: "有効 20　金相当 3　戦略 +2", comment: "胸を張って行きます！", image: "petit_1008_100801_0010.png", stats: [1140, 920, 1090, 860, 1030], apt: "適性　芝 A　中距離 A　差し A" },
  { n: 10, name: "タイキシャトル", style: "逃げ", trainer: "トレーナー P", odds: "18.0倍", skill: 24, note: "有効 17　金相当 3　戦略 +1", comment: "マイル女王も頑張ります！", image: "petit_1010_101001_0010.png", stats: [1100, 860, 1030, 790, 1010], apt: "適性　芝 B　中距離 B　逃げ A" },
  { n: 11, name: "グラスワンダー", style: "差し", trainer: "トレーナー G", odds: "14.3倍", skill: 27, note: "有効 19　金相当 3　戦略 +2", comment: "力を込めて走ります。", image: "petit_1011_101101_0010.png", stats: [1130, 970, 1060, 880, 990], apt: "適性　芝 A　中距離 A　差し A" },
  { n: 12, name: "ヒシアマゾン", style: "追込", trainer: "トレーナー C", odds: "16.1倍", skill: 25, note: "有効 17　金相当 3　戦略 +2", comment: "末脚を見てください！", image: "petit_1012_101201_0010.png", stats: [1120, 950, 1070, 870, 940], apt: "適性　芝 A　中距離 A　追込 A" },
  { n: 14, name: "エルコンドルパサー", style: "先行", trainer: "トレーナー D", odds: "8.8倍", skill: 30, note: "有効 21　金相当 3　戦略 +3", comment: "先行から力強く行きます！", image: "petit_1014_101401_0010.png", stats: [1170, 980, 1110, 860, 980], apt: "適性　芝 A　中距離 A　先行 A" },
  { n: 15, name: "テイエムオペラオー", style: "先行", trainer: "トレーナー H", odds: "10.2倍", skill: 29, note: "有効 20　金相当 4　戦略 +1", comment: "覇王の走りをお見せします。", image: "petit_1015_101501_0010.png", stats: [1150, 1020, 1060, 900, 1010], apt: "適性　芝 A　中距離 A　先行 A" },
  { n: 16, name: "ナリタブライアン", style: "先行", trainer: "トレーナー Q", odds: "13.4倍", skill: 28, note: "有効 19　金相当 3　戦略 +2", comment: "走りで応えます。", image: "petit_1016_101601_0010.png", stats: [1150, 980, 1120, 870, 920], apt: "適性　芝 A　中距離 A　先行 A" },
  { n: 17, name: "シンボリルドルフ", style: "先行", trainer: "トレーナー R", odds: "15.8倍", skill: 27, note: "有効 19　金相当 3　戦略 +2", comment: "堂々と走りを見せよう。", image: "petit_1017_101701_0010.png", stats: [1140, 970, 1080, 850, 1030], apt: "適性　芝 A　中距離 A　先行 A" }
);
const positions = [[7,70],[18,70],[29,70],[40,70],[51,70],[62,70],[73,70],[84,70],[95,70],[13,44],[29,44],[45,44],[61,44],[77,44],[92,44],[25,17],[50,17],[76,17]];
const imageUrl = file => `../../../public/images/umamusume/petit/${file}`;
const statNames = ["スピード", "スタミナ", "パワー", "根性", "賢さ"];
const horses = document.querySelector("#mobile-horses");
const sheet = document.querySelector("#detail-sheet");
function showDetail(runner) {
  const detailImage = document.querySelector("#detail-image");
  detailImage.src = imageUrl(runner.image); detailImage.alt = runner.name;
  document.querySelector("#detail-style").textContent = `${runner.style}　${runner.n}番`;
  document.querySelector("#detail-name").textContent = runner.name;
  document.querySelector("#detail-trainer").textContent = runner.trainer;
  document.querySelector("#detail-odds").textContent = runner.odds;
  document.querySelector("#detail-comment").textContent = `「${runner.comment}」`;
  document.querySelector("#detail-skill").textContent = runner.skill;
  document.querySelector("#detail-skill-note").textContent = runner.note;
  document.querySelector("#detail-aptitude").textContent = runner.apt;
  document.querySelector("#summary-number").textContent = runner.n;
  document.querySelector("#summary-name").textContent = runner.name;
  document.querySelector("#detail-stats").innerHTML = runner.stats.map((value, index) => `<div class="stat"><span>${statNames[index]}</span><span class="bar"><i style="width:${Math.min(value / 12.5, 100)}%"></i></span><b>${value}</b></div>`).join("");
  document.querySelectorAll(".horse").forEach(item => item.classList.toggle("selected", Number(item.dataset.number) === runner.n));
  sheet.classList.add("open");
}
runners.forEach((runner, index) => {
  const [x, y] = positions[index]; const listImage = runner.image.replace("_0010.png", "_0011.png");
  const item = document.createElement("button"); item.type = "button"; item.className = "horse"; item.dataset.number = runner.n; item.style.left = `${x}%`; item.style.top = `${y}%`;
  item.innerHTML = `<img src="${imageUrl(listImage)}" alt="${runner.name}" onerror="this.onerror=null;this.src='${imageUrl(runner.image)}'"><i class="horse__number">${runner.n}</i><span class="horse__name">${runner.name}</span>`;
  item.addEventListener("click", () => showDetail(runner)); horses.append(item);
});
document.querySelector("#sheet-toggle").addEventListener("click", () => sheet.classList.toggle("open"));
showDetail(runners[0]);

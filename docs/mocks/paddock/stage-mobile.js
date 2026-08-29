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
const positions = [[13,72],[83,73],[31,60],[56,71],[12,37],[68,54],[43,33],[88,40]];
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

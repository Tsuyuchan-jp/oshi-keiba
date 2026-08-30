const allRunners = [
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
const templateCount = Number(new URLSearchParams(location.search).get("template")) || 0;
const cardMode = new URLSearchParams(location.search).get("card");
if (cardMode === "fun") document.body.classList.add("card-fun");
const runners = templateCount
  ? allRunners.slice(0, templateCount).map((runner) => ({ ...runner, style: "leader", label: "先行" }))
  : allRunners;
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
const activeStyles = styleOrder.filter(style => groups[style].length > 0);
const totalWeight = activeStyles.reduce((sum, style) => sum + 2 + groups[style].length, 0);
let cursor = 1;
styleOrder.forEach(style => {
  const group = document.querySelector(`[data-style="${style}"]`);
  const guide = document.querySelector(`.guide--${style}`);
  if (!groups[style].length) { group.hidden = true; guide.hidden = true; return; }
  const width = ((2 + groups[style].length) / totalWeight) * 98;
  group.style.left = `${cursor}%`;
  group.style.width = `${width}%`;
  guide.style.left = `calc(${cursor + width / 2}% - 75px)`;
  cursor += width;
});
const horizontalWiggle = [-7, 5, -3, 8, -5, 4, -8, 3, 7];
const verticalWiggle = [0, 7, -4, 5, -3, 4, -6, 2, 6];
styleOrder.forEach(style => groups[style].forEach((runner, index) => {
  const group = document.querySelector(`[data-style="${runner.style}"]`);
  const rowSize = 3;
  const row = Math.floor(index / rowSize);
  const columns = Math.min(rowSize, groups[runner.style].length - row * rowSize);
  const column = index % rowSize;
  const scale = Math.max(.9, 1 - row * .045);
  const width = Math.round(142 * scale);
  const x = ((column + .5) / columns) * 100;
  const bottom = row * 92 + verticalWiggle[index];
  const horse = document.createElement("button");
  horse.type = "button"; horse.className = "horse"; horse.dataset.number = runner.n;
  horse.style.width = `${width}px`; horse.style.height = `${Math.round(178 * scale)}px`;
  horse.style.left = `calc(${x}% - ${Math.round(width / 2)}px + ${horizontalWiggle[index]}px)`; horse.style.bottom = `${bottom}px`;
  const listImage = runner.image.replace("_0010.png", "_0011.png");
  horse.innerHTML = `<img style="height:${Math.round(148 * scale)}px" src="${imageUrl(listImage)}" alt="" onerror="this.onerror=null;this.src='${imageUrl(runner.image)}'"><i class="horse__number">${runner.n}</i><span class="horse__name">${runner.name}</span>`;
  horse.addEventListener("click", () => showDetail(runner));
  group.append(horse);
}));
function clearSelection() {
  document.querySelectorAll(".horse").forEach((horse) => horse.classList.remove("selected"));
  document.querySelector(".detail").classList.remove("open");
}
document.querySelector(".detail-close").addEventListener("click", clearSelection);
showDetail(runners[0]);

const stage = document.querySelector(".paddock-stage");
const toggleEditor = document.querySelector(".layout-editor__toggle");
const editorPanel = document.querySelector(".layout-editor__panel");
const editorOutput = document.querySelector(".layout-editor__output");
const collisionLabel = document.querySelector(".layout-editor__collision");
const layoutKey = "paddock-stage-layout-v2";
const handTunedTemplates = {
  1: [{ x: 45.1, y: 40.9 }],
  2: [{ x: 40.1, y: 60.1 }, { x: 49.6, y: 33.3 }],
  3: [{ x: 32, y: 68 }, { x: 30.8, y: 10.8 }, { x: 48, y: 41.2 }],
  4: [{ x: 34.9, y: 63.7 }, { x: 49, y: 63.5 }, { x: 41.4, y: 25.6 }, { x: 55.4, y: 26.6 }],
  5: [{ x: 36.1, y: 68 }, { x: 53.3, y: 68 }, { x: 44.8, y: 39.2 }, { x: 36.4, y: 10.1 }, { x: 53.7, y: 10.3 }],
  6: [{ x: 29.3, y: 68 }, { x: 50.7, y: 68 }, { x: 38.1, y: 40.3 }, { x: 58.5, y: 41.2 }, { x: 28.5, y: 11.2 }, { x: 49, y: 11.2 }],
  7: [{ x: 31.1, y: 68 }, { x: 44.6, y: 68 }, { x: 57.6, y: 68 }, { x: 37.8, y: 40.5 }, { x: 51.1, y: 40 }, { x: 31.6, y: 12.6 }, { x: 45, y: 14 }],
  8: [{ x: 31.4, y: 68 }, { x: 45.3, y: 68 }, { x: 58.7, y: 68 }, { x: 38.5, y: 40.1 }, { x: 52.3, y: 40 }, { x: 31.8, y: 11.3 }, { x: 45.9, y: 13 }, { x: 59.5, y: 13 }],
  9: [{ x: 20.5, y: 68 }, { x: 38.9, y: 68 }, { x: 57.3, y: 68 }, { x: 29.8, y: 41.9 }, { x: 47.8, y: 41.8 }, { x: 65.9, y: 41.8 }, { x: 21.6, y: 16 }, { x: 39, y: 16.2 }, { x: 57, y: 16.2 }],
  10: [{ x: 27.3, y: 68 }, { x: 39.9, y: 68 }, { x: 52.1, y: 68 }, { x: 64, y: 69.5 }, { x: 34.1, y: 40.5 }, { x: 46.3, y: 40.1 }, { x: 58.7, y: 41.6 }, { x: 40.4, y: 14 }, { x: 52.9, y: 14 }, { x: 64.8, y: 14.2 }],
  11: [{ x: 27.4, y: 68 }, { x: 40.1, y: 68 }, { x: 52.8, y: 68 }, { x: 65.3, y: 69.5 }, { x: 34, y: 40 }, { x: 46.5, y: 39.8 }, { x: 60.2, y: 41 }, { x: 27.7, y: 12.8 }, { x: 40.7, y: 12.6 }, { x: 53.8, y: 12.8 }, { x: 65.7, y: 13.1 }],
  12: [{ x: 16.5, y: 68 }, { x: 34.6, y: 68 }, { x: 52.8, y: 68 }, { x: 70.7, y: 69.5 }, { x: 43.8, y: 41.9 }, { x: 7.2, y: 41.8 }, { x: 62.2, y: 43 }, { x: 26.1, y: 43.4 }, { x: 34.3, y: 16.4 }, { x: 17.1, y: 16.9 }, { x: 53.1, y: 16.6 }, { x: 70.4, y: 16.4 }],
};
function templatePositions(count) {
  if (!count) return [];
  if (handTunedTemplates[count]) return handTunedTemplates[count];
  const layers = Math.ceil(count / 3);
  const base = Math.floor(count / layers);
  const remainder = count % layers;
  const positions = [];
  let index = 0;
  for (let layer = 0; layer < layers; layer += 1) {
    const size = base + (layer < remainder ? 1 : 0);
    const y = layers === 1 ? 48 : 67 - (56 * layer) / (layers - 1);
    const xs = size === 1 ? [42] : size === 2 ? [12, 54] : [4, 34, 64];
    const sway = [0, 3.5, -2.5, 2, -3][layer % 5];
    for (let column = 0; column < size; column += 1) {
      positions[index++] = { x: xs[column] + sway, y: y + (column % 2 === 0 ? 1.8 : -1.8) };
    }
  }
  return positions;
}
function distributionTemplateLayout() {
  return Object.fromEntries(styleOrder.flatMap(style => {
    const positions = templatePositions(groups[style].length);
    return groups[style].map((runner, index) => [runner.n, positions[index]]);
  }));
}
const calculatedRowPatterns = {
  1: [1], 2: [1, 1], 3: [1, 1, 1], 4: [2, 2],
  5: [2, 1, 2], 6: [2, 2, 2], 7: [3, 2, 2], 8: [3, 2, 3],
  9: [3, 3, 3], 10: [4, 3, 3], 11: [4, 3, 4], 12: [4, 4, 4]
};
const calculatedRowShifts = ["-8%", "8%", "-8%"];
function applyCalculatedDistributionLayout() {
  styleOrder.forEach(style => {
    const group = document.querySelector(`[data-style="${style}"]`);
    const horses = groups[style].map(runner => group.querySelector(`[data-number="${runner.n}"]`));
    const rows = calculatedRowPatterns[horses.length];
    if (!rows) return;
    horses.forEach(horse => {
      horse.style.removeProperty("width");
      horse.style.removeProperty("height");
      horse.style.removeProperty("left");
      horse.style.removeProperty("top");
      horse.style.removeProperty("bottom");
      horse.querySelector("img").style.removeProperty("height");
    });
    const layout = document.createElement("div");
    layout.className = "horse-group__auto-layout";
    let cursor = 0;
    rows.forEach((count, rowIndex) => {
      const row = document.createElement("div");
      row.className = "horse-group__auto-row";
      row.style.setProperty("--row-shift", calculatedRowShifts[rowIndex] || "0");
      horses.slice(cursor, cursor + count).forEach(horse => row.append(horse));
      cursor += count;
      layout.append(row);
    });
    group.append(layout);
    group.classList.add("horse-group--auto-layout");
  });
}
function removeCalculatedDistributionLayout() {
  document.querySelectorAll(".horse-group--auto-layout").forEach(group => {
    const layout = group.querySelector(".horse-group__auto-layout");
    if (layout) [...layout.querySelectorAll(".horse")].forEach(horse => group.append(horse));
    layout?.remove();
    group.classList.remove("horse-group--auto-layout");
  });
}
let draggedHorse = null;
let dragMoved = false;

function captureLayout() {
  return Object.fromEntries([...document.querySelectorAll(".horse")].map(horse => {
    const group = horse.parentElement.getBoundingClientRect();
    return [horse.dataset.number, {
      x: Math.round((horse.offsetLeft / group.width) * 1000) / 10,
      y: Math.round((horse.offsetTop / group.height) * 1000) / 10
    }];
  }));
}
function updateEditorOutput() { editorOutput.value = JSON.stringify(captureLayout(), null, 2); }
function checkCollisions() {
  const horses = [...document.querySelectorAll(".horse")];
  const colliding = new Set();
  horses.forEach((horse, index) => {
    const a = horse.getBoundingClientRect();
    const ax = a.left + a.width / 2, ay = a.top + a.height * .67;
    horses.slice(index + 1).forEach(other => {
      const b = other.getBoundingClientRect();
      const bx = b.left + b.width / 2, by = b.top + b.height * .67;
      if (Math.hypot(ax - bx, ay - by) < Math.min(a.width, b.width) * .68) { colliding.add(horse); colliding.add(other); }
    });
  });
  horses.forEach(horse => horse.classList.toggle("is-colliding", colliding.has(horse)));
  collisionLabel.textContent = colliding.size ? `重なり判定：${colliding.size}人を確認してください` : "重なり判定：問題ありません";
}
function applyLayout(layout) {
  document.querySelectorAll(".horse").forEach(horse => {
    const position = layout[horse.dataset.number];
    if (!position) return;
    horse.style.left = `${position.x}%`;
    horse.style.top = `${position.y}%`;
    horse.style.bottom = "auto";
  });
}
function applyStoredLayout() {
  const saved = JSON.parse(localStorage.getItem(layoutKey) || "null");
  if (!saved) return false;
  applyLayout(saved);
  return true;
}
function persistLayout() { localStorage.setItem(layoutKey, JSON.stringify(captureLayout())); updateEditorOutput(); checkCollisions(); }
toggleEditor.addEventListener("click", () => {
  const editing = stage.classList.toggle("editing");
  editorPanel.hidden = !editing;
  toggleEditor.textContent = editing ? "配置調整を終了する" : "配置を調整する";
  if (editing) { removeCalculatedDistributionLayout(); applyLayout(distributionTemplateLayout()); updateEditorOutput(); checkCollisions(); }
});
document.querySelector(".layout-editor__reset").addEventListener("click", () => { localStorage.removeItem(layoutKey); location.reload(); });
document.querySelector(".layout-editor__clear").addEventListener("click", clearSelection);
document.querySelector(".layout-editor__copy").addEventListener("click", async () => {
  updateEditorOutput();
  const copyButton = document.querySelector(".layout-editor__copy");
  try { await navigator.clipboard.writeText(editorOutput.value); copyButton.textContent = "コピーしました"; }
  catch { editorOutput.focus(); editorOutput.select(); copyButton.textContent = "下のJSONをコピー"; }
  setTimeout(() => copyButton.textContent = "JSONをコピー", 1200);
});
document.querySelectorAll(".horse").forEach(horse => {
  horse.addEventListener("pointerdown", event => {
    if (!stage.classList.contains("editing")) return;
    draggedHorse = horse; dragMoved = false; horse.setPointerCapture(event.pointerId); event.preventDefault();
  });
  horse.addEventListener("pointermove", event => {
    if (draggedHorse !== horse) return;
    const group = horse.parentElement.getBoundingClientRect();
    const left = Math.max(0, Math.min(group.width - horse.offsetWidth, event.clientX - group.left - horse.offsetWidth / 2));
    const top = Math.max(0, Math.min(group.height - horse.offsetHeight, event.clientY - group.top - horse.offsetHeight * .67));
    horse.style.left = `${left}px`; horse.style.top = `${top}px`; horse.style.bottom = "auto"; dragMoved = true;
    checkCollisions();
  });
  horse.addEventListener("pointerup", () => { if (draggedHorse === horse) { draggedHorse = null; persistLayout(); } });
  horse.addEventListener("click", event => { if (stage.classList.contains("editing") && dragMoved) event.preventDefault(); });
});
if (templateCount) {
  const positions = templatePositions(templateCount);
  applyLayout(Object.fromEntries(runners.map((runner, index) => [runner.n, positions[index]])));
  document.querySelector(".scoreboard__bottom").textContent = `人数別テンプレート確認　先行 ${templateCount}人`;
  document.querySelectorAll(".guide, .horse-group").forEach((element) => {
    if (!element.classList.contains("guide--leader") && !element.classList.contains("horse-group--leader")) element.hidden = true;
  });
} else if (!applyStoredLayout()) applyCalculatedDistributionLayout();
document.querySelectorAll("[data-template-count]").forEach((button) => {
  button.dataset.active = String(Number(button.dataset.templateCount) === templateCount);
  button.addEventListener("click", () => {
    const url = new URL(location.href);
    const count = Number(button.dataset.templateCount);
    if (count) url.searchParams.set("template", String(count)); else url.searchParams.delete("template");
    location.href = url.toString();
  });
});

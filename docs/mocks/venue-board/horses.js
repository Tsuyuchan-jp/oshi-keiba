const horses = [
  [1, "サイレンススズカ", "あお", "3.2", "down", "0.2"],
  [2, "スペシャルウィーク", "つゆ", "5.8", "", ""],
  [3, "グラスワンダー", "ren", "8.1", "up", "0.4"],
  [4, "セイウンスカイ", "neko", "12.4", "", ""],
  [5, "エルコンドルパサー", "momo", "6.0", "down", "0.1"],
  [6, "テイエムオペラオー", "kai", "15.2", "", ""],
  [7, "ファインモーション", "yuki", "9.7", "up", "0.3"],
  [8, "ナリタブライアン", "sora", "18.0", "", ""],
  [9, "メジロマックイーン", "hana", "7.4", "", ""],
  [10, "トウカイテイオー", "rio", "11.1", "up", "0.5"],
  [11, "ビワハヤヒデ", "ken", "22.6", "", ""],
  [12, "ミホノブルボン", "mai", "14.3", "down", "0.2"],
  [13, "サクラバクシンオー", "leo", "16.8", "", ""],
  [14, "タイキシャトル", "ami", "10.5", "", ""],
  [15, "エアグルーヴ", "jun", "13.9", "up", "0.2"],
  [16, "シンボリルドルフ", "tori", "4.6", "down", "0.3"],
  [17, "オグリキャップ", "nana", "19.2", "", ""],
  [18, "タマモクロス", "bee", "25.0", "", ""],
];

const tb = document.getElementById("rows");
for (const [n, uma, runner, odds, dir, d] of horses) {
  const tr = document.createElement("tr");
  if (n === 3) tr.className = "pulse";
  tr.innerHTML = `<td class="num">${n}</td><td class="name">${uma}</td><td class="runner">${runner}</td>
    <td class="odds">${odds}${dir ? `<span class="delta ${dir}">${dir === "up" ? "↑" : "↓"}${d}</span>` : ""}</td>`;
  tb.appendChild(tr);
}
setInterval(() => {
  const tr = tb.children[2];
  tr.classList.remove("pulse");
  void tr.offsetWidth;
  tr.classList.add("pulse");
}, 4000);

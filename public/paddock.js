(() => {
  const view = window.__PADDOCK__;
  const styles = ["chaser", "betweener", "leader", "runner"];
  const labels = { chaser: "追込", betweener: "差し", leader: "先行", runner: "逃げ" };
  const patterns = { 1: [1], 2: [1, 1], 3: [1, 1, 1], 4: [2, 2], 5: [2, 1, 2], 6: [2, 2, 2], 7: [3, 2, 2], 8: [3, 2, 3], 9: [3, 3, 3], 10: [4, 3, 3], 11: [4, 3, 4], 12: [4, 4, 4] };
  const groups = document.querySelector("#horse-groups");
  const detail = document.querySelector("#detail");
  const statCaps = { speed: 2300, stamina: 1800, power: 1700, guts: 1700, wisdom: 1800 };
  let backdrop;
  let shotDialog;
  const esc = (v) => String(v ?? "").replace(/[&<>\"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const rowsFor = (horses) => {
    const p = patterns[horses.length] || [Math.ceil(horses.length / 3), Math.ceil(horses.length / 3), horses.length - Math.ceil(horses.length / 3) * 2].filter(Boolean);
    let at = 0;
    return p.map((n) => horses.slice(at, at += n));
  };
  const odds = (value) => value == null || !Number.isFinite(Number(value)) ? "—" : `${Number(value).toFixed(1)}倍`;
  const aptitudeBadges = (aptitudes) => {
    if (!aptitudes) return '<p class="aptitude aptitude--empty">適性データは未登録</p>';
    return `<div class="aptitude"><span class="aptitude__title">適性</span>${[aptitudes.surface, aptitudes.distance, aptitudes.style].map((item) => `<span class="aptitude__badge${item.rank === "S" ? " is-s" : ""}"><i>${esc(item.label)}</i><b>${esc(item.rank)}</b></span>`).join("")}</div>`;
  };
  const stats = (h) => {
    if (!h.stats) return "<p>能力データは未登録です</p>";
    return [["スピード", "speed"], ["スタミナ", "stamina"], ["パワー", "power"], ["根性", "guts"], ["賢さ", "wisdom"]].map(([name, key]) => {
      const value = Number(h.stats[key]);
      const cap = statCaps[key];
      const target = Number(h.statTargets?.[key]);
      const width = Number.isFinite(value) && cap ? Math.min(100, value / cap * 100) : 0;
      const markerPosition = Number.isFinite(target) && cap ? Math.min(100, target / cap * 100) : null;
      const marker = markerPosition != null ? `<i class="bar__target" style="left:${markerPosition}%" aria-hidden="true"></i>` : "";
      return `<div class="stat"><span>${name}</span><i class="bar">${marker}<i class="bar__value" style="width:${width}%"></i></i><b>${value}</b></div>`;
    }).join("");
  };
  const close = () => {
    detail.className = "detail";
    document.querySelectorAll(".horse").forEach((x) => x.classList.remove("selected"));
    backdrop?.remove();
    backdrop = null;
  };
  const openShot = (url, name) => {
    if (!shotDialog) {
      shotDialog = document.createElement("dialog");
      shotDialog.className = "shot-dialog";
      shotDialog.innerHTML = '<button type="button" aria-label="閉じる">×</button><img alt="">';
      shotDialog.querySelector("button").addEventListener("click", () => shotDialog.close());
      shotDialog.addEventListener("click", (event) => { if (event.target === shotDialog) shotDialog.close(); });
      document.body.append(shotDialog);
    }
    const image = shotDialog.querySelector("img");
    image.src = url;
    image.alt = `${name}の育成スクリーンショット`;
    shotDialog.showModal();
  };
  const open = (h) => {
    document.querySelectorAll(".horse").forEach((x) => x.classList.toggle("selected", x.dataset.id === h.id));
    const icon = h.trainerIconUrl ? `<img src="${esc(h.trainerIconUrl)}" alt="${esc(h.trainerName)}のアイコン">` : '<span class="trainer-placeholder">Trainer</span>';
    const comment = esc(h.comment || "意気込みコメントは未登録です");
    const shot = h.shotUrl ? '<button type="button" class="shot-action">育成スクリーンショットを見る</button>' : "";
    detail.className = "detail open";
    detail.innerHTML = `<div class="detail__summary"><small>タップで詳細を閉じる</small></div><div class="detail__heading"><span>${esc(h.styleLabel)}</span>　<span>${h.number}番</span></div><div class="profile">${h.detailImageUrl ? `<img src="${esc(h.detailImageUrl)}" alt="${esc(h.umaName)}">` : ""}<div class="profile-text"><h2>${esc(h.umaName)}</h2><p class="profile-trainer"><span>トレーナー</span><b>${esc(h.trainerName)}</b></p><strong>${odds(h.odds)}</strong></div></div><div class="trainer-comment">${icon}<blockquote>${comment}</blockquote></div><section class="skill"><div><span>スキルパワー</span><b>${h.skillPower ?? "—"}</b></div><small>有効 ${h.skillSummary?.effective ?? 0}　金相当 ${h.skillSummary?.goldLike ?? 0}　戦略 +${h.skillSummary?.strategic ?? 0}</small></section><section class="status"><h3>基礎能力</h3>${stats(h)}${aptitudeBadges(h.aptitudes)}</section><div class="actions">${shot}<a class="candidate" href="/bet?candidate=${encodeURIComponent(h.id)}">このウマ娘を投票候補にする →</a></div>`;
    detail.querySelector(".shot-action")?.addEventListener("click", () => openShot(h.shotUrl, h.umaName));
    if (matchMedia("(max-width:700px)").matches) {
      backdrop = document.createElement("button");
      backdrop.className = "detail-backdrop";
      backdrop.ariaLabel = "詳細を閉じる";
      backdrop.addEventListener("click", close);
      document.body.append(backdrop);
      detail.querySelector(".detail__summary")?.addEventListener("click", close);
    }
  };
  const renderGroups = () => {
    const active = styles.map((style) => ({ style, horses: view.horses.filter((h) => h.style === style) })).filter(({ horses }) => horses.length);
    groups.innerHTML = "";
    groups.style.gridTemplateColumns = active.map(({ horses }) => `${2 + horses.length}fr`).join(" ");
    active.forEach(({ style, horses }) => {
      const group = document.createElement("section");
      group.className = `horse-group ${style}`;
      group.innerHTML = `<div class="guide"><b>${labels[style]}</b></div><div class="group-rows"></div>`;
      const rows = group.querySelector(".group-rows");
      rowsFor(horses).forEach((row, index) => {
        const line = document.createElement("div");
        line.className = "horse-row";
        const offsetCounts = new Set([2, 4, 6, 9, 12]);
        line.style.setProperty("--row-shift", offsetCounts.has(horses.length) ? `${index % 2 ? "8" : "-8"}%` : "0");
        row.forEach((h) => {
          const button = document.createElement("button");
          button.className = "horse";
          button.type = "button";
          button.dataset.id = h.id;
          button.innerHTML = `${h.listImageUrl ? `<img src="${esc(h.listImageUrl)}" alt="">` : ""}<span class="horse__number">${h.number}</span><span class="horse__name">${esc(h.umaName)}</span>`;
          button.addEventListener("click", () => open(h));
          line.append(button);
        });
        rows.append(line);
      });
      groups.append(group);
    });
  };
  detail.className = "detail detail--empty";
  detail.textContent = "ウマ娘を選ぶと、ここに詳細が表示されます";
  renderGroups();
})();

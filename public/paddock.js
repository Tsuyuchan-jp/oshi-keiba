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
  let mobileGroupCount = 1;
  let mobileRowCount = 1;
  let swipeToCloseEnabled = false;
  const esc = (v) => String(v ?? "").replace(/[&<>\"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const rowsFor = (horses, mobile = false) => {
    const p = mobile
      ? Array.from({ length: Math.ceil(horses.length / 5) }, (_, index) => Math.min(5, horses.length - index * 5))
      : patterns[horses.length] || [Math.ceil(horses.length / 3), Math.ceil(horses.length / 3), horses.length - Math.ceil(horses.length / 3) * 2].filter(Boolean);
    let at = 0;
    return p.map((n) => horses.slice(at, at += n));
  };
  const fitMobileHeight = () => {
    if (!matchMedia("(max-width:700px)").matches) return;
    const stageHeight = groups.closest(".race-view")?.getBoundingClientRect().height || window.innerHeight;
    const top = Math.min(220, Math.max(205, stageHeight * 0.27));
    const bottom = Math.min(72, Math.max(18, stageHeight * 0.06));
    const density = groups.dataset.mobileDensity || "normal";
    const limits = density === "roomy"
      ? { box: 112, image: 93 }
      : density === "dense"
      ? { box: 94, image: 78 }
      : { box: 96, image: 89 };
    const groupPadding = mobileGroupCount * 20;
    const rowSlot = Math.max(1, (stageHeight - top - bottom - groupPadding) / Math.max(1, mobileRowCount));
    const boxHeight = Math.max(48, Math.min(limits.box, Math.floor(rowSlot * 10) / 10));
    const imageHeight = Math.max(43, Math.min(limits.image, boxHeight - 5));
    const bobDistance = boxHeight >= limits.box ? 25 : Math.max(8, Math.min(25, boxHeight * 0.2));
    groups.style.setProperty("--groups-top", `${top}px`);
    groups.style.setProperty("--groups-bottom", `${bottom}px`);
    groups.style.setProperty("--horse-box-height", `${boxHeight}px`);
    groups.style.setProperty("--horse-image-height", `${imageHeight}px`);
    groups.style.setProperty("--horse-bob-distance", `${bobDistance}px`);
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
      const hasTarget = Number.isFinite(target) && target > 0 && cap > 0;
      const width = !Number.isFinite(value) || !cap
        ? 0
        : !hasTarget
        ? Math.min(100, value / cap * 100)
        : target >= cap
        ? Math.min(80, value / cap * 80)
        : value <= target
        ? Math.min(80, value / target * 80)
        : Math.min(100, 80 + (value - target) / (cap - target) * 20);
      const marker = hasTarget ? '<i class="bar__target" aria-hidden="true"></i>' : "";
      return `<div class="stat"><span>${name}</span><i class="bar">${marker}<i class="bar__value" style="width:${width}%"></i></i><b>${value}</b></div>`;
    }).join("");
  };
  const close = () => {
    detail.className = "detail";
    detail.style.removeProperty("transform");
    document.querySelectorAll(".horse").forEach((x) => x.classList.remove("selected"));
    backdrop?.remove();
    backdrop = null;
  };
  const enableSwipeToClose = () => {
    if (swipeToCloseEnabled) return;
    swipeToCloseEnabled = true;
    let gesture = null;
    const reset = () => {
      detail.classList.remove("is-dragging");
      detail.style.removeProperty("transform");
      gesture = null;
    };
    detail.addEventListener("pointerdown", (event) => {
      if (!matchMedia("(max-width:700px)").matches || !event.isPrimary || event.button > 0) return;
      const fromHandle = event.target instanceof Element && event.target.closest(".detail__summary");
      if (!fromHandle && detail.scrollTop > 0) return;
      gesture = { x: event.clientX, y: event.clientY, dragging: false };
      detail.setPointerCapture?.(event.pointerId);
    });
    detail.addEventListener("pointermove", (event) => {
      if (!gesture) return;
      const x = event.clientX - gesture.x;
      const y = event.clientY - gesture.y;
      if (y <= 0 || Math.abs(y) <= Math.abs(x)) return;
      gesture.dragging = true;
      detail.classList.add("is-dragging");
      detail.style.transform = `translateY(${Math.min(y, detail.clientHeight)}px)`;
      event.preventDefault();
    });
    const finish = (event) => {
      if (!gesture) return;
      const distance = event.clientY - gesture.y;
      if (gesture.dragging && distance > Math.min(96, detail.clientHeight * 0.2)) close();
      else reset();
    };
    detail.addEventListener("pointerup", finish);
    detail.addEventListener("pointercancel", reset);
  };
  const openShot = (url, name) => {
    if (!shotDialog) {
      shotDialog = document.createElement("dialog");
      shotDialog.className = "shot-dialog";
      shotDialog.innerHTML = '<button type="button" class="shot-dialog__close" aria-label="閉じる"><span aria-hidden="true">×</span></button><img alt="" role="button" tabindex="0" aria-label="スクリーンショットを拡大">';
      shotDialog.querySelector("button").addEventListener("click", () => shotDialog.close());
      shotDialog.addEventListener("click", (event) => { if (event.target === shotDialog) shotDialog.close(); });
      const image = shotDialog.querySelector("img");
      const toggleZoom = () => {
        const expanded = !image.classList.contains("is-zoomed");
        if (expanded) {
          const { width, height } = image.getBoundingClientRect();
          image.style.width = `${Math.round(width * 2.2)}px`;
          image.style.height = `${Math.round(height * 2.2)}px`;
          image.classList.add("is-zoomed");
        } else {
          image.classList.remove("is-zoomed");
          image.style.removeProperty("width");
          image.style.removeProperty("height");
        }
        image.setAttribute("aria-label", expanded ? "スクリーンショットを元の大きさに戻す" : "スクリーンショットを拡大");
      };
      image.addEventListener("click", toggleZoom);
      image.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleZoom();
        }
      });
      shotDialog.addEventListener("close", () => {
        image.classList.remove("is-zoomed");
        image.style.removeProperty("width");
        image.style.removeProperty("height");
        image.setAttribute("aria-label", "スクリーンショットを拡大");
      });
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
    detail.innerHTML = `<div class="detail__summary"><small>下にスワイプして閉じる</small></div><div class="detail__heading"><span>${esc(h.styleLabel)}</span>　<span>${h.number}番</span></div><div class="profile">${h.detailImageUrl ? `<img src="${esc(h.detailImageUrl)}" alt="${esc(h.umaName)}">` : ""}<div class="profile-text"><h2>${esc(h.umaName)}</h2><p class="profile-trainer"><span>トレーナー</span><b>${esc(h.trainerName)}</b></p><strong>${odds(h.odds)}</strong></div></div><div class="trainer-comment">${icon}<blockquote>${comment}</blockquote></div><section class="skill"><div><span>スキルパワー</span><b>${h.skillPower ?? "—"}</b></div><small>有効 ${h.skillSummary?.effective ?? 0}　金相当 ${h.skillSummary?.goldLike ?? 0}　戦略 +${h.skillSummary?.strategic ?? 0}</small></section><section class="status"><h3>基礎能力</h3>${stats(h)}${aptitudeBadges(h.aptitudes)}</section><div class="actions">${shot}<a class="candidate" href="/bet?candidate=${encodeURIComponent(h.id)}">このウマ娘を投票候補にする →</a></div>`;
    detail.querySelector(".shot-action")?.addEventListener("click", () => openShot(h.shotUrl, h.umaName));
    if (matchMedia("(max-width:700px)").matches) {
      enableSwipeToClose();
      backdrop = document.createElement("button");
      backdrop.className = "detail-backdrop";
      backdrop.ariaLabel = "詳細を閉じる";
      backdrop.addEventListener("click", close);
      document.body.append(backdrop);
      detail.querySelector(".detail__summary")?.addEventListener("click", close);
    }
  };
  const renderGroups = () => {
    const mobile = matchMedia("(max-width:700px)").matches;
    const active = styles.map((style) => ({ style, horses: view.horses.filter((h) => h.style === style) })).filter(({ horses }) => horses.length);
    const displayGroups = mobile ? [...active].reverse() : active;
    groups.innerHTML = "";
    if (mobile) {
      groups.style.removeProperty("grid-template-columns");
      const totalRows = displayGroups.reduce((total, { horses }) => total + rowsFor(horses, true).length, 0);
      mobileGroupCount = Math.max(1, displayGroups.length);
      mobileRowCount = Math.max(1, totalRows);
      groups.dataset.mobileDensity = totalRows <= 4 ? "roomy" : totalRows === 5 ? "normal" : "dense";
    } else {
      delete groups.dataset.mobileDensity;
      for (const property of ["--groups-top", "--groups-bottom", "--horse-box-height", "--horse-image-height", "--horse-bob-distance"]) {
        groups.style.removeProperty(property);
      }
      groups.style.gridTemplateColumns = active.map(({ horses }) => `${2 + horses.length}fr`).join(" ");
    }
    displayGroups.forEach(({ style, horses }) => {
      const group = document.createElement("section");
      group.className = `horse-group ${style}`;
      group.innerHTML = `<div class="guide"><b>${labels[style]}</b></div><div class="group-rows"></div>`;
      const rows = group.querySelector(".group-rows");
      const horseRows = rowsFor(horses, mobile);
      group.style.setProperty("--band-rows", String(horseRows.length));
      horseRows.forEach((row, index) => {
        const line = document.createElement("div");
        line.className = "horse-row";
        const offsetCounts = new Set([2, 4, 6, 9, 12]);
        line.style.setProperty("--row-shift", !mobile && offsetCounts.has(horses.length) ? `${index % 2 ? "8" : "-8"}%` : "0");
        if (mobile) {
          line.style.setProperty("--horse-width", row.length === 5 ? "min(64px, 17vw)" : row.length === 4 ? "min(76px, 20vw)" : "84px");
        }
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
    if (mobile) fitMobileHeight();
  };
  detail.className = "detail detail--empty";
  detail.textContent = "ウマ娘を選ぶと、ここに詳細が表示されます";
  renderGroups();
  window.addEventListener("resize", fitMobileHeight);
  window.visualViewport?.addEventListener("resize", fitMobileHeight);
})();

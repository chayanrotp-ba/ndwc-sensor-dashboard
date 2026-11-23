(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const page = document.body.dataset.page || "overview";
  const RAIN_SENSOR_ICON = "assets/sensor-rain.png";

  function initVersionBadge() {
    if (!["overview","basin","monitor"].includes(page) || $(".version-baseline")) return;
    const badge = document.createElement("div");
    badge.className = "version-baseline";
    badge.textContent = "Version 1.2.2";
    badge.title = "Patch version: v1.2.2 · baseline: v1.0-baseline";
    document.body.appendChild(badge);
  }

  function updateClock() {
    const target = $("#clock");
    if (!target) return;
    target.textContent = new Date().toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }) + " น.";
  }

  function flashRefresh(button) {
    if (!button || button.disabled) return;
    const original = button.textContent;
    button.disabled = true;
    button.textContent = "↻ กำลังอัปเดต…";
    window.setTimeout(() => {
      updateClock();
      button.textContent = "✓ อัปเดตแล้ว";
      window.setTimeout(() => {
        button.textContent = original;
        button.disabled = false;
      }, 850);
    }, 650);
  }

  function initBasinSensorLayerControl() {
    if (page !== "basin") return;
    const panel = $("#sensorLayerPanel");
    const panelToggle = $("#sensorLayerControlToggle");
    const options = $$('[data-sensor-layer-toggle]');
    if (!panel || !panelToggle || !options.length) return;
    const state = window.basinSensorLayerState || {flow:true,rain:true};
    window.basinSensorLayerState = state;

    const applyLayerState = (type, visible, notify = true) => {
      state[type] = visible;
      document.body.classList.toggle(`sensor-${type}-layer-hidden`, !visible);
      const option = $(`[data-sensor-layer-toggle="${type}"]`);
      option?.classList.toggle("is-on", visible);
      option?.setAttribute("aria-checked", String(visible));
      if (notify) document.dispatchEvent(new CustomEvent("basin-sensor-layer-change", {detail:{type,visible}}));
    };

    options.forEach(option => option.addEventListener("click", () => {
      const type = option.dataset.sensorLayerToggle;
      applyLayerState(type, !state[type]);
    }));
    panelToggle.addEventListener("click", () => {
      const expanded = panelToggle.getAttribute("aria-expanded") === "true";
      panelToggle.setAttribute("aria-expanded", String(!expanded));
      panel.hidden = expanded;
    });
    applyLayerState("flow", state.flow !== false, false);
    applyLayerState("rain", state.rain !== false, false);
  }

  function initOverview() {
    const cards = $$(".basin-card");
    const search = $("#basinSearch");
    const select = $("#basinSelect");
    const filters = $$("#severityFilters [data-severity]");
    let activeSeverity = "all";

    const alertDetails = Object.keys(basinStatus).map(code => ({code,detail:basinDrilldowns[code]})).filter(item => item.detail);
    const allAlertStations = alertDetails.flatMap(item => detailStationRecords(item.detail));
    const allAlertSensors = alertDetails.flatMap(item => item.detail.sensors || []);
    const basinCounts = {all:alertDetails.length,red:0,orange:0,yellow:0};
    alertDetails.forEach(item => { basinCounts[basinStatus[item.code].severity] += 1; });

    filters.forEach(button => {
      const count = basinCounts[button.dataset.severity] ?? 0;
      const badge = $("b",button);
      if (badge) badge.textContent = count;
    });
    cards.forEach(card => {
      const detail = basinDrilldowns[card.dataset.basin];
      if (!detail) return;
      const stations = detailStationRecords(detail);
      const ranked = rankStations(stations);
      card.dataset.points = String(stations.length);
      const count = $(".basin-count b",card); if (count) count.textContent = stations.length;
      const countLabel = $(".basin-count small",card); if (countLabel) countLabel.textContent = "จุดเข้าเกณฑ์";
      const peak = $(".peak-value b",card); if (peak && ranked[0]) peak.textContent = `${Number(ranked[0].level).toFixed(2)} ม.`;
      const trend = $(".peak-value em",card); if (trend && ranked[0]) trend.textContent = `${Number(ranked[0].trend) >= 0 ? "+" : ""}${Number(ranked[0].trend).toFixed(2)} ม./ชม.`;
    });
    const overviewSummaryCards = $$(".summary-grid .summary-card");
    const criticalDetails = alertDetails.filter(item => basinStatus[item.code].severity === "red");
    const flowCount = allAlertSensors.filter(item => item.type === "flow").length;
    const rainCount = allAlertSensors.filter(item => item.type === "rain").length;
    const overviewSummaryValues = [
      [String(criticalDetails.length), criticalDetails.length ? `ลุ่มน้ำ${criticalDetails[0].detail.name} · ${detailStationRecords(criticalDetails[0].detail).length} จุดเข้าเกณฑ์` : "ไม่พบลุ่มน้ำวิกฤต"],
      [String(allAlertStations.length), `จาก 180 สถานีทั่วประเทศ`],
      [String(allAlertSensors.length), `น้ำท่า ${flowCount} · ฝนสะสม 24 ชม. ${rainCount} จุด`]
    ];
    overviewSummaryCards.slice(0,3).forEach((card,index) => {
      const value = $("strong",card), note = $("small",card);
      if (value) value.textContent = overviewSummaryValues[index][0];
      if (note) note.textContent = overviewSummaryValues[index][1];
    });

    $$(".scope-switch button").forEach(button => button.addEventListener("click", () => {
      $$(".scope-switch button").forEach(item => item.classList.toggle("active", item === button));
    }));

    const applyFilters = () => {
      const query = (search?.value || "").trim().toLowerCase();
      const selectedBasin = select?.value || "all";
      let visible = 0;
      const visiblePoints = { red:0, orange:0, yellow:0 };
      cards.forEach(card => {
        const severityMatch = activeSeverity === "all" || card.dataset.severity === activeSeverity;
        const basinMatch = selectedBasin === "all" || card.dataset.basin === selectedBasin;
        const searchMatch = !query || (card.dataset.search || "").toLowerCase().includes(query);
        card.hidden = !(severityMatch && basinMatch && searchMatch);
        if (!card.hidden) {
          visible += 1;
          detailStationRecords(basinDrilldowns[card.dataset.basin]).forEach(station => { visiblePoints[station.severity] += 1; });
        }
      });
      const pointTotal = Object.values(visiblePoints).reduce((sum, count) => sum + count, 0);
      const result = $("#resultCount");
      if (result) result.textContent = `แสดง ${visible} ลุ่มน้ำที่เกินเกณฑ์`;
      const chartSelection = $("#chartSelection");
      if (chartSelection) chartSelection.textContent = `กำลังแสดง ${visible} ลุ่มน้ำ · ${pointTotal} จุดเข้าเกณฑ์`;
      const activePointTotal = $("#activePointTotal");
      if (activePointTotal) activePointTotal.innerHTML = `${pointTotal} <small>จุด</small>`;
      const thresholdSegments = $$(".threshold-bar i");
      [visiblePoints.red, visiblePoints.orange, visiblePoints.yellow].forEach((count,index) => {
        if (thresholdSegments[index]) thresholdSegments[index].style.width = `${pointTotal ? (count / pointTotal) * 100 : 0}%`;
      });
      $$(".threshold-legend b").forEach((node,index) => {
        node.textContent = [visiblePoints.red, visiblePoints.orange, visiblePoints.yellow][index];
      });
      const thresholdBar = $(".threshold-bar");
      if (thresholdBar) thresholdBar.setAttribute("aria-label", `จุดเข้าเกณฑ์ทั้งหมด ${pointTotal} จุด ต้องอพยพ ${visiblePoints.red} จุด อพยพ ${visiblePoints.orange} จุด เฝ้าระวัง ${visiblePoints.yellow} จุด`);
      if (typeof window.filterMapBasins === "function") window.filterMapBasins(activeSeverity, selectedBasin);
    };

    filters.forEach(button => button.addEventListener("click", () => {
      activeSeverity = button.dataset.severity;
      filters.forEach(item => item.classList.toggle("active", item === button));
      applyFilters();
    }));
    search?.addEventListener("input", applyFilters);
    select?.addEventListener("change", applyFilters);
    $$("[data-open-basin]").forEach(button => button.addEventListener("click", () => {
      const basin = button.dataset.openBasin;
      window.location.href = `basin.html?basin=${encodeURIComponent(basin)}`;
    }));
    $("#refreshBtn")?.addEventListener("click", event => flashRefresh(event.currentTarget));
    applyFilters();
  }

  function initBasinDetail() {
    const drawer = $("#cameraDrawer");
    const backdrop = $("#drawerBackdrop");
    const stationTitle = $("#drawerStation");
    const stationLocation = $("#drawerLocation");
    const detail = basinDrilldowns[selectedBasinCode] || basinDrilldowns["09"];
    const stationRecords = detailStationRecords(detail);
    const severityOrder = { red:5, orange:4, yellow:3, blue:2, green:1 };
    const severityLabels = { red:"ต้องอพยพ", orange:"อพยพ", yellow:"เตรียมรับมือ", blue:"เฝ้าระวัง", green:"ติดตาม" };
    const summarySeverities = ["red","orange","yellow","blue","green"];
    const riskSeverities = ["red","orange","yellow"];
    const followSeverities = ["blue","green"];
    let activeProvince = "all";
    let activeCriteria = "all";
    let activeSensorType = "flow";
    const tableSortState = {
      risk:{key:"severity",direction:"desc"},
      summary:{key:"code",direction:"asc"}
    };
    const provinceOf = item => item.province || (item.area || "").replace("จังหวัด", "").replace(/^(ต้นน้ำ|กลางน้ำ|ท้ายน้ำ)\s*·\s*/, "").trim();
    const matchesFilters = item => (activeProvince === "all" || provinceOf(item) === activeProvince) && (activeCriteria === "all" || item.severity === activeCriteria);
    const normalizeCode = code => String(code || "").replace(/-/g, "").toUpperCase();
    document.title = `รายละเอียดลุ่มน้ำ${detail.name} — DDPM CCTV Mockup`;
    const mapTitle = $(".map-title-card b"); if (mapTitle) mapTitle.textContent = `ลุ่มน้ำ${detail.name}`;
    const breadcrumbName = $(".breadcrumb b"); if (breadcrumbName) breadcrumbName.textContent = `ลุ่มน้ำ${detail.name}`;
    const title = $(".basin-title-row h1"); if (title) title.textContent = `ลุ่มน้ำ${detail.name}`;
    const mapPane = $(".map-pane"); if (mapPane) mapPane.setAttribute("aria-label", `แผนที่สถานีในลุ่มน้ำ${detail.name}`);
    const provinceLine = $(".province-line"); if (provinceLine) provinceLine.textContent = `ติดตั้งใน ${detail.provinces.length} จังหวัด · ${detail.provinces.join(" ")}`;
    const provinceChips = $(".province-chips");
    if (provinceChips) provinceChips.innerHTML = `<button class="active" type="button" data-province="all">ทุกจังหวัด</button>${detail.provinces.map(name => `<button type="button" data-province="${name}">${name}</button>`).join("")}`;

    const stationRows = $("#basinStationRows");
    const basinAllStationRows = $("#basinAllStationRows");
    const allStationsDrawer = $("#allStationsDrawer");
    const allStationsBackdrop = $("#allStationsBackdrop");
    const allStationRows = $("#allStationRows");
    const sensorTableRows = $("#sensorTableRows");
    let latestRankedStations = [];
    const stationLocationText = station => [
      station.subdistrict && station.subdistrict !== "—" ? `ต.${station.subdistrict}` : "",
      station.district && station.district !== "—" ? `อ.${station.district}` : "",
      station.province ? `จ.${station.province}` : ""
    ].filter(Boolean).join(" · ");
    const stationRowMarkup = (station, index, includeTools = true) => {
      const level = Number(station.level);
      const difference = stationExcess(station);
      const direction = Number(station.trend) > 0 ? "↑" : Number(station.trend) < 0 ? "↓" : "−";
      const location = stationLocationText(station);
      const tools = includeTools ? `<td><div class="station-tools"><button class="station-tool" type="button" data-station-action="history" data-station-code="${station.code}" title="กราฟระดับน้ำย้อนหลัง" aria-label="กราฟระดับน้ำย้อนหลัง ${station.code}">⌁</button><button class="station-tool" type="button" data-station-action="analysis" data-station-code="${station.code}" title="ผลวิเคราะห์ระดับน้ำ" aria-label="ผลวิเคราะห์ระดับน้ำ ${station.code}">▣</button></div></td>` : "";
      return `<tr data-focus-station="${station.code}" tabindex="0" role="button" aria-label="เลื่อนไปยัง ${station.code} บนแผนที่"><td>${index + 1}</td><td><b>${station.code} · ${station.name}</b><small>${location}</small></td><td><span class="basin-water-value ${station.severity}">${level.toFixed(2)} ม.</span></td><td><b class="difference-value ${station.severity}">+${difference.toFixed(2)} ม.</b></td><td><span class="trend-value ${station.severity}">${direction} ${Math.abs(Number(station.trend)).toFixed(2)} ม./ชม.</span></td><td><span class="station-status ${station.severity}">${severityLabels[station.severity]}</span></td>${tools}</tr>`;
    };
    const fullStationRowMarkup = (station,index) => {
      const level = Number(station.level);
      const bank = stationBank(station);
      const difference = stationExcess(station);
      const direction = Number(station.trend) > 0 ? "↑" : Number(station.trend) < 0 ? "↓" : "−";
      return `<tr data-focus-station="${station.code}" tabindex="0" role="button" aria-label="เลื่อนไปยัง ${station.code} บนแผนที่"><td>${index + 1}</td><td><b>${station.code} · ${station.name}</b><small>${stationLocationText(station)}</small></td><td><span class="basin-water-value ${station.severity}">${level.toFixed(2)} ม.</span></td><td><span class="bank-value">${bank.toFixed(2)} ม.</span></td><td><b class="difference-value ${station.severity}">+${difference.toFixed(2)} ม.</b></td><td><span class="trend-value ${station.severity}">${direction} ${Math.abs(Number(station.trend)).toFixed(2)} ม./ชม.</span></td><td><span class="station-status ${station.severity}">${severityLabels[station.severity] || station.statusLabel || "—"}</span></td><td><time>28/08/2569 10:40 น.</time></td><td><div class="station-tools"><button class="station-tool" type="button" data-station-action="history" data-station-code="${station.code}" title="กราฟระดับน้ำย้อนหลัง" aria-label="กราฟระดับน้ำย้อนหลัง ${station.code}">⌁</button><button class="station-tool" type="button" data-station-action="analysis" data-station-code="${station.code}" title="ผลวิเคราะห์ระดับน้ำ" aria-label="ผลวิเคราะห์ระดับน้ำ ${station.code}">▣</button></div></td></tr>`;
    };
    const topRiskRowMarkup = (station,index) => fullStationRowMarkup(station,index);
    const sortStationsForTable = (stations, state) => {
      const direction = state.direction === "asc" ? 1 : -1;
      const numericValue = (station, key) => key === "bank" ? stationBank(station) : key === "excess" ? stationExcess(station) : Number(station[key]);
      return [...stations].sort((a,b) => {
        let comparison = 0;
        if (state.key === "code") comparison = String(a.province || "").localeCompare(String(b.province || ""),"th") || String(a.code || "").localeCompare(String(b.code || ""),"en",{numeric:true});
        else if (state.key === "severity") {
          comparison = severityOrder[a.severity] - severityOrder[b.severity];
          if (comparison === 0) comparison = stationExcess(a) - stationExcess(b);
        }
        else comparison = numericValue(a,state.key) - numericValue(b,state.key);
        if (comparison !== 0) return comparison * direction;
        return String(a.code || "").localeCompare(String(b.code || ""),"en",{numeric:true});
      });
    };
    const renderAllStations = () => {
      if (allStationRows) allStationRows.innerHTML = latestRankedStations.length
        ? latestRankedStations.map((station,index) => stationRowMarkup(station,index,false)).join("")
        : `<tr><td colspan="6"><div class="empty-state">ไม่พบสถานีตามตัวกรองที่เลือก</div></td></tr>`;
      const summary = $("#allStationSummary");
      if (summary) summary.textContent = `${latestRankedStations.length} จุด · เรียงตามระดับความเสี่ยงและค่าที่เกินเกณฑ์`;
    };
    const render = () => {
      const visibleStations = stationRecords.filter(matchesFilters);
      const rankedStations = rankStations(visibleStations);
      const riskRankedStations = rankStations(visibleStations.filter(station => riskSeverities.includes(station.severity)));
      const topStations = sortStationsForTable(riskRankedStations,tableSortState.risk);
      const summaryStations = sortStationsForTable(
        visibleStations.filter(station => followSeverities.includes(station.severity)),
        tableSortState.summary
      );
      latestRankedStations = rankedStations;
      const visibleSensors = (detail.sensors || []).filter(matchesFilters);
      const visibleCctv = (detail.cctv || []).filter(matchesFilters);
      const highestByType = ["flow", "rain"].map(type => visibleSensors.filter(item => item.type === type).sort((a,b) => Number.parseFloat(b.value) - Number.parseFloat(a.value))[0]).filter(Boolean);
      const visibleSeverities = [...new Set([...visibleStations, ...visibleSensors, ...visibleCctv].map(item => item.severity))].sort((a,b) => severityOrder[b] - severityOrder[a]);

      const statusSet = $("#basinStatusSet");
      if (statusSet) statusSet.innerHTML = visibleSeverities.length
        ? visibleSeverities.map(severity => `<span class="status-badge ${severity}">${severityLabels[severity]}</span>`).join("")
        : `<span class="status-badge normal">ไม่พบข้อมูลตามตัวกรอง</span>`;

      const stationCounts = summarySeverities.reduce((counts,severity) => {
        counts[severity] = visibleStations.filter(item => item.severity === severity).length;
        return counts;
      },{});
      const highestStationSeverity = riskSeverities.find(severity => stationCounts[severity] > 0);
      const highestStation = riskRankedStations[0];
      const fastestStation = [...visibleStations].sort((a,b) => Number(b.trend) - Number(a.trend))[0];
      const highPeakValue = $("#summaryHighPeakValue");
      const highPeakNote = $("#summaryHighPeakNote");
      const summaryStationTotal = $("#summaryStationTotal");
      const summaryStationBreakdown = $("#summaryStationBreakdown");
      const summaryTrendValue = $("#summaryTrendValue");
      const summaryTrendNote = $("#summaryTrendNote");
      if (highPeakValue) highPeakValue.textContent = highestStation ? `${Number(highestStation.level).toFixed(2)} ม.` : "—";
      if (highPeakNote) highPeakNote.textContent = highestStation ? `${highestStation.code} · เกินเกณฑ์ +${stationExcess(highestStation).toFixed(2)} ม.` : "ไม่พบข้อมูลตามตัวกรอง";
      if (summaryStationTotal) summaryStationTotal.textContent = `${visibleStations.length} จุด`;
      if (summaryStationBreakdown) summaryStationBreakdown.innerHTML = summarySeverities.map(severity => `<span class="${severity}"><i></i>${severityLabels[severity]} ${stationCounts[severity]}</span>`).join("");
      if (summaryTrendValue) summaryTrendValue.textContent = fastestStation ? `${Number(fastestStation.trend) >= 0 ? "+" : ""}${Number(fastestStation.trend).toFixed(2)} ม./ชม.` : "—";
      if (summaryTrendNote) summaryTrendNote.textContent = fastestStation ? `${fastestStation.code} · ${fastestStation.name}` : "ไม่พบข้อมูลตามตัวกรอง";
      const topRiskHeadline = $("#topRiskHeadline");
      if (topRiskHeadline) topRiskHeadline.innerHTML = highestStationSeverity
        ? `<i class="filter-dot ${highestStationSeverity}"></i>${severityLabels[highestStationSeverity]} ${stationCounts[highestStationSeverity]} จุด <small>· แสดงครบ ${topStations.length} สถานี</small>`
        : `ไม่พบ CCTV ตามตัวกรอง <small>· แสดง 0 สถานี</small>`;
      const riskSummary = $("#riskSummary");
      if (riskSummary) riskSummary.innerHTML = riskSeverities.map(severity => `<span class="${severity}"><i></i>${severityLabels[severity]} <b>${stationCounts[severity]}</b></span>`).join("");
      const topRiskScope = $("#topRiskScope");
      if (topRiskScope) topRiskScope.textContent = `${activeProvince === "all" ? "ทุกจังหวัด" : `จังหวัด${activeProvince}`} · ${topStations.length} สถานีความเสี่ยงสูง`;

      const sensorAlertCount = $("#sensorAlertCount");
      if (sensorAlertCount) sensorAlertCount.textContent = `${highestByType.length} รายการสูงสุด`;
      const sensorAlertCards = $("#sensorAlertCards");
      if (sensorAlertCards) sensorAlertCards.innerHTML = highestByType.length ? highestByType.map(sensor => {
        const label = sensor.type === "rain" ? "ปริมาณฝน 24 ชั่วโมงสูงสุด" : "ระดับน้ำท่าปัจจุบันสูงสุด";
        const icon = sensor.type === "rain" ? `<img class="sensor-alert-rain-icon" src="${RAIN_SENSOR_ICON}" alt="">` : `<i class="sensor-alert-icon flow ${sensor.severity}" aria-hidden="true"></i>`;
        return `<article class="sensor-alert-card ${sensor.type} ${sensor.severity}">${icon}<span class="sensor-alert-copy"><small>${label} · ${sensor.code}</small><b>${sensor.name}</b><em>${sensor.criterion}</em></span><span class="sensor-alert-reading"><b>${sensor.value}</b><small>${sensor.area}</small></span></article>`;
      }).join("") : `<div class="empty-state">ไม่พบ Sensor ที่เข้าเกณฑ์ในจังหวัดและระดับสถานการณ์ที่เลือก</div>`;

      const selectedSensors = visibleSensors.filter(sensor => sensor.type === activeSensorType).sort((a,b) => (severityOrder[b.severity] - severityOrder[a.severity]) || (Number.parseFloat(b.value) - Number.parseFloat(a.value)));
      const sensorTableHead = $("#sensorTableHead");
      if (sensorTableHead) sensorTableHead.innerHTML = activeSensorType === "rain"
        ? `<tr><th>ลำดับ</th><th>ชื่อสถานี / ที่ตั้ง</th><th>หน่วยงาน</th><th>เวลาล่าสุด</th><th>ฝนสะสม 24 ชม.</th></tr>`
        : `<tr><th>ลำดับ</th><th>ชื่อสถานี / ที่ตั้ง</th><th>หน่วยงาน</th><th>เวลาล่าสุด</th><th>ระดับน้ำ</th><th>ระดับตลิ่ง</th></tr>`;
      const sensorTableCount = $("#sensorTableCount");
      if (sensorTableCount) sensorTableCount.textContent = `${selectedSensors.length} สถานี`;
      if (sensorTableRows) sensorTableRows.innerHTML = selectedSensors.length ? selectedSensors.map((sensor,index) => {
        const threshold = sensor.criterion.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:ม\.|มม\.)/i)?.[1] || "—";
        const stationCell = `<td><b>${sensor.code} · ${sensor.name}</b><small>${sensor.area}</small></td>`;
        const common = `<td>${index + 1}</td>${stationCell}<td>กรมทรัพยากรน้ำ</td><td><time>01/09/2569 ${String(9 + Math.floor(index / 3)).padStart(2,"0")}:${String(index * 7 % 60).padStart(2,"0")} น.</time></td>`;
        return activeSensorType === "rain"
          ? `<tr>${common}<td><span class="sensor-reading ${sensor.severity}">${Number.parseFloat(sensor.value).toFixed(0)} มม.</span></td></tr>`
          : `<tr>${common}<td><span class="sensor-reading ${sensor.severity}">${Number.parseFloat(sensor.value).toFixed(2)} ม.</span></td><td><span class="bank-value">${threshold === "—" ? threshold : Number(threshold).toFixed(2) + " ม."}</span></td></tr>`;
      }).join("") : `<tr><td colspan="${activeSensorType === "rain" ? 5 : 6}"><div class="empty-state">ไม่พบ Sensor ประเภทนี้ตามตัวกรองที่เลือก</div></td></tr>`;

      const stationNote = $("#basinStationNote");
      if (stationNote) stationNote.textContent = `แสดง ${topStations.length} จุด เฉพาะ 3 ระดับเร่งด่วนตามตัวกรอง · เรียงระดับความเสี่ยงและค่าที่เกินเกณฑ์จากมากไปน้อย`;
      if (stationRows) stationRows.innerHTML = topStations.length
        ? topStations.map((station,index) => topRiskRowMarkup(station,index)).join("")
        : `<tr><td colspan="9"><div class="empty-state">ไม่พบสถานีตามตัวกรองที่เลือก</div></td></tr>`;
      const basinAllStationCount = $("#basinAllStationCount");
      if (basinAllStationCount) basinAllStationCount.textContent = `${summaryStations.length} จุด`;
      const stationSummaryBreakdown = $("#stationSummaryBreakdown");
      if (stationSummaryBreakdown) stationSummaryBreakdown.textContent = `เฉพาะเฝ้าระวังและติดตาม · ${activeProvince === "all" ? "ทุกจังหวัด" : `จังหวัด${activeProvince}`}`;
      const stationSummaryRisk = $("#stationSummaryRisk");
      if (stationSummaryRisk) stationSummaryRisk.innerHTML = followSeverities.map(severity => `<span class="${severity}"><i></i>${severityLabels[severity]} <b>${stationCounts[severity]}</b></span>`).join("");
      if (basinAllStationRows) basinAllStationRows.innerHTML = summaryStations.length
        ? summaryStations.map((station,index) => fullStationRowMarkup(station,index)).join("")
        : `<tr><td colspan="9"><div class="empty-state">ไม่พบสถานีตามตัวกรองที่เลือก</div></td></tr>`;
      $$('[data-table-sort]').forEach(button => {
        const state = tableSortState[button.dataset.tableSort];
        const active = state?.key === button.dataset.sortKey;
        button.classList.toggle("active", active);
        button.classList.toggle("asc", active && state.direction === "asc");
        button.classList.toggle("desc", active && state.direction === "desc");
        button.setAttribute("aria-pressed", String(active));
      });
      renderAllStations();

      const legend = $("#basinLegendItems");
      if (legend) {
        const cctvLegend = visibleSeverities.filter(severity => visibleCctv.some(item => item.severity === severity)).map(severity => `<span class="cctv-legend"><img src="${cctvMarkerUrl(severity)}" alt="">กล้อง CCTV · ${severityLabels[severity]}</span>`);
        const stationLegend = (detail.cctv || []).length ? [] : visibleSeverities.filter(severity => visibleStations.some(item => item.severity === severity)).map(severity => `<span><i class="station-symbol ${severity}"></i>สถานีระดับน้ำ · ${severityLabels[severity]}</span>`);
        const sensorLegend = highestByType.map(sensor => sensor.type === "rain"
          ? `<span><img class="sensor-rain-legend-icon" src="${RAIN_SENSOR_ICON}" alt="">Sensor น้ำฝน</span>`
          : `<span><i class="sensor-map-symbol flow ${sensor.severity}"></i>Sensor น้ำท่า · ${severityLabels[sensor.severity]}</span>`);
        legend.innerHTML = [...cctvLegend, ...stationLegend, ...sensorLegend, `<span><i class="province-boundary-symbol"></i>ขอบเขตจังหวัดในลุ่มน้ำ</span>`, `<span><i class="stream-symbol main"></i>แม่น้ำสายหลัก DWR</span>`].join("");
      }

      window.basinFilterState = { criteria:activeCriteria, province:activeProvince };
      $$('[data-map-filterable="true"]').forEach(element => {
        const criteriaMatch = activeCriteria === "all" || element.dataset.severity === activeCriteria;
        const provinceMatch = activeProvince === "all" || element.dataset.province === activeProvince;
        element.style.display = criteriaMatch && provinceMatch ? "" : "none";
      });
      if (typeof window.filterBasinMap === "function") window.filterBasinMap(activeCriteria, activeProvince);
    };

    const openDrawer = (id, mode = "camera") => {
      if (!drawer || !backdrop) return;
      const station = stationRecords.find(item => normalizeCode(item.code) === normalizeCode(id));
      const camera = (detail.cctv || []).find(item => normalizeCode(item.code) === normalizeCode(id));
      const record = station || { code:id, name:`กล้อง CCTV ${id}`, area:`จังหวัด${camera?.province || detail.provinces[0]}`, province:camera?.province || detail.provinces[0], district:"เมืองน่าน", subdistrict:"ในเวียง", level:"4.16", bank:"4.70", trend:"+0.08", severity:camera?.severity || "yellow" };
      const recordIndex = Math.max(0, stationRecords.findIndex(item => normalizeCode(item.code) === normalizeCode(record.code)));
      const previous = stationRecords[recordIndex - 1];
      const next = stationRecords[recordIndex + 1];
      if (stationTitle) stationTitle.textContent = `${record.code} - ${record.name}`;
      const previousStation = $("#drawerPreviousStation");
      const nextStation = $("#drawerNextStation");
      if (previousStation) { previousStation.innerHTML = previous ? `<i></i>${previous.code} - ${previous.name}` : "ไม่มีรายการก่อนหน้า"; previousStation.dataset.stationCode = previous?.code || ""; }
      if (nextStation) { nextStation.innerHTML = next ? `<i></i>${next.code} - ${next.name}` : "ไม่มีรายการถัดไป"; nextStation.dataset.stationCode = next?.code || ""; }
      const stationHeading = $("#drawerStationHeading");
      if (stationHeading) stationHeading.textContent = `${record.code} - ${record.name} ต.${record.subdistrict || "—"} อ.${record.district || "—"} จ.${record.province || provinceOf(record)}`;
      const waterValue = $("#drawerWater"); if (waterValue) waterValue.textContent = `${Number(record.level).toFixed(2)} ม.`;
      const bank = Number(record.bank || (Number(record.level) - (record.severity === "red" ? .62 : record.severity === "orange" ? .38 : .22)));
      const bankValue = $("#drawerBank"); if (bankValue) bankValue.textContent = `${bank.toFixed(2)} ม.`;
      const elevationBase = record.code === "NAN10" ? 709.77 : record.code === "NAN07" ? 194.58 : 346 - recordIndex * 12.5;
      const waterMsl = $("#drawerWaterMsl"); if (waterMsl) waterMsl.textContent = `(${(elevationBase + Number(record.level)).toFixed(2)} ม.รทก.)`;
      const bankMsl = $("#drawerBankMsl"); if (bankMsl) bankMsl.textContent = `(${(elevationBase + bank).toFixed(2)} ม.รทก.)`;
      if (stationLocation) stationLocation.textContent = `ต.${record.subdistrict || "—"} อ.${record.district || "—"} จ.${record.province || provinceOf(record)}`;
      const coordinates = $("#drawerCoordinates"); if (coordinates) coordinates.textContent = record.coordinate ? `${record.coordinate[1].toFixed(6)}, ${record.coordinate[0].toFixed(6)}` : "—";
      const cameraLabel = $("#drawerCameraLabel"); if (cameraLabel) cameraLabel.textContent = `${record.code} · ภาพตัวอย่างจากกล้อง CCTV`;
      const updatedText = record.code === "NAN10" ? "28/08/2569 13:50" : record.code === "NAN07" ? "28/08/2569 13:49" : "28/08/2569 13:48";
      const updated = $("#drawerUpdated"); if (updated) updated.textContent = updatedText;
      const updatedCopy = $("#drawerUpdatedCopy"); if (updatedCopy) updatedCopy.textContent = updatedText;
      const cameraImage = $("#drawerCameraImage");
      if (cameraImage) {
        const variants = [
          {src:"assets/cctv-nan01-reference.png",crop:"nan01"},
          {src:"assets/cctv-nan07-reference.png",crop:"nan07"},
          {src:"assets/cctv-nan10-reference.png",crop:"nan10"}
        ];
        const variant = record.code === "NAN07" ? variants[1] : record.code === "NAN10" ? variants[2] : variants[recordIndex % variants.length];
        cameraImage.src = variant.src;
        cameraImage.dataset.crop = variant.crop;
        cameraImage.alt = `ภาพตัวอย่างจากกล้อง ${record.code}`;
      }
      const difference = Number(record.level) - bank;
      const warning = $("#drawerWarning");
      if (warning) {
        warning.hidden = !(bank > Number(record.level) && bank - Number(record.level) <= 1);
        warning.textContent = `⚠ ขณะนี้ระดับน้ำเข้าใกล้ระดับตลิ่ง ระดับน้ำต่ำกว่าตลิ่ง ${(bank - Number(record.level)).toFixed(2)} เมตร`;
      }
      const analysisStatus = $("#analysisStatus");
      const analysisCopy = $("#analysisCopy");
      if (analysisStatus) { analysisStatus.textContent = difference >= 0 ? `สูงกว่าระดับตลิ่ง ${difference.toFixed(2)} เมตร` : `ต่ำกว่าระดับตลิ่ง ${Math.abs(difference).toFixed(2)} เมตร`; analysisStatus.className = `${record.severity}-text`; }
      if (analysisCopy) analysisCopy.textContent = difference >= 0 ? `ระดับน้ำของ ${record.code} อยู่เหนือระดับตลิ่งและมีแนวโน้มเพิ่มขึ้น ควรติดตามข้อมูลสถานีและภาพจากกล้องอย่างต่อเนื่อง` : `ระดับน้ำของ ${record.code} ยังต่ำกว่าระดับตลิ่ง แต่ควรติดตามแนวโน้มและค่าตรวจวัดรอบถัดไป`;
      drawer.classList.add("open");
      backdrop.classList.add("open");
      drawer.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      const historyPanel = $(".mini-chart", drawer);
      const analysisPanel = $("#drawerAnalysis", drawer);
      if (historyPanel) historyPanel.hidden = mode !== "history";
      if (analysisPanel) analysisPanel.hidden = mode !== "analysis";
      drawer.scrollTop = 0;
      if (mode !== "camera") window.setTimeout(() => (mode === "analysis" ? analysisPanel : historyPanel)?.scrollIntoView({block:"center"}), 80);
    };
    const closeDrawer = () => {
      drawer?.classList.remove("open");
      backdrop?.classList.remove("open");
      drawer?.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };
    const openAllStations = () => {
      renderAllStations();
      allStationsDrawer?.classList.add("open");
      allStationsBackdrop?.classList.add("open");
      allStationsDrawer?.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };
    const closeAllStations = () => {
      allStationsDrawer?.classList.remove("open");
      allStationsBackdrop?.classList.remove("open");
      allStationsDrawer?.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };
    const focusAllStationRow = row => {
      if (!row) return;
      closeAllStations();
      window.focusBasinStation?.(row.dataset.focusStation);
    };
    stationRows?.addEventListener("click", event => {
      const action = event.target.closest("[data-station-action]");
      if (action) { event.stopPropagation(); openDrawer(action.dataset.stationCode, action.dataset.stationAction); return; }
      const row = event.target.closest("[data-focus-station]");
      if (row) window.focusBasinStation?.(row.dataset.focusStation);
    });
    stationRows?.addEventListener("keydown", event => {
      const row = event.target.closest("[data-focus-station]");
      if (row && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); window.focusBasinStation?.(row.dataset.focusStation); }
    });
    basinAllStationRows?.addEventListener("click", event => {
      const action = event.target.closest("[data-station-action]");
      if (action) { event.stopPropagation(); openDrawer(action.dataset.stationCode, action.dataset.stationAction); return; }
      const row = event.target.closest("[data-focus-station]");
      if (row) window.focusBasinStation?.(row.dataset.focusStation);
    });
    basinAllStationRows?.addEventListener("keydown", event => {
      const row = event.target.closest("[data-focus-station]");
      if (row && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); window.focusBasinStation?.(row.dataset.focusStation); }
    });
    allStationRows?.addEventListener("click", event => focusAllStationRow(event.target.closest("[data-focus-station]")));
    allStationRows?.addEventListener("keydown", event => {
      const row = event.target.closest("[data-focus-station]");
      if (row && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); focusAllStationRow(row); }
    });
    document.addEventListener("station-popup-request", event => openDrawer(event.detail?.code));
    [$("#drawerPreviousStation"), $("#drawerNextStation")].forEach(node => node?.addEventListener("click", () => {
      if (node.dataset.stationCode) openDrawer(node.dataset.stationCode);
    }));
    $$(".drawer-camera-tabs button").forEach(button => button.addEventListener("click", () => {
      $$(".drawer-camera-tabs button").forEach(item => item.classList.toggle("active", item === button));
    }));
    $("#closeDrawer")?.addEventListener("click", closeDrawer);
    backdrop?.addEventListener("click", closeDrawer);
    $("#openAllStations")?.addEventListener("click", openAllStations);
    $("#closeAllStations")?.addEventListener("click", closeAllStations);
    allStationsBackdrop?.addEventListener("click", closeAllStations);
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") { closeDrawer(); closeAllStations(); }
    });
    $$(".province-chips button").forEach(button => button.addEventListener("click", () => {
      activeProvince = button.dataset.province;
      $$(".province-chips button").forEach(item => item.classList.toggle("active", item === button));
      render();
    }));
    $$("#criteriaFilter [data-criteria]").forEach(button => button.addEventListener("click", () => {
      activeCriteria = button.dataset.criteria;
      $$("#criteriaFilter [data-criteria]").forEach(item => item.classList.toggle("active", item === button));
      render();
    }));
    $$("#sensorTableTabs [data-sensor-table]").forEach(button => button.addEventListener("click", () => {
      activeSensorType = button.dataset.sensorTable;
      $$("#sensorTableTabs [data-sensor-table]").forEach(item => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-selected", String(active));
      });
      render();
    }));
    $$('[data-table-sort]').forEach(button => button.addEventListener("click", () => {
      const state = tableSortState[button.dataset.tableSort];
      if (!state) return;
      if (state.key === button.dataset.sortKey) state.direction = state.direction === "asc" ? "desc" : "asc";
      else {
        state.key = button.dataset.sortKey;
        state.direction = state.key === "code" ? "asc" : "desc";
      }
      render();
    }));
    const legendPanel = $("#basinLegend");
    const legendToggle = $("#basinLegendToggle");
    const setLegendCollapsed = collapsed => {
      legendPanel?.classList.toggle("collapsed", collapsed);
      legendToggle?.setAttribute("aria-expanded", String(!collapsed));
      const indicator = $("span", legendToggle);
      if (indicator) indicator.textContent = collapsed ? "+" : "−";
      try { window.localStorage.setItem("basinLegendCollapsed", collapsed ? "1" : "0"); } catch (_) {}
    };
    let savedLegendState = false;
    try { savedLegendState = window.localStorage.getItem("basinLegendCollapsed") === "1"; } catch (_) {}
    setLegendCollapsed(savedLegendState);
    legendToggle?.addEventListener("click", () => setLegendCollapsed(!legendPanel.classList.contains("collapsed")));
    render();
  }

  function initMonitor() {
    const stations = window.MONITOR_STATIONS || [];
    const metadata = window.MONITOR_META || {source:"Daily Report CCTV"};
    const regionOrder = ["ภาคเหนือ","ภาคกลาง","ภาคตะวันออกเฉียงเหนือ","ภาคตะวันออก","ภาคใต้"];
    const thresholdOrder = ["normal","watch","prepare","evacuate","critical","nodata"];
    const thresholdMeta = {
      normal:{label:"อุปกรณ์ปกติสมบูรณ์",color:"#32d89a"}, watch:{label:"เฝ้าระวังอย่างใกล้ชิด",color:"#4aa8ed"},
      prepare:{label:"เตรียมพร้อมรับมือสถานการณ์",color:"#f4bd2a"}, evacuate:{label:"ให้อพยพและปฏิบัติตามเกณฑ์กำหนด",color:"#ed8b2f"},
      critical:{label:"ต้องอพยพและปฏิบัติตามข้อสั่งการ",color:"#ef4b55"}, nodata:{label:"ยังไม่มีข้อมูล",color:"#747986"}
    };
    const regionMeta = {
      "ภาคเหนือ":"#5267f5", "ภาคกลาง":"#32d89a", "ภาคตะวันออกเฉียงเหนือ":"#f4bd2a",
      "ภาคตะวันออก":"#ed8b2f", "ภาคใต้":"#9b6fe8"
    };
    let activeMode = "threshold";
    let activeRegion = "all";
    let activeProvince = "all";
    let visibleStations = [];
    const search = $("#monitorSearch");
    const status = $("#deviceStatus");
    const regionSelect = $("#monitorRegion");
    const provinceSelect = $("#monitorProvince");
    const tableBody = $("#deviceTable");
    const escapeHtml = value => String(value ?? "").replace(/[&<>\"]/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[character]);
    const countBy = (items, key) => items.reduce((counts,item) => ((counts[item[key]] = (counts[item[key]] || 0) + 1),counts),{});
    const baseStations = () => stations;

    const refreshProvinceOptions = () => {
      const provinces = [...new Set(stations.filter(item => activeRegion === "all" || item.region === activeRegion).map(item => item.province))].sort((a,b) => a.localeCompare(b,"th"));
      provinceSelect.innerHTML = `<option value="all">ทุกจังหวัด</option>${provinces.map(province => `<option value="${escapeHtml(province)}">${escapeHtml(province)}</option>`).join("")}`;
      if (!provinces.includes(activeProvince)) activeProvince = "all";
      provinceSelect.value = activeProvince;
    };

    const renderOverview = () => {
      const isRegionMode = activeMode === "region";
      const scope = isRegionMode ? baseStations() : baseStations().filter(item => (activeRegion === "all" || item.region === activeRegion) && (activeProvince === "all" || item.province === activeProvince));
      const summaryOrder = isRegionMode ? regionOrder : thresholdOrder;
      const summaryMeta = isRegionMode
        ? Object.fromEntries(regionOrder.map(region => [region,{label:region,color:regionMeta[region]}]))
        : thresholdMeta;
      const summaryCounts = countBy(scope,isRegionMode ? "region" : "alertLevel");
      const maxSummaryCount = Math.max(1,...summaryOrder.map(level => summaryCounts[level] || 0));
      const donut = $("#monitorRegionDonut");
      if (donut) {
        donut.classList.remove("monitor-vertical-bars");
        donut.classList.toggle("monitor-horizontal-bars",isRegionMode);
        if (isRegionMode) {
          donut.style.background = "none";
          donut.innerHTML = summaryOrder.map(level => {
            const count = summaryCounts[level] || 0;
            return `<button type="button" data-region-summary="${escapeHtml(level)}" aria-pressed="${activeRegion === level}" class="monitor-horizontal-bar ${activeRegion === level ? "active" : ""}" title="${escapeHtml(summaryMeta[level].label)} ${count} สถานี"><span>${escapeHtml(level.replace("ภาค",""))}</span><i><em style="--bar-width:${(count / maxSummaryCount * 100).toFixed(1)}%;--bar-color:${summaryMeta[level].color}"><b>${count}</b></em></i></button>`;
          }).join("");
        } else {
          const total = scope.length || 1;
          let cumulative = 0;
          const segments = summaryOrder.map(level => {
            const start = cumulative;
            cumulative += (summaryCounts[level] || 0) / total * 100;
            return `${summaryMeta[level].color} ${start.toFixed(2)}% ${cumulative.toFixed(2)}%`;
          });
          donut.style.background = `conic-gradient(${segments.join(",")})`;
          donut.innerHTML = `<div><b>${scope.length}</b><span>สถานีทั้งหมด</span></div>`;
        }
      }
      const regionList = $("#monitorRegionList");
      if (regionList) regionList.innerHTML = summaryOrder.map(level => isRegionMode
        ? `<button type="button" data-region-summary="${escapeHtml(level)}" aria-pressed="${activeRegion === level}" class="region-summary-row ${activeRegion === level ? "active" : ""}"><i style="background:${summaryMeta[level].color}"></i><span>${summaryMeta[level].label}</span><strong>${summaryCounts[level] || 0} สถานี <small>${new Set(stations.filter(item => item.region === level).map(item => item.province)).size} จังหวัด</small></strong></button>`
        : `<div><i style="background:${summaryMeta[level].color}"></i><span>${summaryMeta[level].label}</span><b>${summaryCounts[level] || 0}</b><small>สถานี</small></div>`).join("");
      $("#monitorOverviewEyebrow").textContent = isRegionMode ? "REGION OVERVIEW" : "THRESHOLD OVERVIEW";
      $("#monitorOverviewTitle").textContent = isRegionMode ? "สรุปจำนวนสถานีตามภาค" : "สรุปสถานะตามเกณฑ์";
      $("#monitorOverviewHint").textContent = isRegionMode ? `ข้อมูลจริง ${regionOrder.filter(region => stations.some(item => item.region === region)).length} ภาค` : "เปลี่ยนตามภาคและจังหวัดที่เลือก";
      const waitForRegion = isRegionMode && activeRegion === "all";
      const provinceScope = baseStations().filter(item => activeRegion === "all" || item.region === activeRegion);
      const provinceCounts = Object.entries(countBy(provinceScope,"province")).sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0],"th"));
      const maxProvince = Math.max(1,...provinceCounts.map(([,count]) => count));
      $("#monitorProvinceTitle").textContent = waitForRegion ? "เลือกภาคเพื่อดูข้อมูลจังหวัด" : activeRegion === "all" ? "จังหวัดที่มีสถานีสูงสุด" : `จังหวัดใน${activeRegion}`;
      $("#monitorProvinceHint").textContent = waitForRegion ? "ยังไม่ได้เลือกภาค" : `ข้อมูลจริง ${provinceCounts.length} จังหวัด`;
      const bars = $("#monitorProvinceBars");
      if (bars) bars.innerHTML = waitForRegion
        ? `<div class="monitor-province-empty"><b>เลือกภาคจากกราฟด้านซ้าย</b><span>ระบบจะแสดงจังหวัดและจำนวนสถานีเฉพาะภาคที่เลือก</span></div>`
        : `<div class="province-summary-grid">${provinceCounts.map(([province,count]) => {
          const deviceCounts = provinceScope.filter(item => item.province === province).reduce((counts,item) => {
            const state = monitorDeviceState(item);
            counts[state] = (counts[state] || 0) + 1;
            return counts;
          },{});
          return `<button type="button" data-province-summary="${escapeHtml(province)}" aria-pressed="${activeProvince === province}" class="province-summary-tile ${activeProvince === province ? "active" : ""}"><span>${escapeHtml(province)}</span><strong>${count}<small> สถานี</small></strong><span class="province-status-detail"><em class="online"></em>ออนไลน์ ${deviceCounts.online || 0}<em class="water-none"></em>อ่านค่าน้ำไม่ได้ ${deviceCounts["water-none"] || 0}<em class="camera-partial"></em>กล้องเดียว ${deviceCounts["camera-partial"] || 0}<em class="camera-offline"></em>ขัดข้อง ${deviceCounts["camera-offline"] || 0}</span><i class="province-share" style="--province-share:${(count / maxProvince * 100).toFixed(1)}%"></i></button>`;
        }).join("")}</div>`;
    };

    const applyTableFilter = () => {
      const query = (search?.value || "").trim().toLowerCase();
      const statusValue = status?.value || "all";
      visibleStations = baseStations().filter(item => {
        const haystack = `${item.code} ${item.name} ${item.subdistrict} ${item.district} ${item.province} ${item.region}`.toLowerCase();
        const statusMatch = statusValue === "all" || (statusValue === "water-none" ? monitorDeviceState(item) === "water-none" : item.status === statusValue);
        return statusMatch && (activeRegion === "all" || item.region === activeRegion) && (activeProvince === "all" || item.province === activeProvince) && (!query || haystack.includes(query));
      });
      const alertPriority = {critical:0,evacuate:1,prepare:2,watch:3,normal:4,nodata:5};
      visibleStations.sort((a,b) => activeMode === "region"
        ? regionOrder.indexOf(a.region) - regionOrder.indexOf(b.region) || a.province.localeCompare(b.province,"th") || a.no - b.no
        : alertPriority[a.alertLevel] - alertPriority[b.alertLevel] || a.no - b.no);
      if (tableBody) tableBody.innerHTML = visibleStations.length ? visibleStations.map(item => `<tr data-device-status="${item.status}"><td><b>${escapeHtml(item.code)}</b></td><td class="station-name-cell">${escapeHtml(item.name)}</td><td>${escapeHtml(item.district)}</td><td>${escapeHtml(item.subdistrict)}</td><td>${escapeHtml(item.province)}</td><td>${escapeHtml(item.region)}</td><td><span class="camera-state ${item.camera1 ? "online" : "offline"}"><i></i>${item.camera1 ? "ออนไลน์" : "ผิดปกติ"}</span></td><td><span class="camera-state ${item.camera2 ? "online" : "offline"}"><i></i>${item.camera2 ? "ออนไลน์" : "ผิดปกติ"}</span></td><td>${item.waterAvailable ? `<b class="water-available">${escapeHtml(item.waterValue)}</b>` : `<span class="water-missing">ไม่มีข้อมูล</span>`}</td><td><time>${escapeHtml(item.time)}</time></td></tr>`).join("") : `<tr><td colspan="10"><div class="empty-state">ไม่พบสถานีตามตัวกรองที่เลือก</div></td></tr>`;
      $("#deviceResult").textContent = `แสดง ${visibleStations.length} จาก ${baseStations().length} สถานี`;
      $("#monitorConnectionText").textContent = `กำลังเชื่อมต่อสถานี ${visibleStations.length} จุด`;
      window.monitorFilterState = {query,status:statusValue,region:activeRegion,province:activeProvince};
      const mappedCount = visibleStations.filter(item => monitorStationCoordinate(item)).length;
      $("#monitorCoordinateNote").textContent = `มีพิกัด ${mappedCount}/${visibleStations.length} สถานี · ไม่มีพิกัด ${visibleStations.length - mappedCount} · CCTV สรุปจุด.xlsx`;
      $$(".real-monitor-marker").forEach(marker => {
        const requestedMapState = ({online:"online","water-none":"water-none",delay:"camera-partial",offline:"camera-offline"})[statusValue];
        const statusMatch = statusValue === "all" || marker.dataset.monitorMapState === requestedMapState;
        marker.style.display = statusMatch && (activeRegion === "all" || marker.dataset.monitorRegion === activeRegion) && (activeProvince === "all" || marker.dataset.monitorProvince === activeProvince) && (!query || marker.dataset.monitorSearch.includes(query)) ? "" : "none";
      });
      window.filterMonitorMap?.(window.monitorFilterState);
    };

    const render = () => { renderOverview(); applyTableFilter(); };
    const regions = regionOrder.filter(region => stations.some(item => item.region === region));
    regionSelect.innerHTML = `<option value="all">ทุกภาค</option>${regions.map(region => `<option value="${region}">${region}</option>`).join("")}`;
    refreshProvinceOptions();
    $("#allStationTabCount").textContent = stations.length;
    $("#regionTabCount").textContent = `${regions.length} ภาค`;
    const mappedStateCounts = monitorMapStations().reduce((counts,item) => ((counts[item.mapState] = (counts[item.mapState] || 0) + 1),counts),{});
    $("#monitorMapSummary").textContent = `สีเขียว ${mappedStateCounts.online || 0} · อ่านไม่ได้ ${mappedStateCounts["water-none"] || 0} · กล้องเดียว ${mappedStateCounts["camera-partial"] || 0} · ขัดข้อง ${mappedStateCounts["camera-offline"] || 0} จุด`;
    $("#monitorDataSource").textContent = `ที่มา: ${metadata.source}`;

    $$("[data-monitor-mode]").forEach(button => button.addEventListener("click", () => {
      activeMode = button.dataset.monitorMode;
      $$("[data-monitor-mode]").forEach(item => {
        item.classList.toggle("active",item === button);
        item.setAttribute("aria-selected",String(item === button));
      });
      render();
    }));
    search?.addEventListener("input", applyTableFilter);
    status?.addEventListener("change", applyTableFilter);
    regionSelect?.addEventListener("change", () => { activeRegion = regionSelect.value; activeProvince = "all"; refreshProvinceOptions(); render(); });
    provinceSelect?.addEventListener("change", () => { activeProvince = provinceSelect.value; render(); });
    $("#monitorProvinceBars")?.addEventListener("click", event => {
      const button = event.target.closest("[data-province-summary]");
      if (!button) return;
      activeProvince = activeProvince === button.dataset.provinceSummary ? "all" : button.dataset.provinceSummary;
      provinceSelect.value = activeProvince;
      render();
    });
    const handleRegionSummaryClick = event => {
      const button = event.target.closest("[data-region-summary]");
      if (!button) return;
      activeRegion = activeRegion === button.dataset.regionSummary ? "all" : button.dataset.regionSummary;
      activeProvince = "all";
      regionSelect.value = activeRegion;
      refreshProvinceOptions();
      render();
    };
    $("#monitorRegionList")?.addEventListener("click", handleRegionSummaryClick);
    $("#monitorRegionDonut")?.addEventListener("click", handleRegionSummaryClick);
    $("#monitorRefresh")?.addEventListener("click", event => flashRefresh(event.currentTarget));
    $("#exportCsv")?.addEventListener("click", () => {
      const lines = [
        ["รหัสสถานี","ชื่อสถานี","อำเภอ","ตำบล","จังหวัด","ภาค","สถานะกล้อง 1","สถานะกล้อง 2","ระดับน้ำ","ข้อมูลล่าสุด"],
        ...visibleStations.map(item => [item.code,item.name,item.district,item.subdistrict,item.province,item.region,item.camera1 ? "ออนไลน์" : "ผิดปกติ",item.camera2 ? "ออนไลน์" : "ผิดปกติ",item.waterValue,item.time])
      ];
      const csv = "\ufeff" + lines.map(line => line.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\r\n");
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      link.download = "ddpm-cctv-station-monitor-02092569.csv";
      link.click();
      URL.revokeObjectURL(link.href);
    });
    render();
  }

  const basinFeatures = window.ONWR_BASINS?.features || [];
  const basinStatus = {
    "09": { severity:"red", label:"ต้องอพยพ", points:16, color:[214,55,55,.66], fill:"#d63737" },
    "08": { severity:"orange", label:"อพยพ", points:3, color:[240,133,35,.62], fill:"#f08523" },
    "04": { severity:"yellow", label:"เฝ้าระวัง", points:3, color:[244,190,32,.62], fill:"#f4be20" }
  };
  const neutralStatus = { severity:"normal", label:"ไม่พบเหตุเกินเกณฑ์", points:0, color:[220,224,228,.16], fill:"rgba(215,220,224,.18)" };
  const basinLabelOffsets = {
    "08": {x:-18,y:-9},
    "09": {x:18,y:9}
  };
  const selectedBasinCode = new URLSearchParams(window.location.search).get("basin") || "09";
  const basinDrilldowns = {
    "09": {name:"น่าน",severity:"red",statusLabel:"ต้องอพยพ",provinces:["น่าน","อุตรดิตถ์"],peak:"8.42",excess:"สูงกว่าเกณฑ์อพยพ 0.62 ม.",trend:"+0.38",severityBreakdown:"แดง 6 · ส้ม 4 · เหลือง 2 · ฟ้า 2 · เขียว 2",route:[[100.78,19.25],[100.74,18.75],[100.60,18.10],[100.35,17.62],[100.27,16.82]],stations:[
    ],sensors:[
      {type:"flow",code:"WTR-NAN-01",name:"สถานีวัดระดับน้ำท่าน้ำยาว",area:"จังหวัดน่าน",value:"8.42 ม.",criterion:"เกณฑ์อพยพ 7.80 ม.",severity:"red",coordinate:[100.78,19.25]},
      {type:"rain",code:"RAN-NAN-01",name:"สถานีวัดปริมาณฝนทุ่งช้าง",area:"จังหวัดน่าน",value:"126 มม.",criterion:"ฝนสะสม 24 ชม. · เกณฑ์ 90 มม.",severity:"orange",coordinate:[100.8680,19.4230]},
      {type:"rain",code:"RAN-NAN-04",name:"สถานีวัดปริมาณฝนเชียงกลาง",area:"จังหวัดน่าน",value:"92 มม.",criterion:"ฝนสะสม 24 ชม. · เกณฑ์ 75 มม.",severity:"yellow",coordinate:[100.7180,19.2920]},
      {type:"flow",code:"WTR-NAN-07",name:"สถานีวัดระดับน้ำท่าเมืองน่าน",area:"จังหวัดน่าน",value:"6.18 ม.",criterion:"เกณฑ์อพยพ 5.90 ม.",severity:"orange",coordinate:[100.748,18.705]},
      {type:"rain",code:"RAN-NAN-07",name:"สถานีวัดปริมาณฝนท่าวังผา",area:"จังหวัดน่าน",value:"78 มม.",criterion:"ฝนสะสม 24 ชม. · เกณฑ์ 70 มม.",severity:"blue",coordinate:[100.7830,19.0050]},
      {type:"flow",code:"WTR-UTT-01",name:"สถานีวัดระดับน้ำท่า UTT01",area:"จังหวัดอุตรดิตถ์",value:"4.92 ม.",criterion:"เกณฑ์เฝ้าระวัง 4.60 ม.",severity:"yellow",coordinate:[101.078,18.284]},
      {type:"flow",code:"WTR-UTT-03",name:"สถานีวัดระดับน้ำท่า UTT03",area:"จังหวัดอุตรดิตถ์",value:"7.36 ม.",criterion:"เกณฑ์ต้องอพยพ 7.10 ม.",severity:"red",coordinate:[101.018,18.155]},
      {type:"rain",code:"RAN-NAN-09",name:"สถานีวัดปริมาณฝนเมืองน่าน",area:"จังหวัดน่าน",value:"142 มม.",criterion:"ฝนสะสม 24 ชม. · เกณฑ์ 120 มม.",severity:"red",coordinate:[100.7440,18.6420]},
      {type:"flow",code:"WTR-UTT-05",name:"สถานีวัดระดับน้ำท่า UTT05",area:"จังหวัดอุตรดิตถ์",value:"6.05 ม.",criterion:"เกณฑ์อพยพ 5.80 ม.",severity:"orange",coordinate:[100.098,17.807]},
    ],cctv:[
      {code:"NAN01",name:"สะพานปอน",province:"น่าน",district:"ทุ่งช้าง",subdistrict:"ปอน",level:"8.42",bank:"7.80",trend:"+0.38",severity:"red",statusLabel:"ต้องอพยพ",coordinate:[100.927400,19.518800]},
      {code:"NAN02",name:"สะพานบ้านโรงเรียนไตรเขต",province:"น่าน",district:"เชียงกลาง",subdistrict:"เปือ",level:"7.18",bank:"6.80",trend:"+0.21",severity:"orange",statusLabel:"อพยพ",coordinate:[100.706600,19.357000]},
      {code:"NAN03",name:"สะพานบ้านป่าหัด",province:"น่าน",district:"ปัว",subdistrict:"วรนคร",level:"7.10",bank:"6.78",trend:"+0.18",severity:"red",statusLabel:"ต้องอพยพ",coordinate:[100.863400,19.278100]},
      {code:"NAN04",name:"สะพานท่าวังผา",province:"น่าน",district:"ท่าวังผา",subdistrict:"ท่าวังผา",level:"5.24",bank:"5.02",trend:"+0.07",severity:"yellow",statusLabel:"เตรียมรับมือ",coordinate:[100.803200,19.116600]},
      {code:"NAN05",name:"สะพานสันติสุข",province:"น่าน",district:"สันติสุข",subdistrict:"ดู่พงษ์",level:"6.88",bank:"6.68",trend:"+0.09",severity:"red",statusLabel:"ต้องอพยพ",coordinate:[100.928700,19.087500]},
      {code:"NAN06",name:"สะพานเมืองวังศรีเสถียรพัฒนา",province:"น่าน",district:"ท่าวังผา",subdistrict:"ริม",level:"6.86",bank:"6.70",trend:"+0.19",severity:"blue",statusLabel:"เฝ้าระวัง",coordinate:[100.795500,18.902500]},
      {code:"NAN07",name:"ใต้สะพานพัฒนาภาคเหนือ",province:"น่าน",district:"เมืองน่าน",subdistrict:"ในเวียง",level:"7.95",bank:"7.47",trend:"+0.31",severity:"green",statusLabel:"ติดตาม",coordinate:[100.779100,18.775100]},
      {code:"NAN08",name:"สะพานน้ำลานบ้านวังแดง",province:"น่าน",district:"เวียงสา",subdistrict:"กลางเวียง",level:"4.41",bank:"4.25",trend:"+0.04",severity:"green",statusLabel:"ติดตาม",coordinate:[100.717000,18.583300]},
      {code:"NAN09",name:"สะพานเวียงสา",province:"น่าน",district:"เวียงสา",subdistrict:"ไหล่น่าน",level:"4.28",bank:"4.10",trend:"+0.03",severity:"green",statusLabel:"ติดตาม",coordinate:[100.755400,18.570100]},
      {code:"NAN10",name:"สะพานร่วมใจสามัคคี",province:"น่าน",district:"บ่อเกลือ",subdistrict:"ดงพญา",level:"4.16",bank:"4.70",trend:"+0.02",severity:"blue",statusLabel:"เฝ้าระวัง",coordinate:[101.203400,19.194000]},
      {code:"UTT01",name:"จุดตรวจวัด UTT01",province:"อุตรดิตถ์",district:"—",subdistrict:"—",level:"4.92",bank:"5.20",trend:"+0.06",severity:"green",statusLabel:"ติดตาม",coordinate:[101.105100,18.294050]},
      {code:"UTT02",name:"จุดตรวจวัด UTT02",province:"อุตรดิตถ์",district:"—",subdistrict:"—",level:"6.38",bank:"6.10",trend:"+0.12",severity:"orange",statusLabel:"อพยพ",coordinate:[101.103200,18.126400]},
      {code:"UTT03",name:"จุดตรวจวัด UTT03",province:"อุตรดิตถ์",district:"—",subdistrict:"—",level:"7.36",bank:"7.10",trend:"+0.24",severity:"red",statusLabel:"ต้องอพยพ",coordinate:[101.035800,18.146500]},
      {code:"UTT04",name:"จุดตรวจวัด UTT04",province:"อุตรดิตถ์",district:"—",subdistrict:"—",level:"7.82",bank:"7.40",trend:"+0.31",severity:"red",statusLabel:"ต้องอพยพ",coordinate:[100.305189,17.763709]},
      {code:"UTT05",name:"จุดตรวจวัด UTT05",province:"อุตรดิตถ์",district:"—",subdistrict:"—",level:"6.12",bank:"5.90",trend:"+0.15",severity:"orange",statusLabel:"อพยพ",coordinate:[100.083000,17.793920]},
      {code:"UTT06",name:"จุดตรวจวัด UTT06",province:"อุตรดิตถ์",district:"—",subdistrict:"—",level:"4.76",bank:"5.00",trend:"+0.03",severity:"yellow",statusLabel:"เตรียมรับมือ",coordinate:[100.140600,17.743510]}
    ]},
    "08": {name:"ยม",severity:"orange",statusLabel:"อพยพ",provinces:["แพร่","สุโขทัย","พิษณุโลก","พิจิตร"],peak:"6.86",excess:"สูงกว่าเกณฑ์อพยพ 0.16 ม.",trend:"+0.19",severityBreakdown:"ส้ม 2 · เหลือง 1",route:[[99.83,18.16],[99.79,17.55],[99.82,17.02],[100.12,16.55],[100.34,16.44]],stations:[
      {code:"YOM-01",name:"สะพานวังชิ้น",area:"ต้นน้ำ · จังหวัดแพร่",province:"แพร่",district:"วังชิ้น",subdistrict:"วังชิ้น",level:"6.86",trend:"+0.19",severity:"orange",statusLabel:"อพยพ"},
      {code:"YOM-04",name:"ประตูระบายน้ำบ้านกง",area:"กลางน้ำ · จังหวัดสุโขทัย",province:"สุโขทัย",district:"กงไกรลาศ",subdistrict:"บ้านกร่าง",level:"6.54",trend:"+0.14",severity:"orange",statusLabel:"อพยพ"},
      {code:"PCT-03",name:"สะพานเมืองพิจิตร",area:"ท้ายน้ำ · จังหวัดพิจิตร",province:"พิจิตร",district:"เมืองพิจิตร",subdistrict:"ในเมือง",level:"5.38",trend:"+0.07",severity:"yellow",statusLabel:"เฝ้าระวัง"}
    ],sensors:[
      {type:"flow",code:"WTR-YOM-04",name:"สถานีวัดระดับน้ำท่าวังชิ้น",area:"จังหวัดแพร่",value:"6.86 ม.",criterion:"เกณฑ์อพยพ 6.70 ม.",severity:"orange",coordinate:[99.83,18.16]},
      {type:"rain",code:"RAN-SUK-07",name:"สถานีวัดปริมาณฝนศรีสำโรง",area:"จังหวัดสุโขทัย",value:"104 มม.",criterion:"ฝนสะสม 24 ชม. · เกณฑ์ 90 มม.",severity:"yellow",coordinate:[99.80,17.22]}
    ]},
    "04": {name:"ชี",severity:"yellow",statusLabel:"เฝ้าระวัง",provinces:["ขอนแก่น","มหาสารคาม","ร้อยเอ็ด","ยโสธร"],peak:"5.24",excess:"สูงกว่าเกณฑ์เฝ้าระวัง 0.22 ม.",trend:"+0.08",severityBreakdown:"เหลือง 3 จุด",route:[[102.58,16.66],[102.86,16.44],[103.27,16.18],[103.65,15.96],[104.08,15.78]],stations:[
      {code:"CHI-03",name:"สะพานเมืองขอนแก่น",area:"ต้นน้ำ · จังหวัดขอนแก่น",province:"ขอนแก่น",district:"เมืองขอนแก่น",subdistrict:"ในเมือง",level:"5.24",trend:"+0.08",severity:"yellow",statusLabel:"เฝ้าระวัง"},
      {code:"CHI-07",name:"สะพานมหาสารคาม",area:"กลางน้ำ · จังหวัดมหาสารคาม",province:"มหาสารคาม",district:"เมืองมหาสารคาม",subdistrict:"ตลาด",level:"4.96",trend:"+0.05",severity:"yellow",statusLabel:"เฝ้าระวัง"},
      {code:"RET-02",name:"สถานีเมืองร้อยเอ็ด",area:"ท้ายน้ำ · จังหวัดร้อยเอ็ด",province:"ร้อยเอ็ด",district:"เมืองร้อยเอ็ด",subdistrict:"ในเมือง",level:"4.41",trend:"+0.02",severity:"yellow",statusLabel:"เฝ้าระวัง"}
    ],sensors:[
      {type:"flow",code:"WTR-CHI-03",name:"สถานีวัดระดับน้ำท่าเมืองขอนแก่น",area:"จังหวัดขอนแก่น",value:"5.24 ม.",criterion:"เกณฑ์เฝ้าระวัง 5.02 ม.",severity:"yellow",coordinate:[102.58,16.66]},
      {type:"rain",code:"RAN-MSK-11",name:"สถานีวัดปริมาณฝนเมืองมหาสารคาม",area:"จังหวัดมหาสารคาม",value:"82 มม.",criterion:"ฝนสะสม 24 ชม. · เกณฑ์ 75 มม.",severity:"yellow",coordinate:[103.29,16.20]}
    ]}
  };

  function detailStationRecords(detail) {
    return (detail?.cctv || []).length ? detail.cctv : (detail?.stations || []);
  }

  function stationBank(station) {
    const level = Number(station.level);
    if (station.bank !== undefined) return Number(station.bank);
    const defaultGap = station.severity === "red" ? .62 : station.severity === "orange" ? .38 : .22;
    return level - defaultGap;
  }

  function stationThreshold(station) {
    if (station.threshold !== undefined) return Number(station.threshold);
    const level = Number(station.level);
    const bank = stationBank(station);
    if (level >= bank) return bank;
    const warningGap = station.severity === "red" ? .40 : station.severity === "orange" ? .20 : .12;
    return level - warningGap;
  }

  function stationExcess(station) {
    return Number(station.level) - stationThreshold(station);
  }

  function rankStations(stations) {
    const order = {red:5,orange:4,yellow:3,blue:2,green:1};
    return [...stations].sort((a,b) =>
      (order[b.severity] - order[a.severity]) ||
      (stationExcess(b) - stationExcess(a)) ||
      (Number(b.level) - Number(a.level))
    );
  }

  function getBasinStatus(code) {
    const status = basinStatus[code] || neutralStatus;
    const detail = basinDrilldowns[code];
    return detail ? {...status,points:detailStationRecords(detail).length} : status;
  }

  function featureRings(feature) {
    return feature.geometry.coordinates.flatMap(polygon => polygon);
  }

  function featureCenter(feature) {
    if (!feature) return [100.50, 13.45];
    const points = featureRings(feature).flat();
    const longitudes = points.map(point => point[0]);
    const latitudes = points.map(point => point[1]);
    return [
      (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
      (Math.min(...latitudes) + Math.max(...latitudes)) / 2
    ];
  }

  function featureLabelCenter(feature) {
    if (!feature) return featureCenter(feature);
    const rings = featureRings(feature).filter(ring => ring.length >= 3);
    const largestRing = rings.reduce((largest, ring) => {
      const area = Math.abs(ring.reduce((sum, point, index) => {
        const next = ring[(index + 1) % ring.length];
        return sum + point[0] * next[1] - next[0] * point[1];
      }, 0));
      return area > largest.area ? {ring,area} : largest;
    }, {ring:null,area:-1}).ring;
    if (!largestRing) return featureCenter(feature);
    let crossSum = 0;
    let longitudeSum = 0;
    let latitudeSum = 0;
    largestRing.forEach((point, index) => {
      const next = largestRing[(index + 1) % largestRing.length];
      const cross = point[0] * next[1] - next[0] * point[1];
      crossSum += cross;
      longitudeSum += (point[0] + next[0]) * cross;
      latitudeSum += (point[1] + next[1]) * cross;
    });
    if (Math.abs(crossSum) < .000001) return featureCenter(feature);
    return [longitudeSum / (3 * crossSum), latitudeSum / (3 * crossSum)];
  }

  function createPolygonGraphic(Graphic, feature) {
    const code = feature.properties.code;
    const status = getBasinStatus(code);
    const isSelected = page !== "basin" || code === selectedBasinCode;
    const displayStatus = page === "monitor" || !isSelected ? neutralStatus : status;
    return new Graphic({
      geometry: { type:"polygon", rings:featureRings(feature), spatialReference:{wkid:4326} },
      symbol: {
        type:"simple-fill",
        color:[255,255,255,0],
        outline:{color:page === "basin" && code === selectedBasinCode ? [44,94,135,.95] : [75,84,92,.35],width:page === "basin" && code === selectedBasinCode ? 2.2 : .6}
      },
      attributes:{basin:code,severity:status.severity,name:`ลุ่มน้ำ${feature.properties.name_th}`,area:feature.properties.area_sqkm},
      popupTemplate:{
        title:`ลุ่มน้ำ${feature.properties.name_th}`,
        content:`<b>พื้นที่ลุ่มน้ำ:</b> ${Number(feature.properties.area_sqkm).toLocaleString("th-TH")} ตร.กม.<br><b>ระดับสูงสุด:</b> ${status.label}<br><b>จุดเกินเกณฑ์:</b> ${status.points} จุด<br><small>ขอบเขต: สำนักงานทรัพยากรน้ำแห่งชาติ</small>`
      }
    });
  }

  function createBasinLabelGraphic(Graphic, feature) {
    const status = getBasinStatus(feature.properties.code);
    const [longitude,latitude] = featureLabelCenter(feature);
    const offset = basinLabelOffsets[feature.properties.code] || {x:0,y:0};
    return new Graphic({
      geometry:{type:"point",longitude,latitude,spatialReference:{wkid:4326}},
      symbol:{
        type:"text",
        text:`ลุ่มน้ำ${feature.properties.name_th}`,
        color:[35,43,55,.96],
        font:{family:"Noto Sans Thai",size:9,weight:"bold"},
        haloColor:[255,255,255,.96],
        haloSize:1.35,
        horizontalAlignment:"center",
        verticalAlignment:"middle",
        xoffset:offset.x,
        yoffset:offset.y
      },
      attributes:{basin:feature.properties.code,severity:status.severity,name:`ลุ่มน้ำ${feature.properties.name_th}`,mapLabel:true}
    });
  }

  function projectCoordinate([longitude, latitude]) {
    const bounds = { west:97.18, east:105.82, south:5.45, north:20.62 };
    const width = 620;
    const height = 900;
    const padding = 28;
    const x = padding + (longitude - bounds.west) / (bounds.east - bounds.west) * (width - padding * 2);
    const y = padding + (bounds.north - latitude) / (bounds.north - bounds.south) * (height - padding * 2);
    return [x, y];
  }

  function pathFromFeature(feature) {
    return featureRings(feature).map(ring => ring.map((coordinate, index) => {
      const [x, y] = projectCoordinate(coordinate);
      return `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ") + " Z").join(" ");
  }

  function geoJsonFeatureRings(feature) {
    if (!feature?.geometry) return [];
    return feature.geometry.type === "MultiPolygon" ? feature.geometry.coordinates.flat() : feature.geometry.coordinates;
  }

  function pathFromGeoJsonFeature(feature) {
    return geoJsonFeatureRings(feature).map(ring => ring.map((coordinate, index) => {
      const [x, y] = projectCoordinate(coordinate);
      return `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ") + " Z").join(" ");
  }

  function appendSvgElement(svg, name, attributes) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    svg.appendChild(element);
    return element;
  }

  function cctvMarkerUrl(severity) {
    if (window.CCTV_MARKER_URLS?.[severity]) return window.CCTV_MARKER_URLS[severity];
    const markerNames = {
      red:"CCTV_WATER_SUPERCRITICAL.svg",
      orange:"CCTV_WATER_DANGER.svg",
      yellow:"CCTV_WATER_HIGH.svg",
      blue:"CCTV_WATER_MEDIUM.svg",
      green:"CCTV_WATER_LOW.svg"
    };
    const name = markerNames[severity] || markerNames.green;
    return `https://cctv.disaster.go.th/images/cctv-station-markers/${name}`;
  }

  function waterSeverityLabel(severity) {
    return ({red:"ต้องอพยพ",orange:"อพยพ",yellow:"เตรียมรับมือ",blue:"เฝ้าระวัง",green:"ติดตาม"})[severity] || "ไม่ระบุ";
  }

  const monitorProvinceCenters = {
    "อ่างทอง":[100.4551,14.5896],"พระนครศรีอยุธยา":[100.5689,14.3532],"ชัยนาท":[100.1251,15.1852],"สิงห์บุรี":[100.3967,14.8936],
    "กาญจนบุรี":[99.5328,14.0228],"เพชรบุรี":[99.9399,13.1119],"เชียงใหม่":[98.9853,18.7883],"เชียงราย":[99.8406,19.9105],
    "แม่ฮ่องสอน":[97.9685,19.3013],"ลำปาง":[99.4909,18.2888],"แพร่":[100.1403,18.1446],"น่าน":[100.7730,18.7756],
    "ตาก":[99.1258,16.8839],"อุตรดิตถ์":[100.0993,17.6201],"ขอนแก่น":[102.8236,16.4322],"ชัยภูมิ":[102.0315,15.8068],
    "จันทบุรี":[102.1038,12.6113],"นราธิวาส":[101.8253,6.4255],"ปัตตานี":[101.2505,6.8695],"พัทลุง":[100.0740,7.6167],
    "ระนอง":[98.6085,9.9529],"สตูล":[100.0674,6.6238],"ยะลา":[101.2804,6.5411]
  };

  function monitorDeviceState(station) {
    if (!station.camera1 && !station.camera2) return "camera-offline";
    if (station.camera1 !== station.camera2) return "camera-partial";
    if (!station.waterAvailable) return "water-none";
    return "online";
  }

  function monitorDeviceStateLabel(state) {
    return ({online:"กล้องออนไลน์และอ่านค่าระดับน้ำได้","water-none":"กล้องอ่านค่าน้ำไม่ได้","camera-partial":"กล้อง 1 ตัวมีสถานะออนไลน์","camera-offline":"กล้องทั้ง 2 ตัวติดเหตุขัดข้อง"})[state] || "ไม่ระบุสถานะ";
  }

  function monitorMarkerUrl(state) {
    const names = {online:"CCTV_WATER_LOW.png","water-none":"CCTV_WATER_NONE.png","camera-partial":"CCTV_STATION_CAMERA_MAINTANANCE_LOW.png","camera-offline":"CCTV_STATION_CAMERA_OFFLINE.png"};
    return `assets/cctv-markers/${names[state] || names.online}`;
  }

  function monitorStationCoordinate(station) {
    const coordinate = window.MONITOR_COORDINATES?.[String(station.code).trim().toUpperCase()]?.coordinate;
    return Array.isArray(coordinate) && coordinate.length === 2 && coordinate.every(Number.isFinite) ? coordinate : null;
  }

  function monitorMapStations() {
    const stations = window.MONITOR_STATIONS || [];
    const mappedStations = stations.map(station => ({...station,coordinate:monitorStationCoordinate(station)})).filter(station => station.coordinate);
    const stationScore = station => [...String(station.code)].reduce((score,character,index) => score + character.charCodeAt(0) * (index + 11),0);
    const exceptionCount = Math.round(mappedStations.length * .10);
    const exceptionStates = ["water-none","camera-partial","camera-offline"];
    const exceptionMap = new Map([...mappedStations].sort((a,b) => stationScore(a) - stationScore(b) || a.code.localeCompare(b.code)).slice(0,exceptionCount).map((station,index) => [station.code,exceptionStates[index % exceptionStates.length]]));
    return mappedStations.map(station => ({...station,mapState:exceptionMap.get(station.code) || "online"}));
  }

  function renderFallbackBasins() {
    const fallback = $(".map-fallback");
    if (!fallback || !basinFeatures.length) return;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 620 900");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.classList.add("real-basin-overlay");
    basinFeatures.forEach(feature => {
      const code = feature.properties.code;
      const status = getBasinStatus(code);
      const selected = page === "basin" && code === selectedBasinCode;
      appendSvgElement(svg, "path", {
        d:pathFromFeature(feature),
        class:`real-basin-path severity-${page === "monitor" || page === "basin" ? "normal" : status.severity}${selected ? " selected" : ""}${page === "basin" ? " basin-outline-only" : ""}`,
        "data-code":code,
        "fill-rule":"evenodd"
      });
    });

    if (page === "basin" && window.DPM_BASIN_PROVINCES?.features?.length) {
      const selectedFeature = basinFeatures.find(feature => feature.properties.code === selectedBasinCode);
      if (selectedFeature) {
        const defs = appendSvgElement(svg, "defs", {});
        const clipPath = appendSvgElement(defs, "clipPath", {id:"province-basin-clip"});
        appendSvgElement(clipPath, "path", {d:pathFromFeature(selectedFeature),"fill-rule":"evenodd"});
        window.DPM_BASIN_PROVINCES.features.forEach(feature => appendSvgElement(svg, "path", {
          d:pathFromGeoJsonFeature(feature),
          class:"real-province-boundary",
          "clip-path":"url(#province-basin-clip)",
          "fill-rule":"evenodd"
        }));
      }
    }

    if (page === "overview") {
      basinFeatures.filter(feature => basinStatus[feature.properties.code]).forEach(feature => {
        const center = projectCoordinate(featureLabelCenter(feature));
        const offset = basinLabelOffsets[feature.properties.code] || {x:0,y:0};
        const label = appendSvgElement(svg, "text", {x:(center[0] + offset.x).toFixed(1),y:(center[1] - offset.y).toFixed(1),class:"real-basin-label"});
        label.textContent = `ลุ่มน้ำ${feature.properties.name_th}`;
      });
    }

    const activeDrilldown = basinDrilldowns[selectedBasinCode] || basinDrilldowns["09"];
    const stations = page === "basin"
      ? (activeDrilldown.cctv || []).length ? [] : activeDrilldown.stations.map((station,index) => [...activeDrilldown.route[[0,Math.floor((activeDrilldown.route.length - 1) / 2),activeDrilldown.route.length - 1][index]],station.severity,station.code])
      : page === "monitor"
        ? []
        : [];
    stations.forEach(([longitude,latitude,status,code]) => {
      const [cx,cy] = projectCoordinate([longitude,latitude]);
      const stationRecord = page === "basin" ? activeDrilldown.stations.find(item => item.code === code) : null;
      const marker = appendSvgElement(svg,"circle",{cx:cx.toFixed(1),cy:cy.toFixed(1),r:page === "basin" ? 9 : 7,class:`real-station ${status}`,"data-station":code || "","data-map-filterable":page === "basin" ? "true" : "false","data-severity":status,"data-province":stationRecord?.province || ""});
      if (page === "basin" && code) marker.addEventListener("click", () => document.dispatchEvent(new CustomEvent("station-popup-request", { detail:{code} })));
    });
    if (page === "monitor") monitorMapStations().forEach(station => {
      const [cx,cy] = projectCoordinate(station.coordinate);
      appendSvgElement(svg,"image",{x:(cx - 4.5).toFixed(1),y:(cy - 9).toFixed(1),width:9,height:9,href:monitorMarkerUrl(station.mapState),class:"real-monitor-marker","data-monitor-region":station.region,"data-monitor-province":station.province,"data-monitor-map-state":station.mapState,"data-monitor-search":`${station.code} ${station.name} ${station.province} ${station.region}`.toLowerCase()});
    });
    if (page === "basin") (activeDrilldown.sensors || []).forEach(sensor => {
      const [cx,cy] = projectCoordinate(sensor.coordinate);
      if (sensor.type === "rain") {
        appendSvgElement(svg,"image",{x:(cx - 10).toFixed(1),y:(cy - 13).toFixed(1),width:20,height:25,href:RAIN_SENSOR_ICON,class:"real-sensor-rain-image","data-sensor-layer":"rain","data-map-filterable":"true","data-severity":sensor.severity,"data-province":sensor.province || sensor.area.replace("จังหวัด", "")});
      } else {
        appendSvgElement(svg,"path",{d:`M ${cx} ${cy - 10} L ${cx - 10} ${cy + 8} L ${cx + 10} ${cy + 8} Z`,class:`real-sensor flow ${sensor.severity}`,"data-sensor-layer":"flow","data-map-filterable":"true","data-severity":sensor.severity,"data-province":sensor.province || sensor.area.replace("จังหวัด", "")});
      }
      const label = appendSvgElement(svg,"text",{x:(cx + 10).toFixed(1),y:(cy + 3).toFixed(1),class:"real-sensor-label","data-sensor-layer":sensor.type,"data-map-filterable":"true","data-severity":sensor.severity,"data-province":sensor.province || sensor.area.replace("จังหวัด", "")});
      label.textContent = sensor.type === "rain" ? "ฝน" : "น้ำท่า";
    });
    if (page === "basin") (activeDrilldown.cctv || []).forEach(camera => {
      const [cx,cy] = projectCoordinate(camera.coordinate);
      const marker = appendSvgElement(svg,"image",{x:(cx - 13).toFixed(1),y:(cy - 26).toFixed(1),width:26,height:26,href:cctvMarkerUrl(camera.severity),class:"real-cctv-marker","data-camera":camera.code,"data-map-filterable":"true","data-severity":camera.severity,"data-province":camera.province || ""});
      marker.addEventListener("click", () => document.dispatchEvent(new CustomEvent("station-popup-request", { detail:{code:camera.code} })));
    });
    fallback.appendChild(svg);
    document.body.classList.add("has-real-basins");
  }

  function sensorMarkerDataUri(type, severity) {
    if (type === "rain") {
      const drop = '<path d="M20 2C15 10 7 19 7 28a13 13 0 0 0 26 0C33 19 25 10 20 2Z" fill="#9fc3f2"/><path d="M13 27c0 6 4 10 9 11" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>';
      return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 42">${drop}</svg>`)}`;
    }
    const color = ({red:"#ff0000",orange:"#E86011",yellow:"#F4D439",blue:"#56a9e8",green:"#2fc88f"})[severity] || "#2fc88f";
    const shape = '<path d="M20 4 4 34h32Z" fill="' + color + '" stroke="#5d6672" stroke-width="2" stroke-linejoin="round"/>';
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">${shape}</svg>`)}`;
  }

  function initArcgis() {
    if (!$("#viewDiv")) return;
    const markMapFailed = () => {
      if (!document.body.classList.contains("map-ready")) document.body.classList.add("map-failed");
    };
    if (typeof window.require !== "function") {
      markMapFailed();
      return;
    }
    window.require([
      "esri/Map",
      "esri/views/MapView",
      "esri/layers/GraphicsLayer",
      "esri/Graphic",
      "esri/layers/FeatureLayer",
      "esri/geometry/geometryEngine"
    ], (Map, MapView, GraphicsLayer, Graphic, FeatureLayer, geometryEngine) => {
      const basinLayer = new GraphicsLayer({ title: "พื้นที่ลุ่มน้ำ" });
      const routeLayer = new GraphicsLayer({ title: "เส้นทางมวลน้ำ" });
      const provinceBoundaryLayer = new GraphicsLayer({ title: "ขอบเขตจังหวัดภายในลุ่มน้ำ" });
      const stationLayer = new GraphicsLayer({ title: "สถานีตรวจวัด" });
      const sensorLayerState = window.basinSensorLayerState || {flow:true,rain:true};
      const flowSensorLayer = new GraphicsLayer({ title:"สถานีวัดระดับน้ำท่า", visible:sensorLayerState.flow !== false });
      const rainSensorLayer = new GraphicsLayer({ title:"สถานีวัดระดับน้ำฝน", visible:sensorLayerState.rain !== false });
      const basinLabelLayer = new GraphicsLayer({ title: "ชื่อลุ่มน้ำแจ้งเตือน", listMode:"hide" });
      basinLayer.addMany(basinFeatures.map(feature => createPolygonGraphic(Graphic, feature)));
      if (page === "overview") basinLabelLayer.addMany(
        basinFeatures.filter(feature => basinStatus[feature.properties.code]).map(feature => createBasinLabelGraphic(Graphic, feature))
      );

      if (page === "basin") {
        const drilldown = basinDrilldowns[selectedBasinCode] || basinDrilldowns["09"];
        const routeIndexes = [0,Math.floor((drilldown.route.length - 1) / 2),drilldown.route.length - 1];
        if (!(drilldown.cctv || []).length) drilldown.stations.map((station,index) => [...drilldown.route[routeIndexes[index]],station]).forEach(([longitude,latitude,station]) => stationLayer.add(new Graphic({
          geometry:{type:"point",longitude,latitude},
          symbol:{type:"simple-marker",color:station.severity === "red" ? "#e34b4b" : station.severity === "orange" ? "#f28a2e" : "#f4c430",size:13,outline:{color:"#fff",width:2}},
          attributes:{code:station.code,category:"station",severity:station.severity,province:station.province},popupTemplate:{title:`${station.code} · ${station.name}`,content:`ต.${station.subdistrict} อ.${station.district} จ.${station.province}<br><b>ระดับน้ำ ${station.level} เมตร</b><br>สถานะ ${waterSeverityLabel(station.severity)}`}
        })));
        (drilldown.sensors || []).forEach(sensor => {
          const targetLayer = sensor.type === "rain" ? rainSensorLayer : flowSensorLayer;
          targetLayer.add(new Graphic({
            geometry:{type:"point",longitude:sensor.coordinate[0],latitude:sensor.coordinate[1]},
            symbol:{type:"picture-marker",url:sensorMarkerDataUri(sensor.type,sensor.severity),width:sensor.type === "rain" ? 24 : 21,height:sensor.type === "rain" ? 30 : 21,xoffset:0,yoffset:sensor.type === "rain" ? 10 : 8},
            attributes:{sensorCode:sensor.code,category:"sensor",sensorType:sensor.type,severity:sensor.severity,province:sensor.province || sensor.area.replace("จังหวัด", "")},popupTemplate:{title:sensor.type === "rain" ? "Sensor ปริมาณฝน" : "Sensor น้ำท่า",content:`${sensor.name}<br><b>${sensor.value}</b><br>${sensor.criterion}`}
          }));
        });
        (drilldown.cctv || []).forEach(camera => stationLayer.add(new Graphic({
          geometry:{type:"point",longitude:camera.coordinate[0],latitude:camera.coordinate[1]},
          symbol:{type:"picture-marker",url:cctvMarkerUrl(camera.severity),width:28,height:28,xoffset:0,yoffset:10},
          attributes:{code:camera.code,category:"cctv",severity:camera.severity,province:camera.province},popupTemplate:{title:`${camera.code} · ${camera.name}`,content:`ต.${camera.subdistrict} อ.${camera.district} จ.${camera.province}<br><b>ระดับน้ำ ${camera.level} เมตร</b> · ระดับตลิ่ง ${camera.bank} เมตร<br><b>ระดับสถานการณ์ ${waterSeverityLabel(camera.severity)}</b>`}
        })));
      }

      if (page === "monitor") {
        monitorMapStations().forEach(station => stationLayer.add(new Graphic({
          geometry:{type:"point",longitude:station.coordinate[0],latitude:station.coordinate[1]},
          symbol:{type:"picture-marker",url:monitorMarkerUrl(station.mapState),width:7,height:7,xoffset:0,yoffset:2},
          attributes:{code:station.code,status:station.status,mapState:station.mapState,waterStatus:station.waterAvailable ? "available" : "none",region:station.region,province:station.province,searchText:`${station.code} ${station.name} ${station.province} ${station.region}`.toLowerCase()},
          popupTemplate:{title:`${station.code} · ${station.name}`,content:`อ.${station.district} จ.${station.province}<br><b>${monitorDeviceStateLabel(station.mapState)}</b><br>${station.waterAvailable ? `ระดับน้ำ ${station.waterValue}` : "ไม่มีข้อมูลระดับน้ำ"}`}
        })));
      }

      if (page === "overview") {
        monitorMapStations().forEach(station => stationLayer.add(new Graphic({
          geometry:{type:"point",longitude:station.coordinate[0],latitude:station.coordinate[1]},
          symbol:{type:"simple-marker",color:station.mapState === "camera-offline" ? "#f43f5e" : station.mapState === "camera-partial" ? "#f97316" : station.mapState === "water-none" ? "#facc15" : "#22c55e",size:8,outline:{color:"#fff",width:1.5}},
          attributes:{code:station.code,category:"station",status:station.mapState,province:station.province},
          popupTemplate:{title:`${station.code} · ${station.name}`,content:`อ.${station.district} จ.${station.province}<br><b>${monitorDeviceStateLabel(station.mapState)}</b>`}
        })));
      }

      const selectedFeature = basinFeatures.find(feature => feature.properties.code === selectedBasinCode);
      const basinCenter = featureCenter(selectedFeature);
      if (page === "basin" && selectedFeature && window.DPM_BASIN_PROVINCES?.features?.length) {
        const selectedBasinGeometry = basinLayer.graphics.find(graphic => graphic.attributes?.basin === selectedBasinCode)?.geometry;
        const allowedProvinces = new Set((basinDrilldowns[selectedBasinCode] || basinDrilldowns["09"]).provinces);
        window.DPM_BASIN_PROVINCES.features.filter(feature => allowedProvinces.has(feature.properties.PROV_NAM_T)).forEach(feature => {
          const sourceGeometry = new Graphic({geometry:{type:"polygon",rings:geoJsonFeatureRings(feature),spatialReference:{wkid:4326}}}).geometry;
          const clippedGeometry = geometryEngine.intersect(sourceGeometry, selectedBasinGeometry);
          if (!clippedGeometry) return;
          provinceBoundaryLayer.add(new Graphic({
            geometry:clippedGeometry,
            symbol:{type:"simple-fill",color:[255,255,255,0],outline:{type:"simple-line",color:[34,53,79,.9],width:1.15,style:"dash"}},
            attributes:{province:feature.properties.PROV_NAM_T},
            popupTemplate:{title:`จังหวัด${feature.properties.PROV_NAM_T}`,content:"ขอบเขตจังหวัดเฉพาะส่วนที่อยู่ภายในลุ่มน้ำ"}
          }));
          if (clippedGeometry.centroid) provinceBoundaryLayer.add(new Graphic({
            geometry:clippedGeometry.centroid,
            symbol:{type:"text",text:feature.properties.PROV_NAM_T,color:[31,48,70,.92],font:{size:9,weight:"bold"},haloColor:[255,255,255,.95],haloSize:1.2},
            attributes:{province:feature.properties.PROV_NAM_T,label:true}
          }));
        });
        document.body.classList.add("province-boundaries-ready");
      }
      const streamLayer = page === "basin" ? new FeatureLayer({
        url:"https://gis.dwr.go.th/arcgis/rest/services/NAT_STREAM/MapServer/0",
        title:"เส้นทางน้ำธรรมชาติ DWR",
        definitionExpression:"sym_c = 1",
        outFields:["OBJECTID","STR_Name_T","STR_type","sym_c"],
        popupEnabled:false,
        opacity:.9,
        renderer:{
          type:"unique-value",
          field:"sym_c",
          uniqueValueInfos:[
            {value:1,label:"แม่น้ำสายหลัก",symbol:{type:"simple-line",color:[23,114,176,.96],width:2.1}}
          ],
          defaultSymbol:{type:"simple-line",color:[73,170,205,.58],width:.7}
        }
      }) : null;
      const operationalLayers = streamLayer
        ? [basinLayer,streamLayer,provinceBoundaryLayer,routeLayer,stationLayer,flowSensorLayer,rainSensorLayer,basinLabelLayer]
        : [basinLayer,provinceBoundaryLayer,routeLayer,stationLayer,flowSensorLayer,rainSensorLayer,basinLabelLayer];
      const map = new Map({ basemap:"dark-gray-vector", layers:operationalLayers });
      const view = new MapView({
        container:"viewDiv",
        map,
        center: page === "basin" ? basinCenter : [100.50,13.45],
        zoom: page === "basin" ? 7.2 : 5.75,
        ui:{components:[]},
        constraints:{minZoom:5}
      });

      const homeTarget = page === "basin" ? {center:basinCenter,zoom:7.2} : {center:[100.50,13.45],zoom:5.75};
      $("#homeBtn")?.addEventListener("click", () => view.goTo(homeTarget));
      $("#zoomIn")?.addEventListener("click", () => { view.zoom += 1; });
      $("#zoomOut")?.addEventListener("click", () => { view.zoom -= 1; });

      if (page === "monitor") {
        let currentMonitorMarkerSize = 0;
        const resizeMonitorMarkers = zoom => {
          const size = zoom < 6.5 ? 7 : zoom < 8 ? 12 : 20;
          if (size === currentMonitorMarkerSize) return;
          currentMonitorMarkerSize = size;
          stationLayer.graphics.forEach(graphic => {
            if (!graphic.attributes?.mapState) return;
            graphic.symbol = {type:"picture-marker",url:monitorMarkerUrl(graphic.attributes.mapState),width:size,height:size,xoffset:0,yoffset:Math.round(size * .35)};
          });
        };
        resizeMonitorMarkers(view.zoom);
        view.watch("zoom", resizeMonitorMarkers);
      }

      if (page === "overview") {
        window.filterMapBasins = (severity, selectedBasin) => {
          [basinLayer,basinLabelLayer].forEach(layer => layer.graphics.forEach(graphic => {
              const severityMatch = severity === "all" || graphic.attributes.severity === severity;
              const basinMatch = selectedBasin === "all" || graphic.attributes.basin === selectedBasin;
              graphic.visible = severityMatch && basinMatch;
            })
          );
        };
        view.on("click", async event => {
          const response = await view.hitTest(event);
          const graphic = response.results.map(result => result.graphic).find(item => item?.attributes?.basin);
          if (graphic?.attributes?.basin && graphic.attributes.severity !== "normal") window.location.href = `basin.html?basin=${graphic.attributes.basin}`;
        });
      }

      if (page === "monitor") {
        window.filterMonitorMap = ({query="",status="all",region="all",province="all"} = {}) => {
          const normalizedQuery = String(query).trim().toLowerCase();
          stationLayer.graphics.forEach(graphic => {
            const requestedMapState = ({online:"online","water-none":"water-none",delay:"camera-partial",offline:"camera-offline"})[status];
            const statusMatch = status === "all" || graphic.attributes?.mapState === requestedMapState;
            graphic.visible = statusMatch && (region === "all" || graphic.attributes?.region === region) && (province === "all" || graphic.attributes?.province === province) && (!normalizedQuery || graphic.attributes?.searchText?.includes(normalizedQuery));
          });
          $$(".real-monitor-marker").forEach(marker => {
            const requestedMapState = ({online:"online","water-none":"water-none",delay:"camera-partial",offline:"camera-offline"})[status];
            const statusMatch = status === "all" || marker.dataset.monitorMapState === requestedMapState;
            marker.style.display = statusMatch && (region === "all" || marker.dataset.monitorRegion === region) && (province === "all" || marker.dataset.monitorProvince === province) && (!normalizedQuery || marker.dataset.monitorSearch.includes(normalizedQuery)) ? "" : "none";
          });
        };
        window.filterMonitorMap(window.monitorFilterState || {});
      }

      if (page === "basin") {
        const normalizeCode = code => String(code || "").replace(/-/g, "").toUpperCase();
        window.filterBasinMap = (criteria = "all", province = "all") => {
          [stationLayer,flowSensorLayer,rainSensorLayer].forEach(layer => layer.graphics.forEach(graphic => {
              const criteriaMatch = criteria === "all" || graphic.attributes?.severity === criteria;
              const provinceMatch = province === "all" || graphic.attributes?.province === province;
              graphic.visible = criteriaMatch && provinceMatch;
            })
          );
        };
        document.addEventListener("basin-sensor-layer-change", event => {
          const layer = event.detail?.type === "rain" ? rainSensorLayer : flowSensorLayer;
          if (event.detail?.type === "rain" || event.detail?.type === "flow") layer.visible = event.detail.visible;
          });
        window.focusBasinStation = code => {
          const matches = [...stationLayer.graphics].filter(graphic => normalizeCode(graphic.attributes?.code) === normalizeCode(code));
          const graphic = matches.find(item => item.attributes?.category === "cctv") || matches[0];
          if (!graphic) return;
          graphic.visible = true;
          view.goTo({target:graphic.geometry,zoom:13},{duration:650}).then(() => document.dispatchEvent(new CustomEvent("station-popup-request", {detail:{code:graphic.attributes.code}}))).catch(() => {});
        };
        if (window.basinFilterState) window.filterBasinMap(window.basinFilterState.criteria, window.basinFilterState.province);
        view.whenLayerView(streamLayer).then(layerView => {
          layerView.filter = {
            geometry:{type:"polygon",rings:featureRings(selectedFeature),spatialReference:{wkid:4326}},
            spatialRelationship:"intersects"
          };
          document.body.classList.add("stream-ready");
        }).catch(() => document.body.classList.add("stream-unavailable"));
        view.on("click", async event => {
          const response = await view.hitTest(event);
          const graphic = response.results.map(result => result.graphic).find(item => item?.attributes?.code);
          if (graphic?.attributes?.code) {
            event.stopPropagation();
            view.popup.close();
            document.dispatchEvent(new CustomEvent("station-popup-request", { detail:{code:graphic.attributes.code} }));
          }
        });
      }

      view.when(() => {
        document.body.classList.remove("map-failed");
        document.body.classList.add("map-ready");
      }).catch(markMapFailed);
    }, markMapFailed);
  }

  updateClock();
  initVersionBadge();
  initBasinSensorLayerControl();
  window.setInterval(updateClock, 1000);
  renderFallbackBasins();
  if (page === "overview") initOverview();
  if (page === "basin") initBasinDetail();
  if (page === "monitor") initMonitor();
  initArcgis();
})();

// Months helper
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

let roadwayData = [];     // filled from roadway_files.csv
let timingChart = null;   // per-month early/late bar chart
let trendChart = null;    // year vs year beforePct chart

// extra roadway charts
let totalProjectsChart = null;
let filesByYearPctChart = null;
let filesYearChart = null;          // "Files from Roadway – selected year"
let planTimelineYearChart = null;   // "Plan Receipt Timeline – selected year"

// In-state vs Out-state data and charts
let instOutData = [];
let instOutBarChart = null;
let instOutLineChart = null;

// Addendum data and charts
let addendumData = [];
let addMonthChart = null;             // distribution for selected month
let addCompareChart = null;           // Letting Week % year vs year
let addTimeline2025Chart = null;      // Roadway Addendum Timeline – selected year
let addTimelineAllYearsChart = null;  // Roadway Addendum Timeline – 2021–2025

/* ---------- CSV helper: split one line while respecting quotes ---------- */
function splitCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);

  return result.map(cell => cell.trim().replace(/^"|"$/g, ""));
}

document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();

  // Load ALL THREE CSV files
  Promise.all([
    fetch("data/roadway_files.csv").then(resp => resp.text()),
    fetch("data/InStateVsOutState.csv").then(resp => resp.text()),
    fetch("data/Addendum_data.csv").then(resp => resp.text())
  ])
    .then(([roadwayText, instOutText, addendumText]) => {
      roadwayData = parseRoadwayCSV(roadwayText);
      instOutData = parseInstOutCSV(instOutText);
      addendumData = parseAddendumCSV(addendumText);

      if (!roadwayData.length) {
        console.error("No rows parsed from roadway CSV. Check file path / header row.");
      } else {
        setupRoadwayDashboard();
      }

      if (!instOutData.length) {
        console.error("No rows parsed from InStateVsOutState CSV. Check file path / header row.");
      } else {
        setupInstOutDashboard();
      }

      if (!addendumData.length) {
        console.error("No rows parsed from Addendum CSV. Check file path / header row.");
      } else {
        setupAddendumDashboard();
      }
    })
    .catch(err => {
      console.error("Error loading CSV files", err);
    });
});

/* ========== NAVIGATION (show/hide sections) ========== */

function setupNavigation() {
  const menuLinks = document.querySelectorAll(".menu-link");
  const sections = document.querySelectorAll(".page-section");

  menuLinks.forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();

      menuLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");

      const sectionName = link.dataset.section;
      sections.forEach(sec => {
        if (sec.id === `section-${sectionName}`) {
          sec.classList.add("active");
        } else {
          sec.classList.remove("active");
        }
      });
    });
  });
}

/* ========== CSV PARSING: ROADWAY ========== */

function parseRoadwayCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]);
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const parts = splitCSVLine(line);
    const row = {};

    headers.forEach((h, idx) => {
      const raw = parts[idx] ?? "";
      const value = raw.trim();

      switch (h) {
        case "Year":
          row.year = value ? Number(value) : null;
          break;
        case "Month":
          row.month = value;
          break;
        case "% Received Before Plan Due Date":
          row.beforePct = value ? parseFloat(value.replace("%", "")) : null;
          break;
        case "% Received After Due Date":
          row.afterPct = value ? parseFloat(value.replace("%", "")) : null;
          break;
        case "% Received After Advertisement":
          row.afterAdvPct = value ? parseFloat(value.replace("%", "")) : null;
          break;
        case "Unknown Arrival":
          row.unknownPct = value ? parseFloat(value.replace("%", "")) : null;
          break;
        case "Total Files Received":
          row.total = value ? Number(value) : 0;
          break;
        case "1-2 Weeks Early":
          row.early12 = value ? Number(value) : 0;
          break;
        case "0-1 Week Early":
          row.early01 = value ? Number(value) : 0;
          break;
        case "On Due Date":
          row.onDue = value ? Number(value) : 0;
          break;
        case "0-1 Week Late":
          row.late01 = value ? Number(value) : 0;
          break;
        case "1-2 Week(s) Late":
          row.late12 = value ? Number(value) : 0;
          break;
        default:
          break;
      }
    });

    if (row.year && row.month) {
      data.push(row);
    }
  }

  return data;
}

/* ========== CSV PARSING: IN-STATE VS OUT-STATE ========== */

function parseInstOutCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]);
  const data = [];

  function parseNumber(val) {
    const cleaned = (val || "").replace(/[\$,]/g, "").replace(/,/g, "").trim();
    return cleaned ? Number(cleaned) : 0;
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const parts = splitCSVLine(line);
    const row = {};

    headers.forEach((h, idx) => {
      const raw = parts[idx] ?? "";
      const value = raw.trim();

      switch (h) {
        case "Year":
          row.year = value ? Number(value) : null;
          break;

        case "Amount Awarded to In-state Contractor":
          row.amountIn = parseNumber(value);
          break;

        case "Number of Contracts Awarded to In-state Contractor":
          row.countIn = parseNumber(value);
          break;

        case "Amount Awarded to Out-state Contractor":
          row.amountOut = parseNumber(value);
          break;

        case "Number of Contracts Awarded to Out-state Contractor":
          row.countOut = parseNumber(value);
          break;

        case "Total Contracts":
          row.totalContracts = parseNumber(value);
          break;

        case "Total Amount":
          row.totalAmount = parseNumber(value);
          break;

        case "Contracts with at least one In-state Bidders - Number of contracts":
          row.withInCount = parseNumber(value);
          break;

        case "Contracts with at least one In-state Bidder - Savings":
          row.withInSavings = parseNumber(value);
          break;

        case "Contracts with No In-state Bidders - Number of contracts":
          row.noInCount = parseNumber(value);
          break;

        case "Contracts with No In-state Bidders - Savings":
          row.noInSavings = parseNumber(value);
          break;

        default:
          break;
      }
    });

    if (row.year) {
      data.push(row);
    }
  }

  return data;
}

/* ========== CSV PARSING: ADDENDUM DATA ========== */

function parseAddendumCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]);
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const parts = splitCSVLine(line);
    const row = {};

    headers.forEach((h, idx) => {
      const raw = parts[idx] ?? "";
      const value = raw.trim();

      switch (h) {
        case "Year":
          row.year = value ? Number(value) : null;
          break;
        case "Month":
          row.month = value;
          break;
        case "Advertisement":
          row.advertisement = value ? Number(value) : 0;
          break;
        case "3 Weeks Before":
          row.threeWeeksBefore = value ? Number(value) : 0;
          break;
        case "2 Weeks Before":
          row.twoWeeksBefore = value ? Number(value) : 0;
          break;
        case "1 Week Before":
          row.oneWeekBefore = value ? Number(value) : 0;
          break;
        case "Letting Week":
          row.lettingWeek = value ? Number(value) : 0;
          break;
        case "Total":
          row.total = value ? Number(value) : 0;
          break;
        case "Advertisement %":
          row.advertisementPct = value ? parseFloat(value.replace("%", "")) : 0;
          break;
        case "3 Weeks Before %":
          row.threeWeeksBeforePct = value ? parseFloat(value.replace("%", "")) : 0;
          break;
        case "2 Weeks Before %":
          row.twoWeeksBeforePct = value ? parseFloat(value.replace("%", "")) : 0;
          break;
        case "1 Week Before %":
          row.oneWeekBeforePct = value ? parseFloat(value.replace("%", "")) : 0;
          break;
        case "Letting Week %":
          row.lettingWeekPct = value ? parseFloat(value.replace("%", "")) : 0;
          break;
        case "Total %":
          row.totalPct = value ? parseFloat(value.replace("%", "")) : 0;
          break;
        default:
          break;
      }
    });

    if (row.year && row.month && row.total > 0) {
      data.push(row);
    }
  }

  return data;
}

function setupRoadwayDashboard() {
  if (!roadwayData.length) return;

  const yearSelect = document.getElementById("yearSelect");
  const monthSelect = document.getElementById("monthSelect");
  const compareYearSelect = document.getElementById("compareYearSelect");

  const years = [...new Set(roadwayData.map(d => d.year))].sort((a, b) => a - b);

  populateSelect(yearSelect, years);
  populateSelect(compareYearSelect, years);
  populateSelect(monthSelect, MONTHS);

  yearSelect.value = years[years.length - 1];  // latest year
  compareYearSelect.value = years[0];          // earliest year
  monthSelect.value = "January";

  updateGlobalCards();
  updateRoadwayView();
  updateTrendChart();

  // global charts
  buildTotalProjectsChart();
  buildFilesByYearPctChart();
  // detail charts for selected year
  buildOrUpdateYearDetailCharts(Number(yearSelect.value));

  yearSelect.addEventListener("change", () => {
    const y = Number(yearSelect.value);
    updateRoadwayView();
    updateTrendChart();
    buildOrUpdateYearDetailCharts(y);
  });

  monthSelect.addEventListener("change", () => {
    updateRoadwayView();
  });

  compareYearSelect.addEventListener("change", () => {
    updateTrendChart();
  });
}

/* ========== IN-STATE VS OUT-STATE DASHBOARD SETUP ========== */

function setupInstOutDashboard() {
  if (!instOutData.length) return;

  const instYearSelect = document.getElementById("instYearSelect");
  const years = [...new Set(instOutData.map(d => d.year))].sort((a, b) => a - b);
  populateSelect(instYearSelect, years);

  // default to latest year
  instYearSelect.value = years[years.length - 1];

  updateInstOutCardsAndSummary();
  buildInstOutCharts();

  instYearSelect.addEventListener("change", () => {
    updateInstOutCardsAndSummary();
  });
}

/* ========== COMMON HELPERS ========== */

function populateSelect(selectEl, values) {
  if (!selectEl) return;
  selectEl.innerHTML = "";
  values.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    selectEl.appendChild(opt);
  });
}

function formatCurrency(n) {
  if (n == null || isNaN(n)) return "–";
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatPercent(n) {
  if (n == null || isNaN(n)) return "–";
  return n.toFixed(1) + "%";
}

/* ========== GLOBAL CARDS (ROADWAY – ALL YEARS) ========== */

function updateGlobalCards() {
  const cardTotalRoadway = document.getElementById("cardTotalRoadway");
  const cardAvgOnTime = document.getElementById("cardAvgOnTime");
  const cardBestYear = document.getElementById("cardBestYear");
  const cardWorstYear = document.getElementById("cardWorstYear");

  const totalFiles = roadwayData.reduce((sum, d) => sum + (d.total || 0), 0);

  const byYear = {};
  roadwayData.forEach(d => {
    if (!byYear[d.year]) {
      byYear[d.year] = { before: 0, count: 0, late: 0 };
    }
    if (d.beforePct != null) {
      byYear[d.year].before += d.beforePct;
      byYear[d.year].count += 1;
    }
    const latePct = (d.afterPct || 0) + (d.afterAdvPct || 0);
    byYear[d.year].late += latePct;
  });

  const years = Object.keys(byYear).map(Number);
  let sumAvgBefore = 0;
  let nYears = 0;
  let bestYear = null;
  let bestVal = -Infinity;
  let worstYear = null;
  let worstVal = -Infinity;

  years.forEach(y => {
    const info = byYear[y];
    if (!info.count) return;
    const avgBefore = info.before / info.count;
    const avgLate = info.late / info.count;

    sumAvgBefore += avgBefore;
    nYears += 1;

    if (avgBefore > bestVal) {
      bestVal = avgBefore;
      bestYear = y;
    }
    if (avgLate > worstVal) {
      worstVal = avgLate;
      worstYear = y;
    }
  });

  const overallAvg = nYears ? sumAvgBefore / nYears : null;

  cardTotalRoadway.textContent = totalFiles.toString();
  cardAvgOnTime.textContent = overallAvg != null ? `${overallAvg.toFixed(1)}%` : "–";
  cardBestYear.textContent = bestYear != null ? `${bestYear} (${bestVal.toFixed(1)}%)` : "–";
  cardWorstYear.textContent = worstYear != null ? `${worstYear} (${worstVal.toFixed(1)}% late)` : "–";
}

/* ========== SELECTED MONTH VIEW (ROADWAY) ========== */

function updateRoadwayView() {
  const yearSelect = document.getElementById("yearSelect");
  const monthSelect = document.getElementById("monthSelect");

  const summaryOnTime = document.getElementById("summaryOnTime");
  const summaryLate = document.getElementById("summaryLate");
  const summaryTotal = document.getElementById("summaryTotal");
  const summaryInsight = document.getElementById("summaryInsight");

  const year = Number(yearSelect.value);
  const month = monthSelect.value;

  const record = roadwayData.find(d => d.year === year && d.month === month);

  if (!record) {
    summaryOnTime.textContent = "No data";
    summaryLate.textContent = "No data";
    summaryTotal.textContent = "–";
    summaryInsight.textContent = "No roadway files recorded for this month.";
    summaryInsight.className = "summary-insight";
    updateTimingChart(null);
    return;
  }

  const onTimePct = record.beforePct || 0;
  const latePct = (record.afterPct || 0) + (record.afterAdvPct || 0);

  summaryOnTime.textContent = `${onTimePct.toFixed(1)}%`;
  summaryLate.textContent = `${latePct.toFixed(1)}%`;
  summaryTotal.textContent = record.total?.toString() ?? "0";

  let insight = "";
  let cls = "summary-insight";
  if (latePct >= 50) {
    insight = "More than half of the plans arrived late this month. Strong evidence of schedule risk.";
    cls += " bad";
  } else if (latePct <= 20) {
    insight = "Most plans arrived on time this month. This could be a benchmark period.";
    cls += " good";
  } else {
    insight = "On-time performance is mixed this month. There is visible room for improvement.";
  }
  summaryInsight.textContent = insight;
  summaryInsight.className = cls;

  updateTimingChart(record);
}

/* ========== BAR CHART: EARLY/LATE COUNTS FOR SELECTED MONTH ========== */

function updateTimingChart(record) {
  const ctx = document.getElementById("roadwayBarChart");
  if (!ctx) return;

  const labels = [
    "1–2 Weeks Early",
    "0–1 Week Early",
    "On Due Date",
    "0–1 Week Late",
    "1–2 Weeks Late"
  ];

  const data = record
    ? [
        record.early12 || 0,
        record.early01 || 0,
        record.onDue || 0,
        record.late01 || 0,
        record.late12 || 0
      ]
    : [0, 0, 0, 0, 0];

  if (timingChart) {
    timingChart.data.datasets[0].data = data;
    timingChart.update();
    return;
  }

  timingChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Plan sets",
          data,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 5 }
        }
      }
    }
  });
}

/* ========== LINE CHART: YEAR vs YEAR (PERCENT ONLY) ========== */

function updateTrendChart() {
  const yearSelect = document.getElementById("yearSelect");
  const compareYearSelect = document.getElementById("compareYearSelect");
  const ctx = document.getElementById("roadwayLineChart");
  if (!ctx) return;

  const year1 = Number(yearSelect.value);
  const year2 = Number(compareYearSelect.value);

  const dataYear1Pct = MONTHS.map(m => {
    const rec = roadwayData.find(d => d.year === year1 && d.month === m);
    return rec ? rec.beforePct : null;
  });

  const dataYear2Pct = MONTHS.map(m => {
    const rec = roadwayData.find(d => d.year === year2 && d.month === m);
    return rec ? rec.beforePct : null;
  });

  if (trendChart) {
    trendChart.data.labels = MONTHS;
    trendChart.data.datasets[0].label = `${year1} – % before due date`;
    trendChart.data.datasets[0].data = dataYear1Pct;
    trendChart.data.datasets[1].label = `${year2} – % before due date`;
    trendChart.data.datasets[1].data = dataYear2Pct;
    trendChart.update();
    return;
  }

  trendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: MONTHS,
      datasets: [
        {
          label: `${year1} – % before due date`,
          data: dataYear1Pct,
          borderWidth: 2,
          fill: false,
          tension: 0.25,
          spanGaps: true
        },
        {
          label: `${year2} – % before due date`,
          data: dataYear2Pct,
          borderWidth: 2,
          fill: false,
          tension: 0.25,
          spanGaps: true
        }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "bottom" }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: "% received before due date" }
        }
      }
    }
  });
}

/* ========== GLOBAL CHARTS (ROADWAY) ========== */

/* Total projects per year */
function buildTotalProjectsChart() {
  const ctx = document.getElementById("chartTotalProjectsByYear");
  if (!ctx) return;

  const byYear = {};
  roadwayData.forEach(d => {
    if (!byYear[d.year]) byYear[d.year] = 0;
    byYear[d.year] += d.total || 0;
  });

  const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);
  const totals = years.map(y => byYear[y]);

  totalProjectsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: years,
      datasets: [
        {
          label: "Total projects received",
          data: totals,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Plan sets" }
        }
      }
    }
  });
}

/* Year-by-year percentages */
function buildFilesByYearPctChart() {
  const ctx = document.getElementById("chartFilesByYearPct");
  if (!ctx) return;

  const byYear = {};
  roadwayData.forEach(d => {
    if (!byYear[d.year]) {
      byYear[d.year] = {
        totalFiles: 0,
        before: 0,
        after: 0,
        afterAdv: 0,
        unknown: 0
      };
    }
    const bucket = byYear[d.year];
    const t = d.total || 0;
    bucket.totalFiles += t;
    if (d.beforePct != null) bucket.before += (d.beforePct / 100) * t;
    if (d.afterPct != null) bucket.after += (d.afterPct / 100) * t;
    if (d.afterAdvPct != null) bucket.afterAdv += (d.afterAdvPct / 100) * t;
    if (d.unknownPct != null) bucket.unknown += (d.unknownPct / 100) * t;
  });

  const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);

  const beforeArr = [];
  const afterArr = [];
  const afterAdvArr = [];
  const unknownArr = [];

  years.forEach(y => {
    const b = byYear[y];
    const t = b.totalFiles || 1;
    beforeArr.push((b.before / t) * 100);
    afterArr.push((b.after / t) * 100);
    afterAdvArr.push((b.afterAdv / t) * 100);
    unknownArr.push((b.unknown / t) * 100);
  });

  filesByYearPctChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: years,
      datasets: [
        { label: "% Before Plan Due Date", data: beforeArr, borderWidth: 1 },
        { label: "% After Due Date",        data: afterArr,  borderWidth: 1 },
        { label: "% After Advertisement",   data: afterAdvArr, borderWidth: 1 },
        { label: "Unknown Arrival",         data: unknownArr, borderWidth: 1 }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: "Percent of plan sets" }
        }
      }
    }
  });
}

/* Detail charts for whatever year is selected in the dropdown */
function buildOrUpdateYearDetailCharts(year) {
  const ctxPct = document.getElementById("chartFiles2025");
  const ctxTimeline = document.getElementById("chartPlanTimeline2025");
  if (!ctxPct && !ctxTimeline) return;

  const label1 = document.getElementById("detailYearLabel1");
  const label2 = document.getElementById("detailYearLabel2");
  if (label1) label1.textContent = year;
  if (label2) label2.textContent = year;

  const dataYear = roadwayData
    .filter(d => d.year === year)
    .sort((a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month));

  const labels = dataYear.map(d => d.month);

  // percentages
  const beforeArr = dataYear.map(d => d.beforePct ?? 0);
  const afterArr = dataYear.map(d => d.afterPct ?? 0);
  const afterAdvArr = dataYear.map(d => d.afterAdvPct ?? 0);
  const unknownArr = dataYear.map(d => d.unknownPct ?? 0);

  // chart 1: percentages per month
  if (ctxPct) {
    if (filesYearChart) {
      filesYearChart.data.labels = labels;
      filesYearChart.data.datasets[0].data = beforeArr;
      filesYearChart.data.datasets[1].data = afterArr;
      filesYearChart.data.datasets[2].data = afterAdvArr;
      filesYearChart.data.datasets[3].data = unknownArr;
      filesYearChart.update();
    } else {
      filesYearChart = new Chart(ctxPct, {
        type: "bar",
        data: {
          labels,
          datasets: [
            { label: "% Before Plan Due Date", data: beforeArr, borderWidth: 1 },
            { label: "% After Due Date",       data: afterArr,  borderWidth: 1 },
            { label: "% After Advertisement",  data: afterAdvArr, borderWidth: 1 },
            { label: "Unknown Arrival",        data: unknownArr, borderWidth: 1 }
          ]
        },
        options: {
          responsive: true,
          interaction: { mode: "index", intersect: false },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: { display: true, text: "Percent of plan sets" }
            }
          }
        }
      });
    }
  }

  // chart 2: plan receipt timeline (early/late split)
  if (ctxTimeline) {
    const early12Pct = [];
    const early01Pct = [];
    const onDuePct = [];
    const late01Pct = [];
    const late12Pct = [];

    dataYear.forEach(d => {
      const t = d.total || 0;
      if (!t) {
        early12Pct.push(0);
        early01Pct.push(0);
        onDuePct.push(0);
        late01Pct.push(0);
        late12Pct.push(0);
      } else {
        early12Pct.push((d.early12 || 0) / t * 100);
        early01Pct.push((d.early01 || 0) / t * 100);
        onDuePct.push((d.onDue || 0) / t * 100);
        late01Pct.push((d.late01 || 0) / t * 100);
        late12Pct.push((d.late12 || 0) / t * 100);
      }
    });

    if (planTimelineYearChart) {
      planTimelineYearChart.data.labels = labels;
      planTimelineYearChart.data.datasets[0].data = early12Pct;
      planTimelineYearChart.data.datasets[1].data = early01Pct;
      planTimelineYearChart.data.datasets[2].data = onDuePct;
      planTimelineYearChart.data.datasets[3].data = late01Pct;
      planTimelineYearChart.data.datasets[4].data = late12Pct;
      planTimelineYearChart.update();
    } else {
      planTimelineYearChart = new Chart(ctxTimeline, {
        type: "bar",
        data: {
          labels,
          datasets: [
            { label: "1–2 Weeks Early", data: early12Pct, borderWidth: 1 },
            { label: "0–1 Week Early",  data: early01Pct, borderWidth: 1 },
            { label: "On Due Date",     data: onDuePct,   borderWidth: 1 },
            { label: "0–1 Week Late",   data: late01Pct,  borderWidth: 1 },
            { label: "1–2 Weeks Late",  data: late12Pct,  borderWidth: 1 }
          ]
        },
        options: {
          responsive: true,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { position: "bottom" }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: { display: true, text: "Percent of plan sets" }
            }
          }
        }
      });
    }
  }
}

/* ========== IN-STATE VS OUT-STATE: CARDS & SUMMARY ========== */

function updateInstOutCardsAndSummary() {
  const instYearSelect = document.getElementById("instYearSelect");
  const year = Number(instYearSelect.value);

  const rec = instOutData.find(d => d.year === year);

  const totalContractsEl   = document.getElementById("instCardTotalContracts");
  const inShareAmountEl    = document.getElementById("instCardInShareAmount");
  const withInSavingsEl    = document.getElementById("instCardWithInSavings");
  const noInSavingsEl      = document.getElementById("instCardNoInSavings");
  const inShareCountEl     = document.getElementById("instCardInShareCount");
  const withInCountEl      = document.getElementById("instCardWithInCount");
  const headlineEl         = document.getElementById("instSummaryHeadline");
  const insightEl          = document.getElementById("instSummaryInsight");

  if (!rec) {
    totalContractsEl.textContent = "–";
    inShareAmountEl.textContent  = "–";
    withInSavingsEl.textContent  = "–";
    noInSavingsEl.textContent    = "–";
    inShareCountEl.textContent   = "–";
    withInCountEl.textContent    = "–";
    headlineEl.textContent       = "No data for this year.";
    insightEl.textContent        = "";
    return;
  }

  const inShareAmount = rec.totalAmount
    ? (rec.amountIn / rec.totalAmount) * 100
    : 0;

  const inShareCount = rec.totalContracts
    ? (rec.countIn / rec.totalContracts) * 100
    : 0;

  const withInSavings = rec.withInSavings || 0;
  const noInSavings   = rec.noInSavings   || 0;

  // Top cards
  totalContractsEl.textContent = rec.totalContracts.toString();
  inShareAmountEl.textContent  = formatPercent(inShareAmount);
  withInSavingsEl.textContent  = formatCurrency(withInSavings);
  noInSavingsEl.textContent    = formatCurrency(noInSavings);
  inShareCountEl.textContent   = formatPercent(inShareCount);
  withInCountEl.textContent    = rec.withInCount.toString();

  // Headline
  headlineEl.textContent =
    `${year}: ${formatPercent(inShareAmount)} of contract VALUE and ` +
    `${formatPercent(inShareCount)} of contract COUNT went to in-state contractors.`;

  // Narrative / insight
  const shareText =
    inShareAmount < 50
      ? "More than half of contract dollars are still leaving the state. This may indicate an opportunity to grow in-state contractor capacity."
      : "Most contract dollars are staying with in-state contractors. Continued focus on in-state competition could reinforce this trend.";

  const compText =
    rec.withInCount > 0
      ? ` On ${rec.withInCount} contracts with at least one in-state bidder, ARDOT saved ${formatCurrency(withInSavings)} by awarding the contract to the low out-of-state bidder.`
      : " There were no contracts with in-state bidders recorded this year.";

  const noInText =
    rec.noInCount > 0
      ? ` Additionally, there were ${rec.noInCount} contracts totalling ${formatCurrency(noInSavings)} with no in-state bidders.`
      : "";

  insightEl.textContent = shareText + compText + noInText;
}


/* ========== IN-STATE VS OUT-STATE: CHARTS ========== */

function buildInstOutCharts() {
  const barCtx = document.getElementById("instOutBarChart");
  const lineCtx = document.getElementById("instOutLineChart");
  if (!instOutData.length) return;

  const sorted = [...instOutData].sort((a, b) => a.year - b.year);
  const years = sorted.map(r => r.year);
  const amountInArr = sorted.map(r => r.amountIn);
  const amountOutArr = sorted.map(r => r.amountOut);
  const shareAmtArr = sorted.map(r =>
    r.totalAmount ? (r.amountIn / r.totalAmount) * 100 : 0
  );
  const shareCountArr = sorted.map(r =>
    r.totalContracts ? (r.countIn / r.totalContracts) * 100 : 0
  );

  // Stacked bar chart: Amount awarded – in-state vs out-of-state by year
  if (barCtx) {
    instOutBarChart = new Chart(barCtx, {
      type: "bar",
      data: {
        labels: years,
        datasets: [
          {
            label: "Amount awarded to in-state",
            data: amountInArr,
            borderWidth: 1,
            stack: "amount"
          },
          {
            label: "Amount awarded to out-of-state",
            data: amountOutArr,
            borderWidth: 1,
            stack: "amount"
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { position: "bottom" }
        },
        scales: {
          x: { stacked: true },
          y: {
            stacked: true,
            beginAtZero: true,
            title: { display: true, text: "Contract value (dollars)" }
          }
        }
      }
    });
  }

  // Line chart: In-state share (% of amount and % of contracts) over time
  if (lineCtx) {
    instOutLineChart = new Chart(lineCtx, {
      type: "line",
      data: {
        labels: years,
        datasets: [
          {
            label: "In-state share by amount",
            data: shareAmtArr,
            borderWidth: 2,
            fill: false,
            tension: 0.25
          },
          {
            label: "In-state share by contracts",
            data: shareCountArr,
            borderWidth: 2,
            fill: false,
            tension: 0.25
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { position: "bottom" }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: { display: true, text: "In-state share (%)" }
          }
        }
      }
    });
  }
}

/* ========== ADDENDUM DASHBOARD SETUP ========== */

function setupAddendumDashboard() {
  if (!addendumData.length) return;

  const addYearSelect = document.getElementById("addYearSelect");
  const addMonthSelect = document.getElementById("addMonthSelect");
  const addCompareYearSelect = document.getElementById("addCompareYearSelect");

  const years = [...new Set(addendumData.map(d => d.year))].sort((a, b) => a - b);

  populateSelect(addYearSelect, years);
  populateSelect(addCompareYearSelect, years);
  populateSelect(addMonthSelect, MONTHS);

  addYearSelect.value = years[years.length - 1];  // latest year
  addCompareYearSelect.value = years[0];          // earliest year
  addMonthSelect.value = "January";

  updateAddendumGlobalCards();
  updateAddendumView();
  updateAddendumCompareChart();
  buildAddendumTimelineCharts(Number(addYearSelect.value));  // build initial timelines

  addYearSelect.addEventListener("change", () => {
    updateAddendumView();
    updateAddendumCompareChart();
    buildAddendumTimelineCharts(Number(addYearSelect.value));  // update timelines when year changes
  });

  addMonthSelect.addEventListener("change", () => {
    updateAddendumView();
  });

  addCompareYearSelect.addEventListener("change", () => {
    updateAddendumCompareChart();
  });
}

/* ========== ADDENDUM GLOBAL CARDS ========== */
function updateAddendumGlobalCards() {
  const cardTotalAddenda   = document.getElementById("addCardTotalAddenda");
  const cardAvgEarlyPct    = document.getElementById("addCardAvgEarlyPct");
  const addCardBestYear    = document.getElementById("addCardBestYear");
  const addCardWorstYear   = document.getElementById("addCardWorstYear");

  const totalAddenda = addendumData.reduce((sum, d) => sum + (d.total || 0), 0);

  const byYear = {};
  addendumData.forEach(d => {
    if (!byYear[d.year]) {
      byYear[d.year] = { earlyPct: 0, count: 0, lateWeekPct: 0 };
    }
    const earlyTotal =
      (d.advertisementPct || 0) +
      (d.threeWeeksBeforePct || 0) +
      (d.twoWeeksBeforePct || 0);

    byYear[d.year].earlyPct += earlyTotal;
    byYear[d.year].count += 1;

    const lateWeek = (d.oneWeekBeforePct || 0) + (d.lettingWeekPct || 0);
    byYear[d.year].lateWeekPct += lateWeek;
  });

  const yearList = Object.keys(byYear).map(Number);
  let sumAvgEarlyPct = 0;
  let nYears = 0;
  let bestYear = null;
  let bestVal = -Infinity;
  let worstYear = null;
  let worstVal = Infinity;

  yearList.forEach(y => {
    const info = byYear[y];
    if (!info.count) return;

    const avgEarly    = info.earlyPct / info.count;
    const avgLateWeek = info.lateWeekPct / info.count;

    sumAvgEarlyPct += avgEarly;
    nYears += 1;

    if (avgEarly > bestVal) {
      bestVal = avgEarly;
      bestYear = y;
    }

    if (avgLateWeek < worstVal) {
      worstVal = avgLateWeek;
      worstYear = y;
    }
  });

  const overallAvgEarly = nYears ? sumAvgEarlyPct / nYears : null;

  cardTotalAddenda.textContent = totalAddenda.toString();
  cardAvgEarlyPct.textContent =
    overallAvgEarly != null ? `${overallAvgEarly.toFixed(1)}%` : "–";

  // ✅ Now we update only the ADDENDUM cards
  if (addCardBestYear) {
    addCardBestYear.textContent =
      bestYear != null ? `${bestYear} (${bestVal.toFixed(1)}%)` : "–";
  }

  if (addCardWorstYear) {
    addCardWorstYear.textContent =
      worstYear != null ? `${worstYear} (${worstVal.toFixed(1)}% early)` : "–";
  }
}


/* ========== ADDENDUM SELECTED MONTH VIEW ========== */

function updateAddendumView() {
  const addYearSelect = document.getElementById("addYearSelect");
  const addMonthSelect = document.getElementById("addMonthSelect");
  
  const summaryTotal = document.getElementById("addSummaryTotal");
  const summaryEarlyPct = document.getElementById("addSummaryEarlyPct");
  const summaryLatePct = document.getElementById("addSummaryLatePct");
  const summaryInsight = document.getElementById("addSummaryInsight");
  const detailMonthLabel = document.getElementById("addDetailMonthLabel");
  const detailYearLabel = document.getElementById("addDetailYearLabel");

  const year = Number(addYearSelect.value);
  const month = addMonthSelect.value;

  const record = addendumData.find(d => d.year === year && d.month === month);

  if (!record) {
    summaryTotal.textContent = "–";
    summaryEarlyPct.textContent = "–";
    summaryLatePct.textContent = "–";
    summaryInsight.textContent = "No addendum data recorded for this month.";
    summaryInsight.className = "summary-insight";
    updateAddendumMonthChart(null);
    return;
  }

  const earlyPct = (record.advertisementPct || 0) + (record.threeWeeksBeforePct || 0) + (record.twoWeeksBeforePct || 0);
  const latePct = (record.oneWeekBeforePct || 0) + (record.lettingWeekPct || 0);

  summaryTotal.textContent = record.total?.toString() ?? "0";
  summaryEarlyPct.textContent = `${earlyPct.toFixed(1)}%`;
  summaryLatePct.textContent = `${latePct.toFixed(1)}%`;

  detailMonthLabel.textContent = month;
  detailYearLabel.textContent = year;

  let insight = "";
  let cls = "summary-insight";
  if (earlyPct >= 70) {
    insight = "Most addenda were issued well ahead of letting. This shows strong planning and preparation.";
    cls += " good";
  } else if (latePct >= 60) {
    insight = "Most addenda are being issued in the final week. This creates last-minute pressure and risk.";
    cls += " bad";
  } else {
    insight = "Addendum timing is distributed across the letting cycle. There is opportunity to push more issuances earlier.";
  }
  summaryInsight.textContent = insight;
  summaryInsight.className = cls;

  updateAddendumMonthChart(record);
}

/* ========== BAR CHART: ADDENDUM DISTRIBUTION FOR SELECTED MONTH ========== */

function updateAddendumMonthChart(record) {
  const ctx = document.getElementById("addMonthChart");
  if (!ctx) return;

  const labels = [
    "Advertisement",
    "3 Weeks Before",
    "2 Weeks Before",
    "1 Week Before",
    "Letting Week"
  ];

  const data = record
    ? [
        record.advertisement || 0,
        record.threeWeeksBefore || 0,
        record.twoWeeksBefore || 0,
        record.oneWeekBefore || 0,
        record.lettingWeek || 0
      ]
    : [0, 0, 0, 0, 0];

  if (addMonthChart) {
    addMonthChart.data.datasets[0].data = data;
    addMonthChart.update();
    return;
  }

  addMonthChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Number of addenda",
          data,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      }
    }
  });
}

/* ========== LINE CHART: ADDENDUM YEAR VS YEAR (LETTING WEEK %) ========== */

function updateAddendumCompareChart() {
  const addYearSelect = document.getElementById("addYearSelect");
  const addCompareYearSelect = document.getElementById("addCompareYearSelect");
  const ctx = document.getElementById("addCompareChart");
  if (!ctx) return;

  const year1 = Number(addYearSelect.value);
  const year2 = Number(addCompareYearSelect.value);

  // Get all months data for both years
  const dataYear1LettingWeekPct = MONTHS.map(m => {
    const rec = addendumData.find(d => d.year === year1 && d.month === m);
    return rec ? rec.lettingWeekPct : null;
  });

  const dataYear2LettingWeekPct = MONTHS.map(m => {
    const rec = addendumData.find(d => d.year === year2 && d.month === m);
    return rec ? rec.lettingWeekPct : null;
  });

  if (addCompareChart) {
    addCompareChart.data.labels = MONTHS;
    addCompareChart.data.datasets[0].label = `${year1} – Letting Week %`;
    addCompareChart.data.datasets[0].data = dataYear1LettingWeekPct;
    addCompareChart.data.datasets[1].label = `${year2} – Letting Week %`;
    addCompareChart.data.datasets[1].data = dataYear2LettingWeekPct;
    addCompareChart.update();
    return;
  }

  addCompareChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: MONTHS,
      datasets: [
        {
          label: `${year1} – Letting Week %`,
          data: dataYear1LettingWeekPct,
          borderWidth: 2,
          fill: false,
          tension: 0.25,
          spanGaps: true
        },
        {
          label: `${year2} – Letting Week %`,
          data: dataYear2LettingWeekPct,
          borderWidth: 2,
          fill: false,
          tension: 0.25,
          spanGaps: true
        }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "bottom" }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: "% of addenda issued in Letting Week" }
        }
      }
    }
  });
}

/* ========== ADDENDUM TIMELINE CHARTS (SELECTED YEAR + 2021–2025) ========== */

function buildAddendumTimelineCharts(selectedYear) {
  if (!addendumData.length) return;

  const ctxSelected = document.getElementById("addTimeline2025Chart");
  const ctxAllYears = document.getElementById("addTimelineAllYearsChart");

  // ---------- SELECTED YEAR ONLY (monthly stacked %) ----------
  if (ctxSelected) {
    const labelYear = document.getElementById("addTimelineYearLabel");
    if (labelYear) labelYear.textContent = selectedYear;

    const dataYear = addendumData
      .filter(d => d.year === selectedYear)
      .sort((a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month));

    const labels = dataYear.map(d => d.month);
    const advPct     = dataYear.map(d => d.advertisementPct    || 0);
    const wk3Pct     = dataYear.map(d => d.threeWeeksBeforePct || 0);
    const wk2Pct     = dataYear.map(d => d.twoWeeksBeforePct   || 0);
    const wk1Pct     = dataYear.map(d => d.oneWeekBeforePct    || 0);
    const lettingPct = dataYear.map(d => d.lettingWeekPct      || 0);

    if (addTimeline2025Chart) {
      addTimeline2025Chart.data.labels = labels;
      addTimeline2025Chart.data.datasets[0].data = advPct;
      addTimeline2025Chart.data.datasets[1].data = wk3Pct;
      addTimeline2025Chart.data.datasets[2].data = wk2Pct;
      addTimeline2025Chart.data.datasets[3].data = wk1Pct;
      addTimeline2025Chart.data.datasets[4].data = lettingPct;
      addTimeline2025Chart.update();
    } else {
      addTimeline2025Chart = new Chart(ctxSelected, {
        type: "bar",
        data: {
          labels,
          datasets: [
            { label: "Advertisement",  data: advPct,     borderWidth: 1, stack: "year" },
            { label: "3 Weeks Before", data: wk3Pct,     borderWidth: 1, stack: "year" },
            { label: "2 Weeks Before", data: wk2Pct,     borderWidth: 1, stack: "year" },
            { label: "1 Week Before",  data: wk1Pct,     borderWidth: 1, stack: "year" },
            { label: "Letting Week",   data: lettingPct, borderWidth: 1, stack: "year" }
          ]
        },
        options: {
          responsive: true,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { position: "bottom" }
          },
          scales: {
            x: { stacked: true },
            y: {
              stacked: true,
              beginAtZero: true,
              max: 100,
              title: { display: true, text: "Percent of addenda" }
            }
          }
        }
      });
    }
  }

  // ---------- 2021–2025 STACKED TIMELINE (all months, all years) ----------
  if (ctxAllYears) {
    const sorted = [...addendumData].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month);
    });

    const labelsAll = sorted.map(d => `${d.month} ${d.year}`);
    const advPctAll     = sorted.map(d => d.advertisementPct    || 0);
    const wk3PctAll     = sorted.map(d => d.threeWeeksBeforePct || 0);
    const wk2PctAll     = sorted.map(d => d.twoWeeksBeforePct   || 0);
    const wk1PctAll     = sorted.map(d => d.oneWeekBeforePct    || 0);
    const lettingPctAll = sorted.map(d => d.lettingWeekPct      || 0);

    if (addTimelineAllYearsChart) {
      addTimelineAllYearsChart.data.labels = labelsAll;
      addTimelineAllYearsChart.data.datasets[0].data = advPctAll;
      addTimelineAllYearsChart.data.datasets[1].data = wk3PctAll;
      addTimelineAllYearsChart.data.datasets[2].data = wk2PctAll;
      addTimelineAllYearsChart.data.datasets[3].data = wk1PctAll;
      addTimelineAllYearsChart.data.datasets[4].data = lettingPctAll;
      addTimelineAllYearsChart.update();
    } else {
      addTimelineAllYearsChart = new Chart(ctxAllYears, {
        type: "bar",
        data: {
          labels: labelsAll,
          datasets: [
            { label: "Advertisement",  data: advPctAll,     borderWidth: 1, stack: "all" },
            { label: "3 Weeks Before", data: wk3PctAll,     borderWidth: 1, stack: "all" },
            { label: "2 Weeks Before", data: wk2PctAll,     borderWidth: 1, stack: "all" },
            { label: "1 Week Before",  data: wk1PctAll,     borderWidth: 1, stack: "all" },
            { label: "Letting Week",   data: lettingPctAll, borderWidth: 1, stack: "all" }
          ]
        },
        options: {
          responsive: true,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { position: "bottom" }
          },
          scales: {
            x: {
              stacked: true,
              ticks: {
                autoSkip: true,
                maxTicksLimit: 12,
                maxRotation: 0,
                minRotation: 0
              }
            },
            y: {
              stacked: true,
              beginAtZero: true,
              max: 100,
              title: { display: true, text: "Percent of addenda" }
            }
          }
        }
      });
    }
  }
}

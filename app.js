// --- Data Model ---
const STATE_VERSION = 3; // Incremented for new default workers
const DEFAULT_COMPANIES = ["Amazon", "Flipkart", "Swiggy"];
const DEFAULT_WORKERS = [
  { name: "Ravi Kumar", expenses: 0 },
  { name: "Sita Sharma", expenses: 0 },
  { name: "Arjun Singh", expenses: 0 },
  { name: "Priya Patel", expenses: 0 },
  { name: "Vikram Joshi", expenses: 0 },
  { name: "Meena Das", expenses: 0 },
  { name: "Sunil Yadav", expenses: 0 },
  { name: "Asha Reddy", expenses: 0 },
  { name: "Imran Khan", expenses: 0 },
  { name: "Geeta Nair", expenses: 0 },
  { name: "Rahul Verma", expenses: 0 },
];
const DEFAULT_HOURS = {
  0: { 0: 160, 1: 40, 2: 20 },   // Ravi: mostly Amazon
  1: { 0: 60, 1: 120, 2: 40 },   // Sita: mostly Flipkart
  2: { 0: 30, 1: 30, 2: 140 },   // Arjun: mostly Swiggy
  3: { 0: 80, 1: 60, 2: 60 },    // Priya: balanced
  4: { 0: 100, 1: 80, 2: 40 },   // Vikram: Amazon/Flipkart
  5: { 0: 40, 1: 140, 2: 40 },   // Meena: mostly Flipkart
  6: { 0: 50, 1: 50, 2: 100 },   // Sunil: mostly Swiggy
  7: { 0: 120, 1: 20, 2: 60 },   // Asha: Amazon/Swiggy
  8: { 0: 70, 1: 90, 2: 40 },    // Imran: Flipkart
  9: { 0: 30, 1: 60, 2: 110 },   // Geeta: mostly Swiggy
 10: { 0: 90, 1: 60, 2: 50 },    // Rahul: Amazon/Flipkart
};
const STORAGE_KEY = "gig-ss-data-v1";

let state = {
  version: STATE_VERSION,
  month: "April",
  ssRate: 10000,
  workers: [...DEFAULT_WORKERS],
  companies: [...DEFAULT_COMPANIES],
  hours: { ...DEFAULT_HOURS },
};

// --- Storage ---
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function loadState() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      const loaded = JSON.parse(data);
      if (!loaded.version || loaded.version < STATE_VERSION) {
        // Outdated or missing version, reset to defaults
        localStorage.removeItem(STORAGE_KEY);
        state = {
          version: STATE_VERSION,
          month: "April",
          ssRate: 10000,
          workers: [...DEFAULT_WORKERS],
          companies: [...DEFAULT_COMPANIES],
          hours: { ...DEFAULT_HOURS },
        };
      } else {
        state = loaded;
      }
    } catch {
      // If error, use defaults
      state = {
        version: STATE_VERSION,
        month: "April",
        ssRate: 10000,
        workers: [...DEFAULT_WORKERS],
        companies: [...DEFAULT_COMPANIES],
        hours: { ...DEFAULT_HOURS },
      };
    }
  } else {
    // If no saved data, use defaults
    state = {
      version: STATE_VERSION,
      month: "April",
      ssRate: 10000,
      workers: [...DEFAULT_WORKERS],
      companies: [...DEFAULT_COMPANIES],
      hours: { ...DEFAULT_HOURS },
    };
  }
}

// --- UI Rendering ---
function render() {
  // Month
  document.getElementById("month").value = state.month;
  document.getElementById("ss-rate").value = state.ssRate;

  // Table
  const table = document.getElementById("worker-table");
  table.innerHTML = "";
  // Header
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headerRow.innerHTML = `<th>Worker</th>` +
    state.companies.map(c => `<th>${c}</th>`).join("") +
    `<th>Total Hours</th><th>Remove</th>`;
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body
  const tbody = document.createElement("tbody");
  state.workers.forEach((worker, wIdx) => {
    const row = document.createElement("tr");
    // Name cell
    const nameCell = document.createElement("td");
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = worker.name;
    nameInput.placeholder = "Worker Name";
    nameInput.oninput = e => {
      state.workers[wIdx].name = e.target.value;
      saveState();
      updateTableTotalsAndSummary();
      updateTotalFund();
    };
    nameCell.appendChild(nameInput);
    row.appendChild(nameCell);
    // Hours cells
    let totalHours = 0;
    const totalCell = document.createElement("td");
    for (let cIdx = 0; cIdx < state.companies.length; cIdx++) {
      const hoursCell = document.createElement("td");
      const hoursInput = document.createElement("input");
      hoursInput.type = "number";
      hoursInput.min = 0;
      hoursInput.value = (state.hours[wIdx] && state.hours[wIdx][cIdx]) || "";
      hoursInput.oninput = e => {
        if (!state.hours[wIdx]) state.hours[wIdx] = {};
        state.hours[wIdx][cIdx] = Number(e.target.value);
        saveState();
        // Live update summary and totals
        updateTableTotalsAndSummary();
        // Update this row's total hours cell using state
        let sum = 0;
        for (let i = 0; i < state.companies.length; i++) {
          sum += (state.hours[wIdx] && state.hours[wIdx][i]) || 0;
        }
        totalCell.textContent = sum;
        updateTotalFund();
      };
      hoursCell.appendChild(hoursInput);
      row.appendChild(hoursCell);
      totalHours += Number(hoursInput.value) || 0;
    }
    // Total hours cell
    totalCell.textContent = totalHours;
    row.appendChild(totalCell);
    // Remove button
    const removeCell = document.createElement("td");
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "✕";
    removeBtn.className = "remove-worker";
    removeBtn.onclick = () => {
      state.workers.splice(wIdx, 1);
      delete state.hours[wIdx];
      // Re-index hours
      const newHours = {};
      Object.keys(state.hours).forEach((k, i) => {
        newHours[i] = state.hours[k];
      });
      state.hours = newHours;
      saveState();
      render();
    };
    removeCell.appendChild(removeBtn);
    row.appendChild(removeCell);
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  // Footer: Add company columns total
  const tfoot = document.createElement("tfoot");
  const totalRow = document.createElement("tr");
  totalRow.innerHTML = `<th>Total</th>`;
  let companyTotals = Array(state.companies.length).fill(0);
  let grandTotal = 0;
  for (let cIdx = 0; cIdx < state.companies.length; cIdx++) {
    let colTotal = 0;
    for (let wIdx = 0; wIdx < state.workers.length; wIdx++) {
      colTotal += (state.hours[wIdx] && state.hours[wIdx][cIdx]) || 0;
    }
    companyTotals[cIdx] = colTotal;
    grandTotal += colTotal;
    totalRow.innerHTML += `<th>${colTotal}</th>`;
  }
  totalRow.innerHTML += `<th>${grandTotal}</th><th></th>`;
  tfoot.appendChild(totalRow);
  table.appendChild(tfoot);

  // Summary
  renderSummary(companyTotals, grandTotal);
}

function renderSummary(companyTotals, grandTotal) {
  const summary = document.getElementById("summary-content");
  const numWorkers = state.workers.length;
  const ssRate = Number(state.ssRate) || 0;
  const totalFund = numWorkers * ssRate;
  let html = `<div><b>Total Fund:</b> ₹${totalFund.toLocaleString()}</div>`;
  html += `<div><b>Companies' Share:</b></div><ul style="padding-left:18px;">`;
  for (let cIdx = 0; cIdx < state.companies.length; cIdx++) {
    const share = grandTotal ? (companyTotals[cIdx] / grandTotal) * totalFund : 0;
    html += `<li>${state.companies[cIdx]}: ₹${share.toLocaleString(undefined, {maximumFractionDigits:0})} (${companyTotals[cIdx]} hrs)</li>`;
  }
  html += `</ul>`;
  summary.innerHTML = html;
}

// Add this helper function after renderSummary
function updateTableTotalsAndSummary() {
  // Recalculate totals for the table footer and summary
  const table = document.getElementById("worker-table");
  const tfoot = table.querySelector("tfoot");
  if (!tfoot) return;
  let companyTotals = Array(state.companies.length).fill(0);
  let grandTotal = 0;
  for (let cIdx = 0; cIdx < state.companies.length; cIdx++) {
    let colTotal = 0;
    for (let wIdx = 0; wIdx < state.workers.length; wIdx++) {
      colTotal += (state.hours[wIdx] && state.hours[wIdx][cIdx]) || 0;
    }
    companyTotals[cIdx] = colTotal;
    grandTotal += colTotal;
  }
  // Update table footer
  const totalRow = tfoot.querySelector("tr");
  if (totalRow) {
    let html = `<th>Total</th>`;
    for (let cIdx = 0; cIdx < state.companies.length; cIdx++) {
      html += `<th>${companyTotals[cIdx]}</th>`;
    }
    html += `<th>${grandTotal}</th><th></th>`;
    totalRow.innerHTML = html;
  }
  // Update summary
  renderSummary(companyTotals, grandTotal);
}

// --- Controls ---
document.getElementById("add-worker").onclick = () => {
  state.workers.push({ name: "", expenses: 0 });
  saveState();
  render();
};
document.getElementById("ss-rate").oninput = e => {
  state.ssRate = Number(e.target.value);
  saveState();
  renderSummaryLive();
  updateTotalFund();
};
document.getElementById("month").onchange = e => {
  state.month = e.target.value;
  saveState();
  render();
};
document.getElementById("save").onclick = () => {
  saveState();
  alert("Data saved!");
};
document.getElementById("reset").onclick = () => {
  if (confirm("Reset all data?")) {
    state = {
      version: STATE_VERSION,
      month: "April",
      ssRate: 10000,
      workers: [...DEFAULT_WORKERS],
      companies: [...DEFAULT_COMPANIES],
      hours: { ...DEFAULT_HOURS },
    };
    saveState();
    render();
  }
};

// --- Init ---
function init() {
  loadState();
  // If no companies, set default
  if (!state.companies || !state.companies.length) {
    state.companies = [...DEFAULT_COMPANIES];
  }
  // If no workers, add defaults
  if (!state.workers || !state.workers.length) {
    state.workers = [...DEFAULT_WORKERS];
    state.hours = { ...DEFAULT_HOURS };
  }
  render();
}

init(); 

// Helper to update only the total fund in the summary
function updateTotalFund() {
  const summary = document.getElementById("summary-content");
  if (!summary) return;
  const numWorkers = state.workers.length;
  const ssRate = Number(state.ssRate) || 0;
  const totalFund = numWorkers * ssRate;
  // Replace the total fund line only
  summary.innerHTML = summary.innerHTML.replace(/<div><b>Total Fund:<\/b>.*?<\/div>/,
    `<div><b>Total Fund:</b> ₹${totalFund.toLocaleString()}</div>`);
}
// Helper to update summary live (company shares)
function renderSummaryLive() {
  // Recalculate company totals and grand total
  let companyTotals = Array(state.companies.length).fill(0);
  let grandTotal = 0;
  for (let cIdx = 0; cIdx < state.companies.length; cIdx++) {
    let colTotal = 0;
    for (let wIdx = 0; wIdx < state.workers.length; wIdx++) {
      colTotal += (state.hours[wIdx] && state.hours[wIdx][cIdx]) || 0;
    }
    companyTotals[cIdx] = colTotal;
    grandTotal += colTotal;
  }
  renderSummary(companyTotals, grandTotal);
} 
const API = "http://127.0.0.1:8000/api";
let locations = [];
let scenarios = {};
let map;
let markers = [];
let selectedScenario = "normal";

const el = id => document.getElementById(id);

function setStatus(message, state = "info") {
  const status = el("status");
  status.textContent = message;
  status.className = `status ${state}`;
}

async function loadData() {
  const [healthRes, locRes, scRes] = await Promise.all([
    fetch(`${API}/health`),
    fetch(`${API}/locations`),
    fetch(`${API}/scenarios`)
  ]);
  if (!healthRes.ok || !locRes.ok || !scRes.ok) throw new Error("The local backend returned an error.");
  locations = (await locRes.json()).locations;
  scenarios = await scRes.json();
  fillLocations();
  initMap();
  applyScenario("normal");
  setStatus("Backend connected · demonstration data loaded", "success");
}

function fillLocations() {
  el("location").innerHTML = locations.map(l =>
    `<option value="${l.id}">${l.name}, ${l.district}</option>`
  ).join("");
}

function initMap() {
  if (typeof L === "undefined") {
    el("map").hidden = true;
    el("mapFallback").hidden = false;
    return;
  }
  map = L.map("map").setView([9.95, 77.02], 9);
  const tiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  tiles.on("tileerror", () => {
    el("mapFallback").hidden = false;
  });
  markers = locations.map(l => L.marker([l.lat, l.lon]).addTo(map)
    .bindPopup(`<b>${l.name}</b><br>${l.district}<br>Elevation: ${l.elevation_m} m<br>Slope: ${l.slope_deg}°`));
}

function applyScenario(name) {
  const s = scenarios[name];
  if (!s) return;
  selectedScenario = name;
  ["normal", "heavy", "extreme"].forEach(n => {
    document.querySelector(`[data-scenario="${n}"]`).classList.toggle("active", n === name);
  });
  Object.keys(s).forEach(k => { if (el(k)) el(k).value = s[k]; });
  predict().catch(showError);
}

function showError(error) {
  setStatus(error.message, "error");
}

async function predict() {
  const payload = {
    location_id: Number(el("location").value),
    rain_1h_mm: Number(el("rain_1h_mm").value),
    rain_24h_mm: Number(el("rain_24h_mm").value),
    forecast_6h_mm: Number(el("forecast_6h_mm").value),
    soil_moisture_pct: Number(el("soil_moisture_pct").value),
    river_level_m: Number(el("river_level_m").value)
  };
  const res = await fetch(`${API}/predict`, {
    method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Prediction failed");
  render(data);
  setStatus(`Backend connected · ${selectedScenario} scenario calculated`, "success");
}

function render(data) {
  el("score").textContent = data.risk_score;
  el("riskClass").textContent = data.risk_class;
  el("riskClass").className = `risk ${data.risk_class.toLowerCase()}`;
  el("locationDetails").textContent = `${data.location.name}, ${data.location.district} · Elevation ${data.location.elevation_m} m · Slope ${data.location.slope_deg}° · River alert ${data.location.river_alert_level_m} m`;
  el("method").textContent = data.method + (data.optional_ml_class ? ` · Optional RF: ${data.optional_ml_class}` : "");
  el("reasons").innerHTML = data.reasons.map(r => `<li>${r}</li>`).join("");
  el("action").textContent = data.action;
  el("components").innerHTML = Object.entries(data.components).map(([name, value]) => `
    <div><strong>${name}</strong> — ${value.toFixed(1)} points
      <div class="bar"><span style="width:${Math.min(value * 2,100)}%"></span></div>
    </div>`).join("");

  const location = data.location;
  const marker = locations.findIndex(x => Number(x.id) === Number(location.id));
  if (markers[marker]) markers[marker].openPopup();
}

function resetForm() {
  el("location").selectedIndex = 0;
  applyScenario("normal");
}

["normal", "heavy", "extreme"].forEach(name => {
  document.querySelector(`[data-scenario="${name}"]`).addEventListener("click", () => applyScenario(name));
});
el("location").addEventListener("change", () => predict().catch(showError));
el("predict").addEventListener("click", () => predict().catch(showError));
el("reset").addEventListener("click", resetForm);
loadData().catch(showError);

const API = "http://127.0.0.1:8000/api";
let locations = [];
let scenarios = {};
let map;
let markers = [];

const el = id => document.getElementById(id);

async function loadData() {
  const [locRes, scRes] = await Promise.all([
    fetch(`${API}/locations`),
    fetch(`${API}/scenarios`)
  ]);
  if (!locRes.ok || !scRes.ok) throw new Error("Backend is not running or cannot be reached.");
  locations = (await locRes.json()).locations;
  scenarios = await scRes.json();
  fillLocations();
  initMap();
  applyScenario("normal");
}

function fillLocations() {
  el("location").innerHTML = locations.map(l =>
    `<option value="${l.id}">${l.name}, ${l.district}</option>`
  ).join("");
}

function initMap() {
  map = L.map("map").setView([9.95, 77.02], 9);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  markers = locations.map(l => L.marker([l.lat, l.lon]).addTo(map)
    .bindPopup(`<b>${l.name}</b><br>${l.district}<br>Elevation: ${l.elevation_m} m<br>Slope: ${l.slope_deg}°`));
}

function applyScenario(name) {
  const s = scenarios[name];
  ["normal", "heavy", "extreme"].forEach(n => {
    document.querySelector(`[data-scenario="${n}"]`).classList.toggle("active", n === name);
  });
  Object.keys(s).forEach(k => { if (el(k)) el(k).value = s[k]; });
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
}

function render(data) {
  el("score").textContent = data.risk_score;
  el("riskClass").textContent = data.risk_class;
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

["normal", "heavy", "extreme"].forEach(name => {
  document.querySelector(`[data-scenario="${name}"]`).addEventListener("click", () => applyScenario(name));
});
el("predict").addEventListener("click", () => predict().catch(err => alert(err.message)));
loadData().catch(err => alert(err.message));

# SIH26192 Flash Flood Risk Assessment Prototype

A beginner-friendly local prototype for Smart India Hackathon problem statement SIH26192.

## What this is

This project is a **prototype flash-flood risk assessment system**. It combines rainfall, forecast rainfall, soil moisture, terrain and river level using a transparent weighted score from 0-100.

It intentionally does **not** claim to be a validated operational flood warning system.

## Architecture

CSV/JSON -> FastAPI -> transparent scoring (+ optional Random Forest comparison) -> browser dashboard -> Leaflet map

### MVP features

- Inputs for 1-hour rainfall, 24-hour rainfall, 6-hour forecast, soil moisture and river level.
- Location-based terrain values: elevation, slope and river alert level from `locations.csv`.
- A 0-100 score with Low (`0-34`), Moderate (`35-64`) or High (`65-100`).
- Top reasons, weighted contributions and a suggested action.
- Normal, heavy and extreme simulated scenarios.
- Five Idukki locations on an OpenStreetMap/Leaflet map.
- Health, locations, scenarios and prediction endpoints.

### Formula

Each input is converted to a 0-100 sub-score and multiplied by its weight:

`risk = recent*0.35 + rain24*0.15 + forecast*0.20 + soil*0.15 + terrain*0.10 + river*0.05`

The weights are exactly `35 + 15 + 20 + 15 + 10 + 5 = 100`. Rainfall and forecast dominate because intense or continuing rain is the main short-term trigger. Wet soil has less capacity to absorb water. Slope and elevation represent demo terrain susceptibility. River level captures existing channel pressure.

## Risk formula

- Recent rainfall: 35%
- 24-hour rainfall: 15%
- Forecast rainfall: 20%
- Soil moisture: 15%
- Terrain: 10%
- River level: 5%

Total = exactly 100%.

## Setup

### Linux/macOS

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Windows PowerShell

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Optional Random Forest

```bash
python ml/train_model.py
```

The training file is a **tiny demonstration dataset**. It is not historical validation data. The Random Forest is therefore shown only as an optional comparison in the UI.

## First coding session

1. Create and activate `.venv`, then install `requirements.txt`.
2. Run the three scenario calculations in the dashboard and record the scores.
3. Open `/docs`, call `/api/health`, `/api/locations`, `/api/scenarios`, and `/api/predict`.
4. Train the optional model only after the rule-based demo works.
5. Rehearse the demo with one person changing scenarios and one person explaining the formula.

## API smoke tests

With the backend running, use these commands in a second terminal:

```bash
curl http://127.0.0.1:8000/api/health
curl http://127.0.0.1:8000/api/locations
curl http://127.0.0.1:8000/api/scenarios
curl -X POST http://127.0.0.1:8000/api/predict \
	-H "Content-Type: application/json" \
	-d '{"location_id":1,"rain_1h_mm":45,"rain_24h_mm":150,"forecast_6h_mm":90,"soil_moisture_pct":68,"river_level_m":4.7}'
```

The Windows PowerShell equivalent for the POST is:

```powershell
$body = @{ location_id=1; rain_1h_mm=45; rain_24h_mm=150; forecast_6h_mm=90; soil_moisture_pct=68; river_level_m=4.7 } | ConvertTo-Json
Invoke-RestMethod http://127.0.0.1:8000/api/predict -Method Post -ContentType 'application/json' -Body $body
```

## Run backend

```bash
uvicorn backend.main:app --reload
```

Backend: http://127.0.0.1:8000
Swagger docs: http://127.0.0.1:8000/docs

## Run frontend

Keep the backend running, then in another terminal:

```bash
cd frontend
python3 -m http.server 5500
```

Open http://127.0.0.1:5500

On Windows, the same `python -m http.server 5500` works if Python is installed.

## Demo flow

1. Open the dashboard.
2. Select Munnar or another location.
3. Click Normal -> Calculate Flood Risk.
4. Click Heavy -> Calculate.
5. Click Extreme -> Calculate.
6. Explain how the score changes and which factors contributed most.
7. Show the map and explain that the values are demo inputs.
8. Open `/docs` and show the API if a judge asks about the backend.

## Data plan and limitations

The checked-in CSV and JSON are **simulated demonstration inputs**, not measured observations. A future data pipeline could replace them with IMD or KSDMA rainfall and flood records, NASA or Copernicus soil-moisture products, SRTM elevation/slope, river observations from responsible authorities, and OpenStreetMap locations. The team should cite each dataset, align timestamps and locations, clean missing values, and validate thresholds with domain experts before making any operational claim.

## Common issues

- `ModuleNotFoundError`: activate the virtual environment and run `pip install -r requirements.txt`.
- Frontend says backend cannot be reached: start Uvicorn first.
- PowerShell blocks activation: run `Set-ExecutionPolicy -Scope Process Bypass` then activate.
- Port busy: `uvicorn backend.main:app --reload --port 8001` and update `API` in `frontend/app.js`.
- Map tiles missing: ensure the demo laptop has internet access; the application itself still runs locally, but Leaflet's default map tiles are fetched from OpenStreetMap.

## Honest limitations

- Demonstration scenario values are simulated.
- The rule thresholds are prototype assumptions, not official warning thresholds.
- The Random Forest is trained on a tiny demonstration dataset and should not be used to claim accuracy.
- Real deployment needs validated flood-event labels, quality-controlled rainfall/river observations, spatial processing, uncertainty estimation and validation with disaster-management experts.

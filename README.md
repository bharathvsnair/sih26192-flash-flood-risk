# SIH26192 Flash Flood Risk Assessment Prototype

A beginner-friendly local prototype for Smart India Hackathon problem statement SIH26192.

## What this is

This project is a **prototype flash-flood risk assessment system**. It combines rainfall, forecast rainfall, soil moisture, terrain and river level using a transparent weighted score from 0-100.

It intentionally does **not** claim to be a validated operational flood warning system.

## Architecture

CSV/JSON -> FastAPI -> transparent scoring (+ optional Random Forest comparison) -> browser dashboard -> Leaflet map

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

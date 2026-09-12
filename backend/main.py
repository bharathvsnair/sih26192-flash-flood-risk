from pathlib import Path
import json
import sys
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
ML = ROOT / "ml"
sys.path.append(str(ML))
from predict import calculate_risk, load_optional_model  # noqa: E402

app = FastAPI(title="SIH26192 Flash Flood Risk Prototype", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionInput(BaseModel):
    location_id: int = Field(1, ge=1)
    rain_1h_mm: float = Field(..., ge=0)
    rain_24h_mm: float = Field(..., ge=0)
    forecast_6h_mm: float = Field(..., ge=0)
    soil_moisture_pct: float = Field(..., ge=0, le=100)
    river_level_m: float = Field(..., ge=0)


def load_locations():
    import pandas as pd
    return pd.read_csv(DATA / "locations.csv").to_dict("records")


def get_location(location_id):
    for row in load_locations():
        if int(row["id"]) == location_id:
            return row
    raise HTTPException(status_code=404, detail="Location not found")

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "SIH26192 prototype"}

@app.get("/api/locations")
def locations():
    return {"locations": load_locations()}

@app.get("/api/scenarios")
def scenarios():
    with open(DATA / "scenarios.json", "r", encoding="utf-8") as f:
        return json.load(f)

@app.post("/api/predict")
def predict(payload: PredictionInput):
    location = get_location(payload.location_id)
    features = {
        "rain_1h_mm": payload.rain_1h_mm,
        "rain_24h_mm": payload.rain_24h_mm,
        "forecast_6h_mm": payload.forecast_6h_mm,
        "soil_moisture_pct": payload.soil_moisture_pct,
        "slope_deg": float(location["slope_deg"]),
        "elevation_m": float(location["elevation_m"]),
        "river_level_m": payload.river_level_m,
        "river_alert_level_m": float(location["river_alert_level_m"]),
    }
    result = calculate_risk(features)
    result["location"] = location
    result["disclaimer"] = "Demo prototype. Inputs may be simulated; this is not an operational flood-warning service."

    # Optional ML comparison only. We do not let the demo model silently override the transparent score.
    try:
        model = load_optional_model()
        if model is not None:
            import pandas as pd
            cols = ["rain_1h_mm", "rain_24h_mm", "forecast_6h_mm", "soil_moisture_pct", "slope_deg", "elevation_m", "river_level_m", "river_alert_level_m"]
            ml_pred = model.predict(pd.DataFrame([[features[c] for c in cols]], columns=cols))[0]
            result["optional_ml_class"] = str(ml_pred)
    except Exception as exc:
        result["optional_ml_class"] = None
        result["ml_note"] = f"Optional ML comparison unavailable: {exc}"
    return result

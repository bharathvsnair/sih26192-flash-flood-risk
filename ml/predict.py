from pathlib import Path
import math

FEATURE_LIMITS = {
    "rain_1h_mm": 80.0,
    "rain_24h_mm": 250.0,
    "forecast_6h_mm": 150.0,
}


def clamp(x, lo=0.0, hi=100.0):
    return max(lo, min(hi, float(x)))


def normalize(value, maximum):
    return clamp((float(value) / maximum) * 100.0)


def terrain_score(slope_deg, elevation_m):
    # Demo heuristic: steep slopes increase rapid runoff; low elevations increase inundation susceptibility.
    slope_component = clamp((float(slope_deg) / 45.0) * 100.0)
    elevation_component = clamp(100.0 - (float(elevation_m) / 1600.0) * 100.0)
    return 0.7 * slope_component + 0.3 * elevation_component


def calculate_risk(features):
    recent = normalize(features["rain_1h_mm"], FEATURE_LIMITS["rain_1h_mm"])
    rain24 = normalize(features["rain_24h_mm"], FEATURE_LIMITS["rain_24h_mm"])
    forecast = normalize(features["forecast_6h_mm"], FEATURE_LIMITS["forecast_6h_mm"])
    soil = clamp(features["soil_moisture_pct"])
    terrain = terrain_score(features["slope_deg"], features["elevation_m"])

    alert = max(float(features["river_alert_level_m"]), 0.1)
    river = clamp((float(features["river_level_m"]) / alert) * 100.0)

    components = {
        "Recent rainfall": recent * 0.35,
        "24-hour rainfall": rain24 * 0.15,
        "Forecast rainfall": forecast * 0.20,
        "Soil moisture": soil * 0.15,
        "Terrain": terrain * 0.10,
        "River level": river * 0.05,
    }

    score = round(sum(components.values()))
    score = int(clamp(score))
    risk_class = "Low" if score < 35 else "Moderate" if score < 65 else "High"

    explanation = sorted(components.items(), key=lambda x: x[1], reverse=True)
    reasons = []
    for name, contribution in explanation[:3]:
        if contribution >= 15:
            reasons.append(f"{name} is contributing strongly to risk.")
        elif contribution >= 7:
            reasons.append(f"{name} is adding noticeable risk.")
    if not reasons:
        reasons.append("All monitored indicators are currently relatively low.")

    action = {
        "Low": "Continue routine monitoring. No immediate action in this prototype.",
        "Moderate": "Increase monitoring and check local rainfall and river updates.",
        "High": "Treat as a warning signal: monitor official alerts and avoid exposed low-lying or river-adjacent areas."
    }[risk_class]

    return {
        "risk_score": score,
        "risk_class": risk_class,
        "components": {k: round(v, 1) for k, v in components.items()},
        "raw_indicators": {
            "recent_rain_score": round(recent, 1),
            "rain_24h_score": round(rain24, 1),
            "forecast_score": round(forecast, 1),
            "soil_score": round(soil, 1),
            "terrain_score": round(terrain, 1),
            "river_score": round(river, 1),
        },
        "reasons": reasons,
        "action": action,
        "method": "Transparent weighted rule-based prototype"
    }


def load_optional_model():
    model_path = Path(__file__).resolve().parent / "flood_model.pkl"
    if not model_path.exists():
        return None
    import joblib
    return joblib.load(model_path)

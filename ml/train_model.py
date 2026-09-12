from pathlib import Path
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "training_data.csv"
MODEL = ROOT / "ml" / "flood_model.pkl"

features = [
    "rain_1h_mm", "rain_24h_mm", "forecast_6h_mm", "soil_moisture_pct",
    "slope_deg", "elevation_m", "river_level_m", "river_alert_level_m"
]

df = pd.read_csv(DATA)
X = df[features]
y = df["risk_class"]

model = RandomForestClassifier(n_estimators=120, random_state=42, max_depth=5)
model.fit(X, y)
joblib.dump(model, MODEL)
print(f"Saved model to: {MODEL}")
print("Important: this model is trained on a tiny demonstration dataset, not a validated historical flood-event dataset.")

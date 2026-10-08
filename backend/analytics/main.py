"""
AQUASENSE - FastAPI Analytics Service
AI-Powered Water-Borne Disease Outbreak Early Warning System
"""

import os
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

from risk_model import calculate_outbreak_risk
from anomaly_detection import detect_time_series_anomalies, scan_locality_anomalies
from hotspot_detection import detect_outbreak_hotspots

app = FastAPI(
    title="AQUASENSE Analytics & Risk Intelligence Service",
    description="Early warning and outbreak risk engine for water-borne disease surveillance",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Schemas ---

class PredictRiskRequest(BaseModel):
    case_count: int = Field(..., ge=0, description="Total active cases in locality window")
    previous_case_count: int = Field(0, ge=0, description="Cases in previous equivalent window")
    growth_rate: float = Field(0.0, description="Percentage growth rate")
    similar_cases: int = Field(0, ge=0, description="Count of cases with matching symptoms nearby")
    severity: str = Field("MODERATE", description="Clinical severity level (LOW, MODERATE, HIGH, CRITICAL)")
    location_density: float = Field(0.5, ge=0.0, le=1.0, description="Geographic case clustering density (0.0 to 1.0)")
    flooding: Optional[bool] = Field(False, description="Flooding reported in locality")
    water_quality_concern: Optional[bool] = Field(False, description="Contaminated water source concern reported")

class PredictRiskResponse(BaseModel):
    risk_score: int
    risk_level: str
    reason: str
    breakdown: Optional[Dict[str, float]] = None
    disclaimer: Optional[str] = None

class AnomalyDetectionRequest(BaseModel):
    history: List[Dict[str, Any]] = Field(..., description="Daily historical case counts [{date, count}]")
    threshold_z_score: Optional[float] = 2.0

class HotspotDetectionRequest(BaseModel):
    cases: List[Dict[str, Any]] = Field(..., description="Array of case records with coordinates and locality")
    threshold: Optional[int] = 4

# --- Endpoints ---

@app.get("/health")
def health_check():
    return {
        "status": "OK",
        "service": "AQUASENSE Analytics Service",
        "version": "1.0.0"
    }

@app.get("/")
def root():
    return {
        "message": "AQUASENSE Outbreak Analytics API",
        "documentation": "/docs",
        "status": "operational"
    }

@app.post("/predict-risk", response_model=PredictRiskResponse)
def predict_risk(req: PredictRiskRequest):
    """
    Core Risk Prediction API:
    Calculates multi-factor outbreak risk (0-100) and assigns alert classification.
    """
    try:
        result = calculate_outbreak_risk(
            case_count=req.case_count,
            previous_case_count=req.previous_case_count,
            growth_rate=req.growth_rate,
            similar_cases=req.similar_cases,
            severity=req.severity,
            location_density=req.location_density,
            flooding=bool(req.flooding),
            water_quality_concern=bool(req.water_quality_concern)
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Risk calculation error: {str(e)}"
        )

@app.post("/detect-anomalies")
def detect_anomalies(req: AnomalyDetectionRequest):
    """
    Anomaly Detection API:
    Detects abnormal surges over historical baseline using statistical z-score & Isolation Forest.
    """
    try:
        result = detect_time_series_anomalies(
            history_data=req.history,
            threshold_z_score=req.threshold_z_score or 2.0
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Anomaly detection error: {str(e)}"
        )

@app.post("/detect-hotspots")
def detect_hotspots(req: HotspotDetectionRequest):
    """
    Hotspot Detection API:
    Clusters cases by locality and coordinates to isolate high-risk outbreak epicenters.
    """
    try:
        hotspots = detect_outbreak_hotspots(
            cases_data=req.cases,
            hotspot_threshold=req.threshold or 4
        )
        return {
            "success": True,
            "total_hotspots": len(hotspots),
            "hotspots": hotspots
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hotspot detection error: {str(e)}"
        )

@app.get("/model-info")
def model_info():
    return {
        "engine": "AQUASENSE Multi-Factor Outbreak Risk Engine",
        "factors": [
            "Case Volume (0-15 pts)",
            "Growth Rate & Acceleration (0-25 pts)",
            "Geographic Clustering & Similar Cases (0-20 pts)",
            "Clinical Severity (0-25 pts)",
            "Environmental Risk Indicators (0-15 pts)"
        ],
        "scale": {
            "0-30": "LOW",
            "31-50": "MODERATE",
            "51-75": "HIGH",
            "76-100": "CRITICAL"
        },
        "disclaimer": "AQUASENSE is an early warning / decision support system for public health surveillance and does not provide medical diagnoses."
    }

if __name__ == "__main__":
    port = int(os.getenv("ANALYTICS_PORT", 8000))
    current_dir = os.path.dirname(os.path.abspath(__file__))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True, app_dir=current_dir)

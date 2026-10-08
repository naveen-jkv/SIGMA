"""
AQUASENSE - Hotspot Detection Engine
Groups cases by locality and geographic coordinates to identify outbreak epicenters.
"""

from typing import List, Dict, Any
import numpy as np
import pandas as pd

def detect_outbreak_hotspots(
    cases_data: List[Dict[str, Any]],
    hotspot_threshold: int = 5
) -> List[Dict[str, Any]]:
    """
    Groups cases by locality and coordinates, identifies density clusters,
    and returns high-risk outbreak hotspots.
    """
    if not cases_data:
        return []

    df = pd.DataFrame(cases_data)
    required_cols = ["locality", "latitude", "longitude"]
    for col in required_cols:
        if col not in df.columns:
            return []

    # Filter out missing lat/lon
    df = df.dropna(subset=["latitude", "longitude", "locality"])
    if df.empty:
        return []

    # Clean data types
    df["latitude"] = pd.to_numeric(df["latitude"], errors="coerce")
    df["longitude"] = pd.to_numeric(df["longitude"], errors="coerce")
    df = df.dropna(subset=["latitude", "longitude"])

    hotspots = []
    # Group by locality
    grouped = df.groupby("locality")

    for locality, group in grouped:
        case_count = len(group)
        lat_mean = float(group["latitude"].mean())
        lon_mean = float(group["longitude"].mean())

        # Calculate severity distribution or average risk
        if "riskScore" in group.columns:
            avg_risk = float(group["riskScore"].mean())
        elif "risk_score" in group.columns:
            avg_risk = float(group["risk_score"].mean())
        else:
            avg_risk = 0.0

        # Determine risk level based on volume and severity
        if avg_risk > 0:
            if avg_risk >= 76 or case_count >= 15:
                risk_level = "CRITICAL"
            elif avg_risk >= 51 or case_count >= 8:
                risk_level = "HIGH"
            elif avg_risk >= 31 or case_count >= 4:
                risk_level = "MODERATE"
            else:
                risk_level = "LOW"
        else:
            if case_count >= 15:
                risk_level = "CRITICAL"
            elif case_count >= 8:
                risk_level = "HIGH"
            elif case_count >= 4:
                risk_level = "MODERATE"
            else:
                risk_level = "LOW"

        # Predominant symptoms
        all_symptoms = []
        if "symptoms" in group.columns:
            for syms in group["symptoms"]:
                if isinstance(syms, list):
                    all_symptoms.extend(syms)
                elif isinstance(syms, str):
                    all_symptoms.append(syms)

        top_symptom = "Gastrointestinal"
        if all_symptoms:
            top_symptom = pd.Series(all_symptoms).mode().iloc[0]

        # Calculate approximate cluster spread/radius (degrees)
        lat_spread = float(group["latitude"].std()) if len(group) > 1 else 0.0
        lon_spread = float(group["longitude"].std()) if len(group) > 1 else 0.0
        spread_radius_km = round(max(0.1, (np.nan_to_num(lat_spread) + np.nan_to_num(lon_spread)) * 111.0 / 2), 2)

        # Flag as hotspot if case count meets threshold or risk is high/critical
        is_hotspot = case_count >= hotspot_threshold or risk_level in ["HIGH", "CRITICAL"]

        hotspots.append({
            "locality": locality,
            "case_count": int(case_count),
            "risk_level": risk_level,
            "average_risk_score": round(avg_risk, 1),
            "coordinates": {
                "latitude": round(lat_mean, 6),
                "longitude": round(lon_mean, 6)
            },
            "cluster_radius_km": spread_radius_km,
            "predominant_symptom": top_symptom,
            "is_active_hotspot": is_hotspot
        })

    # Sort descending by case_count and risk
    risk_rank = {"CRITICAL": 4, "HIGH": 3, "MODERATE": 2, "LOW": 1}
    hotspots.sort(key=lambda h: (risk_rank.get(h["risk_level"], 0), h["case_count"]), reverse=True)

    return hotspots

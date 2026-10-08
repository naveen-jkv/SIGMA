"""
AQUASENSE - Anomaly Detection Engine
Combines explainable statistical baseline comparison with Scikit-learn Isolation Forest.
"""

from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

def detect_time_series_anomalies(
    history_data: List[Dict[str, Any]],
    threshold_z_score: float = 2.0,
    min_baseline_samples: int = 3
) -> Dict[str, Any]:
    """
    Explainable Baseline Comparison:
    Compares recent case counts against historical baseline.
    
    Example:
    Historical baseline average = 5 cases/day, Std Dev = 1.8
    Current count = 18 cases/day
    Z-score = (18 - 5) / 1.8 = 7.22 (> 2.0) -> ANOMALY DETECTED!
    """
    if not history_data:
        return {
            "is_anomaly": False,
            "anomaly_score": 0.0,
            "current_count": 0,
            "baseline_mean": 0.0,
            "z_score": 0.0,
            "message": "No historical data provided"
        }

    df = pd.DataFrame(history_data)
    if "count" not in df.columns:
        if "case_count" in df.columns:
            df["count"] = df["case_count"]
        else:
            return {"is_anomaly": False, "message": "Missing 'count' or 'case_count' in dataset"}

    # Sort if date is present
    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"])
        df = df.sort_values("date")

    counts = df["count"].astype(float).values
    if len(counts) == 0:
        return {"is_anomaly": False, "message": "Empty case count array"}

    current = float(counts[-1])
    baseline = counts[:-1] if len(counts) > 1 else counts

    baseline_mean = float(np.mean(baseline))
    baseline_std = float(np.std(baseline))

    # Avoid zero division
    effective_std = max(baseline_std, 1.0)
    z_score = (current - baseline_mean) / effective_std
    percentage_increase = ((current - baseline_mean) / max(baseline_mean, 1.0)) * 100.0

    is_anomaly = bool(z_score >= threshold_z_score and current > baseline_mean)

    # Optional Isolation Forest confirmation if sufficient samples (>= 5)
    iso_anomaly = False
    if len(counts) >= 5:
        try:
            # Reshape features: [case_count, diff_from_mean]
            X = np.column_stack([counts, counts - baseline_mean])
            iso_forest = IsolationForest(contamination=0.15, random_state=42)
            preds = iso_forest.fit_predict(X)
            iso_anomaly = bool(preds[-1] == -1)
        except Exception:
            iso_anomaly = False

    explanation = []
    if is_anomaly or iso_anomaly:
        explanation.append(
            f"Spike of {int(current)} cases vs baseline average of {baseline_mean:.1f} cases/day"
        )
        explanation.append(f"+{percentage_increase:.1f}% above historical baseline")
        if iso_anomaly:
            explanation.append("Flagged by Isolation Forest multivariate outlier model")

    return {
        "is_anomaly": is_anomaly or iso_anomaly,
        "statistical_anomaly": is_anomaly,
        "isolation_forest_anomaly": iso_anomaly,
        "current_count": int(current),
        "baseline_mean": round(baseline_mean, 2),
        "baseline_std": round(baseline_std, 2),
        "z_score": round(z_score, 2),
        "percentage_increase": round(percentage_increase, 1),
        "reason": "; ".join(explanation) if explanation else "Case activity is within expected statistical variation."
    }

def scan_locality_anomalies(locality_cases: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Evaluates anomalies across multiple localities.
    locality_cases format:
    [
        {"locality": "Lake Area", "current_count": 18, "baseline_average": 4.5},
        ...
    ]
    """
    results = []
    for item in locality_cases:
        locality = item.get("locality", "Unknown")
        current = float(item.get("current_count", 0))
        baseline = float(item.get("baseline_average", 3.0))
        std = float(item.get("baseline_std", 1.5))

        effective_std = max(std, 1.0)
        z_score = (current - baseline) / effective_std
        pct_increase = ((current - baseline) / max(baseline, 1.0)) * 100.0
        is_abnormal = bool(z_score >= 2.0 and current > baseline)

        results.append({
            "locality": locality,
            "current_count": int(current),
            "baseline_average": round(baseline, 1),
            "z_score": round(z_score, 2),
            "percentage_increase": round(pct_increase, 1),
            "is_anomaly": is_abnormal,
            "alert_recommended": is_abnormal
        })

    return results

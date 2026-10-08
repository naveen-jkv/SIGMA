"""
AQUASENSE - Transparent Outbreak Risk Engine
Calculates multi-factor water-borne disease outbreak risk scores (0-100).

DISCLAIMER:
AQUASENSE is an early warning and clinical decision-support system
for public health surveillance. It does not provide medical diagnoses.
"""

from typing import Dict, Any, Optional

SEVERITY_WEIGHTS = {
    "LOW": 6.0,
    "MILD": 6.0,
    "MODERATE": 14.0,
    "HIGH": 22.0,
    "SEVERE": 24.0,
    "CRITICAL": 25.0
}

def calculate_outbreak_risk(
    case_count: int,
    previous_case_count: int,
    growth_rate: float,
    similar_cases: int,
    severity: str,
    location_density: float,
    flooding: bool = False,
    water_quality_concern: bool = False
) -> Dict[str, Any]:
    """
    Transparent Risk Scoring Engine (0 - 100 scale):
    
    1. Case Volume Component (0 - 18 pts):
       Reflects the absolute volume of cases reported.
       
    2. Growth Rate & Acceleration Component (0 - 28 pts):
       Reflects percentage growth over previous baseline.
       
    3. Clustering & Similar Cases Component (0 - 24 pts):
       Reflects localized concentration of symptomatic individuals.
       
    4. Clinical Severity Component (0 - 22 pts):
       Weighted by clinical urgency (Mild -> Critical).
       
    5. Environmental Hazards Component (0 - 8 pts):
       Flooding, contaminated water sources, or water quality alerts.
    """
    # 1. Volume Score (0 - 18)
    volume_score = min(18.0, (float(case_count) / 20.0) * 18.0)

    # 2. Growth Score (0 - 28)
    norm_growth = max(0.0, float(growth_rate))
    if previous_case_count > 0:
        actual_growth = ((float(case_count) - float(previous_case_count)) / float(previous_case_count)) * 100.0
        effective_growth = max(norm_growth, actual_growth)
    else:
        effective_growth = norm_growth

    if effective_growth >= 150:
        growth_score = 28.0
    elif effective_growth >= 100:
        growth_score = 23.0 + ((effective_growth - 100.0) / 50.0) * 5.0
    elif effective_growth >= 50:
        growth_score = 15.0 + ((effective_growth - 50.0) / 50.0) * 8.0
    elif effective_growth > 0:
        growth_score = (effective_growth / 50.0) * 15.0
    else:
        growth_score = 0.0

    # 3. Clustering & Density Score (0 - 24)
    density_val = max(0.0, min(1.0, float(location_density)))
    similar_norm = min(1.0, float(similar_cases) / 12.0)
    clustering_score = (density_val * 11.0) + (similar_norm * 13.0)

    # 4. Clinical Severity Score (0 - 22)
    sev_upper = severity.upper().strip() if severity else "MODERATE"
    severity_score = min(22.0, SEVERITY_WEIGHTS.get(sev_upper, 14.0))

    # 5. Environmental Risk Score (0 - 8)
    env_score = 0.0
    if flooding:
        env_score += 4.5
    if water_quality_concern:
        env_score += 3.5

    # Total Raw Score (0 - 100)
    total_raw = volume_score + growth_score + clustering_score + severity_score + env_score
    total_score = int(round(max(0.0, min(100.0, total_raw))))

    # Risk Level categorization (Per prompt specifications)
    # 0–30 = LOW
    # 31–50 = MODERATE
    # 51–75 = HIGH
    # 76–100 = CRITICAL
    if total_score <= 30:
        risk_level = "LOW"
    elif total_score <= 50:
        risk_level = "MODERATE"
    elif total_score <= 75:
        risk_level = "HIGH"
    else:
        risk_level = "CRITICAL"

    # Explainable Reason Synthesis
    reasons = []
    if effective_growth >= 100 and similar_cases >= 8:
        reasons.append("Rapid increase in similar cases detected")
    elif effective_growth >= 100:
        reasons.append(f"Rapid case surge (+{int(effective_growth)}% growth)")
    elif effective_growth >= 40:
        reasons.append(f"Elevated case growth rate (+{int(effective_growth)}%)")

    if similar_cases >= 8 and "Rapid increase in similar cases detected" not in reasons:
        reasons.append(f"Cluster of {similar_cases} similar symptomatic cases detected")
    elif similar_cases >= 3 and "Rapid increase in similar cases detected" not in reasons:
        reasons.append(f"{similar_cases} related cases in vicinity")

    if sev_upper in ["CRITICAL", "SEVERE", "HIGH"]:
        reasons.append(f"High clinical severity ({sev_upper})")

    if location_density >= 0.75:
        reasons.append("High geographic case density")

    if flooding:
        reasons.append("Recent flooding event reported")
    if water_quality_concern:
        reasons.append("Reported water contamination concern")

    if not reasons:
        if risk_level == "LOW":
            primary_reason = "Case numbers and growth within normal baseline thresholds"
        else:
            primary_reason = f"Mild cluster dynamics detected ({case_count} cases)"
    else:
        primary_reason = "; ".join(reasons)

    return {
        "risk_score": total_score,
        "risk_level": risk_level,
        "reason": primary_reason,
        "breakdown": {
            "volume_score": round(volume_score, 1),
            "growth_score": round(growth_score, 1),
            "clustering_score": round(clustering_score, 1),
            "severity_score": round(severity_score, 1),
            "environmental_score": round(env_score, 1)
        },
        "disclaimer": "AQUASENSE is an early warning / decision support system for public health surveillance and does not provide medical diagnoses."
    }

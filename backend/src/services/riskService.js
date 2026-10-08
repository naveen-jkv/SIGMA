/**
 * AQUASENSE - Risk Assessment Service
 * Orchestrates spatial clustering, growth tracking, and transparent risk evaluation.
 */

const Case = require('../models/Case');
const analyticsClient = require('./analyticsClient');
const logger = require('../utils/logger');

const SEVERITY_WEIGHTS = {
  LOW: 6,
  MILD: 6,
  MODERATE: 14,
  HIGH: 22,
  SEVERE: 24,
  CRITICAL: 25
};

/**
 * Native JS transparent risk engine fallback
 */
function calculateFallbackRisk({
  case_count,
  previous_case_count,
  growth_rate,
  similar_cases,
  severity,
  location_density,
  flooding,
  water_quality_concern
}) {
  const volumeScore = Math.min(18.0, (Number(case_count) / 20.0) * 18.0);

  const normGrowth = Math.max(0.0, Number(growth_rate) || 0);
  let effectiveGrowth = normGrowth;
  if (previous_case_count > 0) {
    const actualGrowth = ((case_count - previous_case_count) / previous_case_count) * 100.0;
    effectiveGrowth = Math.max(normGrowth, actualGrowth);
  }

  let growthScore = 0;
  if (effectiveGrowth >= 150) growthScore = 28.0;
  else if (effectiveGrowth >= 100) growthScore = 23.0 + ((effectiveGrowth - 100.0) / 50.0) * 5.0;
  else if (effectiveGrowth >= 50) growthScore = 15.0 + ((effectiveGrowth - 50.0) / 50.0) * 8.0;
  else if (effectiveGrowth > 0) growthScore = (effectiveGrowth / 50.0) * 15.0;

  const densityVal = Math.max(0.0, Math.min(1.0, Number(location_density) || 0.5));
  const similarNorm = Math.min(1.0, Number(similar_cases) / 12.0);
  const clusteringScore = (densityVal * 11.0) + (similarNorm * 13.0);

  const sevUpper = (severity || 'MODERATE').toUpperCase();
  const severityScore = Math.min(22.0, SEVERITY_WEIGHTS[sevUpper] || 14.0);

  let envScore = 0;
  if (flooding) envScore += 4.5;
  if (water_quality_concern) envScore += 3.5;

  const totalRaw = volumeScore + growthScore + clusteringScore + severityScore + envScore;
  const totalScore = Math.round(Math.max(0, Math.min(100, totalRaw)));

  let riskLevel = 'LOW';
  if (totalScore <= 30) riskLevel = 'LOW';
  else if (totalScore <= 50) riskLevel = 'MODERATE';
  else if (totalScore <= 75) riskLevel = 'HIGH';
  else riskLevel = 'CRITICAL';

  const reasons = [];
  if (effectiveGrowth >= 100 && similar_cases >= 8) {
    reasons.push('Rapid increase in similar cases detected');
  } else if (effectiveGrowth >= 100) {
    reasons.push(`Rapid case surge (+${Math.round(effectiveGrowth)}% growth)`);
  } else if (effectiveGrowth >= 40) {
    reasons.push(`Elevated case growth rate (+${Math.round(effectiveGrowth)}%)`);
  }

  if (similar_cases >= 8 && !reasons.includes('Rapid increase in similar cases detected')) {
    reasons.push(`Cluster of ${similar_cases} similar symptomatic cases detected`);
  }
  if (['CRITICAL', 'SEVERE', 'HIGH'].includes(sevUpper)) {
    reasons.push(`High clinical severity (${sevUpper})`);
  }
  if (densityVal >= 0.75) {
    reasons.push('High geographic case density');
  }
  if (flooding) reasons.push('Recent flooding event reported');
  if (water_quality_concern) reasons.push('Reported water contamination concern');

  const reason = reasons.length > 0
    ? reasons.join('; ')
    : riskLevel === 'LOW'
      ? 'Case numbers and growth within normal baseline thresholds'
      : `Mild cluster dynamics detected (${case_count} cases)`;

  return {
    risk_score: totalScore,
    risk_level: riskLevel,
    reason,
    breakdown: {
      volume_score: Math.round(volumeScore * 10) / 10,
      growth_score: Math.round(growthScore * 10) / 10,
      clustering_score: Math.round(clusteringScore * 10) / 10,
      severity_score: Math.round(severityScore * 10) / 10,
      environmental_score: Math.round(envScore * 10) / 10
    },
    disclaimer: 'AQUASENSE is an early warning / decision support system for public health surveillance and does not provide medical diagnoses.'
  };
}

/**
 * Evaluates outbreak risk for a given case report
 */
async function assessCaseRisk(caseData) {
  try {
    const locality = caseData.locality;
    const now = new Date(caseData.symptomDate || Date.now());

    // Time windows
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Fetch all cases in locality
    const localityCases = await Case.find({ locality });

    // Recent cases (last 7 days)
    const recentCases = localityCases.filter(c => {
      const d = new Date(c.symptomDate || c.reportedDate);
      return d >= sevenDaysAgo && d <= now;
    });

    // Previous window cases (7 to 14 days ago)
    const previousCases = localityCases.filter(c => {
      const d = new Date(c.symptomDate || c.reportedDate);
      return d >= fourteenDaysAgo && d < sevenDaysAgo;
    });

    const currentCount = recentCases.length + 1; // including current
    const previousCount = previousCases.length;

    // Growth calculation
    let growthRate = 0;
    if (previousCount > 0) {
      growthRate = ((currentCount - previousCount) / previousCount) * 100;
    } else if (currentCount > 2) {
      growthRate = currentCount * 25; // initial surge
    }

    // Similar symptomatic cases
    const currentSymptoms = Array.isArray(caseData.symptoms) ? caseData.symptoms : [caseData.symptoms];
    const similarCases = recentCases.filter(c => {
      const hasDisease = c.suspectedDisease && c.suspectedDisease === caseData.suspectedDisease;
      const sharesSymptom = c.symptoms && c.symptoms.some(s => currentSymptoms.includes(s));
      return hasDisease || sharesSymptom;
    }).length + 1;

    // Local density estimation
    const locationDensity = Math.min(1.0, Math.max(0.3, (currentCount / 15.0) * 0.9));

    const payload = {
      case_count: currentCount,
      previous_case_count: previousCount,
      growth_rate: Math.round(growthRate),
      similar_cases: similarCases,
      severity: (caseData.severity || 'MODERATE').toUpperCase(),
      location_density: Math.round(locationDensity * 100) / 100,
      flooding: Boolean(caseData.flooding),
      water_quality_concern: Boolean(caseData.waterQualityConcern)
    };

    // 1. Try Python Analytics Microservice
    let result = await analyticsClient.predictRisk(payload);

    // 2. Fallback to resilient JS engine if Python service is offline
    if (!result) {
      result = calculateFallbackRisk(payload);
    }

    return {
      riskScore: result.risk_score,
      riskLevel: result.risk_level,
      reason: result.reason,
      similarCasesNearby: similarCases,
      breakdown: result.breakdown,
      metrics: payload
    };
  } catch (err) {
    logger.error(`Error during assessCaseRisk: ${err.message}`);
    return {
      riskScore: 25,
      riskLevel: 'LOW',
      reason: 'Standard baseline assessment (fallback)',
      similarCasesNearby: 0
    };
  }
}

module.exports = {
  assessCaseRisk,
  calculateFallbackRisk
};

/**
 * AQUASENSE - Analytics Controller
 * Trends, symptom distribution, location aggregation, risk distribution,
 * and AI-driven anomaly/hotspot detection.
 */

const Case = require('../models/Case');
const analyticsClient = require('../services/analyticsClient');

// @desc    Get case counts by date (trends)
// @route   GET /api/analytics/trends
// @access  Public
const getTrends = async (req, res, next) => {
  try {
    const cases = await Case.find();

    const dateCounts = {};
    cases.forEach(c => {
      const dateStr = new Date(c.symptomDate || c.reportedDate).toISOString().split('T')[0];
      dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
    });

    // Sort chronologically
    const trends = Object.keys(dateCounts)
      .sort()
      .map(date => ({
        date,
        count: dateCounts[date]
      }));

    return res.status(200).json({
      success: true,
      totalDays: trends.length,
      data: trends
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get symptom distribution
// @route   GET /api/analytics/symptoms
// @access  Public
const getSymptoms = async (req, res, next) => {
  try {
    const cases = await Case.find();
    const symptomMap = {};
    let totalSymptomOccurrences = 0;

    cases.forEach(c => {
      const symList = Array.isArray(c.symptoms) ? c.symptoms : [c.symptoms].filter(Boolean);
      symList.forEach(s => {
        const cleanSymptom = s.trim();
        symptomMap[cleanSymptom] = (symptomMap[cleanSymptom] || 0) + 1;
        totalSymptomOccurrences++;
      });
    });

    const data = Object.keys(symptomMap)
      .map(symptom => ({
        symptom,
        count: symptomMap[symptom],
        percentage: totalSymptomOccurrences > 0
          ? Math.round((symptomMap[symptom] / totalSymptomOccurrences) * 1000) / 10
          : 0
      }))
      .sort((a, b) => b.count - a.count);

    return res.status(200).json({
      success: true,
      totalOccurrences: totalSymptomOccurrences,
      data
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get location-based case counts
// @route   GET /api/analytics/locations
// @access  Public
const getLocations = async (req, res, next) => {
  try {
    const cases = await Case.find();
    const locationMap = {};

    cases.forEach(c => {
      const locKey = c.locality || 'Unknown Locality';
      if (!locationMap[locKey]) {
        locationMap[locKey] = {
          locality: locKey,
          district: c.district || 'Unassigned',
          count: 0,
          riskScores: [],
          latitude: c.latitude,
          longitude: c.longitude,
          waterQualityConcerns: 0,
          floodingReports: 0
        };
      }
      locationMap[locKey].count += 1;
      locationMap[locKey].riskScores.push(c.riskScore || 0);
      if (c.waterQualityConcern) locationMap[locKey].waterQualityConcerns += 1;
      if (c.flooding) locationMap[locKey].floodingReports += 1;
    });

    const data = Object.values(locationMap).map(loc => {
      const avgScore = loc.riskScores.length > 0
        ? Math.round(loc.riskScores.reduce((a, b) => a + b, 0) / loc.riskScores.length)
        : 0;

      let dominantRiskLevel = 'LOW';
      if (avgScore >= 76) dominantRiskLevel = 'CRITICAL';
      else if (avgScore >= 51) dominantRiskLevel = 'HIGH';
      else if (avgScore >= 31) dominantRiskLevel = 'MODERATE';

      return {
        locality: loc.locality,
        district: loc.district,
        count: loc.count,
        averageRiskScore: avgScore,
        riskLevel: dominantRiskLevel,
        latitude: loc.latitude,
        longitude: loc.longitude,
        waterQualityConcerns: loc.waterQualityConcerns,
        floodingReports: loc.floodingReports
      };
    }).sort((a, b) => b.count - a.count);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get risk level breakdown
// @route   GET /api/analytics/risk
// @access  Public
const getRiskDistribution = async (req, res, next) => {
  try {
    const cases = await Case.find();
    const breakdown = {
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0
    };

    cases.forEach(c => {
      const level = (c.riskLevel || 'LOW').toLowerCase();
      if (breakdown[level] !== undefined) {
        breakdown[level]++;
      } else {
        breakdown.low++;
      }
    });

    // Return the exact specification format: low, moderate, high, critical
    return res.status(200).json(breakdown);
  } catch (error) {
    next(error);
  }
};

// @desc    Get AI hotspot detection analysis
// @route   GET /api/analytics/hotspots
// @access  Public
const getHotspots = async (req, res, next) => {
  try {
    const cases = await Case.find();
    const simplifiedCases = cases.map(c => ({
      locality: c.locality,
      latitude: c.latitude,
      longitude: c.longitude,
      riskScore: c.riskScore,
      symptoms: c.symptoms
    }));

    // Call Python FastAPI
    const aiResult = await analyticsClient.detectHotspots(simplifiedCases);
    if (aiResult && aiResult.hotspots) {
      return res.status(200).json({
        success: true,
        source: 'Python FastAPI Clustering Engine',
        data: aiResult.hotspots
      });
    }

    // Fallback hotspot aggregation if Python service is offline
    const localityAgg = {};
    cases.forEach(c => {
      const key = c.locality || 'Unknown';
      if (!localityAgg[key]) {
        localityAgg[key] = {
          locality: key,
          count: 0,
          latSum: 0,
          lonSum: 0,
          riskScores: []
        };
      }
      localityAgg[key].count++;
      localityAgg[key].latSum += c.latitude;
      localityAgg[key].lonSum += c.longitude;
      localityAgg[key].riskScores.push(c.riskScore || 0);
    });

    const hotspots = Object.values(localityAgg).map(loc => {
      const avgScore = Math.round(loc.riskScores.reduce((a, b) => a + b, 0) / loc.count);
      let riskLevel = 'LOW';
      if (avgScore >= 76 || loc.count >= 10) riskLevel = 'CRITICAL';
      else if (avgScore >= 51 || loc.count >= 6) riskLevel = 'HIGH';
      else if (avgScore >= 31) riskLevel = 'MODERATE';

      return {
        locality: loc.locality,
        case_count: loc.count,
        risk_level: riskLevel,
        average_risk_score: avgScore,
        coordinates: {
          latitude: Math.round((loc.latSum / loc.count) * 10000) / 10000,
          longitude: Math.round((loc.lonSum / loc.count) * 10000) / 10000
        },
        is_active_hotspot: loc.count >= 4 || riskLevel === 'CRITICAL'
      };
    }).sort((a, b) => b.case_count - a.case_count);

    return res.status(200).json({
      success: true,
      source: 'AquaSense Fallback Engine',
      data: hotspots
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Detect anomalies over historical baseline
// @route   GET /api/analytics/anomalies
// @access  Public
const getAnomalies = async (req, res, next) => {
  try {
    const cases = await Case.find();
    const dateCounts = {};
    cases.forEach(c => {
      const dateStr = new Date(c.symptomDate || c.reportedDate).toISOString().split('T')[0];
      dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
    });

    const history = Object.keys(dateCounts).sort().map(d => ({ date: d, count: dateCounts[d] }));

    const anomalyResult = await analyticsClient.detectAnomalies(history);
    if (anomalyResult) {
      return res.status(200).json({
        success: true,
        source: 'Python Isolation Forest & Baseline Model',
        data: anomalyResult
      });
    }

    // Resilient fallback statistical calculation
    const counts = history.map(h => h.count);
    const current = counts.length > 0 ? counts[counts.length - 1] : 0;
    const baseline = counts.length > 1 ? counts.slice(0, -1) : counts;
    const mean = baseline.length > 0 ? baseline.reduce((a, b) => a + b, 0) / baseline.length : 1;
    const zScore = Math.round(((current - mean) / Math.max(1, mean * 0.4)) * 10) / 10;
    const isAnomaly = zScore >= 2.0;

    return res.status(200).json({
      success: true,
      source: 'AquaSense Fallback Statistical Baseline',
      data: {
        is_anomaly: isAnomaly,
        current_count: current,
        baseline_mean: Math.round(mean * 10) / 10,
        z_score: zScore,
        percentage_increase: Math.round(((current - mean) / Math.max(1, mean)) * 100),
        reason: isAnomaly
          ? `Current count of ${current} significantly exceeds baseline average of ${mean.toFixed(1)} cases/day`
          : 'Case velocity within baseline parameters'
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTrends,
  getSymptoms,
  getLocations,
  getRiskDistribution,
  getHotspots,
  getAnomalies
};

/**
 * AQUASENSE - Automatic Alert Generation Service
 */

const Alert = require('../models/Alert');
const logger = require('../utils/logger');
const { generateAlertId } = require('../utils/idGenerator');

function generateRecommendedAction(riskLevel, suspectedDisease, locality) {
  if (riskLevel === 'CRITICAL') {
    return `URGENT: Deploy rapid epidemic response team to ${locality}. Initiate community-wide water testing, distribute chlorine purification tablets and ORS sachets, inspect water distribution pipelines, and set up temporary oral rehydration posts.`;
  }
  if (riskLevel === 'HIGH') {
    return `HIGH PRIORITY: Issue boiled-water advisory in ${locality}. Collect bacteriological water samples from community taps and borewells. Intensify case active-surveillance in local clinics.`;
  }
  if (riskLevel === 'MODERATE') {
    return `ROUTINE ACTION: Monitor water quality metrics and maintain vigilance at primary health centers in ${locality}.`;
  }
  return `No immediate intervention needed. Continue regular surveillance in ${locality}.`;
}

async function triggerAutomaticAlert(caseDoc, riskAssessment) {
  try {
    const { riskLevel, riskScore, reason, metrics } = riskAssessment;

    // Only generate alerts for HIGH or CRITICAL risk levels
    if (riskLevel !== 'HIGH' && riskLevel !== 'CRITICAL') {
      return { alertGenerated: false, alert: null };
    }

    const locality = caseDoc.locality;
    const caseCount = metrics ? metrics.case_count : 1;

    // Check if an ACTIVE alert was recently created for this location to avoid duplicate spam
    const existingAlerts = await Alert.find({ location: locality, status: 'ACTIVE' });
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentActiveAlert = existingAlerts.find(a => new Date(a.createdAt) > oneDayAgo);

    if (recentActiveAlert) {
      // Update the existing alert with updated case counts and severity
      const updated = await Alert.findByIdAndUpdate(recentActiveAlert._id || recentActiveAlert.alertId, {
        caseCount: Math.max(recentActiveAlert.caseCount, caseCount),
        riskLevel: riskLevel === 'CRITICAL' ? 'CRITICAL' : recentActiveAlert.riskLevel,
        reason: `${recentActiveAlert.reason} | Update: ${reason}`,
        recommendedAction: generateRecommendedAction(riskLevel, caseDoc.suspectedDisease, locality)
      });
      logger.info(`Updated existing ACTIVE outbreak alert for ${locality}: ${recentActiveAlert.alertId}`);
      return { alertGenerated: true, alert: updated || recentActiveAlert, isUpdate: true };
    }

    // Create fresh Alert
    const newAlert = await Alert.create({
      alertId: generateAlertId(),
      location: locality,
      riskLevel: riskLevel,
      caseCount: caseCount,
      reason: reason || `Abnormal outbreak activity detected (${riskScore}/100)`,
      recommendedAction: generateRecommendedAction(riskLevel, caseDoc.suspectedDisease, locality),
      status: 'ACTIVE'
    });

    logger.warn(`🚨 AUTOMATIC OUTBREAK ALERT GENERATED: [${riskLevel}] in ${locality} (ID: ${newAlert.alertId})`);
    return { alertGenerated: true, alert: newAlert, isUpdate: false };
  } catch (error) {
    logger.error(`Failed to trigger automatic alert: ${error.message}`);
    return { alertGenerated: false, error: error.message };
  }
}

module.exports = {
  triggerAutomaticAlert,
  generateRecommendedAction
};

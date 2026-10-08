/**
 * AQUASENSE Analytics Client
 * Communicates with the Python FastAPI analytics microservice
 */

const axios = require('axios');
const logger = require('../utils/logger');

const ANALYTICS_URL = process.env.ANALYTICS_URL || 'http://localhost:8000';
const client = axios.create({
  baseURL: ANALYTICS_URL,
  timeout: 4000,
  headers: {
    'Content-Type': 'application/json'
  }
});

const analyticsClient = {
  /**
   * Predict risk score and classification via Python FastAPI
   */
  async predictRisk(payload) {
    try {
      const response = await client.post('/predict-risk', payload);
      return response.data;
    } catch (error) {
      logger.warn(`Python Analytics Service call failed (${error.message}). Using transparent fallback engine.`);
      return null;
    }
  },

  /**
   * Detect time series anomalies via Python FastAPI
   */
  async detectAnomalies(historyData) {
    try {
      const response = await client.post('/detect-anomalies', { history: historyData });
      return response.data;
    } catch (error) {
      logger.warn(`Python Anomaly Detection call failed (${error.message}).`);
      return null;
    }
  },

  /**
   * Detect geographic hotspots via Python FastAPI
   */
  async detectHotspots(casesData) {
    try {
      const response = await client.post('/detect-hotspots', { cases: casesData });
      return response.data;
    } catch (error) {
      logger.warn(`Python Hotspot Detection call failed (${error.message}).`);
      return null;
    }
  },

  /**
   * Check Python service health
   */
  async checkHealth() {
    try {
      const response = await client.get('/health');
      return { online: true, data: response.data };
    } catch (error) {
      return { online: false, error: error.message };
    }
  }
};

module.exports = analyticsClient;

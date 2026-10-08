/**
 * AQUASENSE Comprehensive API Test Suite
 * Tests all Node.js and Python Analytics endpoints, authentication,
 * case management, automatic alert generation, and analytics.
 */

const axios = require('axios');
const { startServer } = require('../src/server');
const logger = require('../src/utils/logger');

const API_BASE = 'http://localhost:5000/api';
const PYTHON_BASE = 'http://localhost:8000';

let authToken = null;
let createdCaseId = null;
let createdAlertId = null;
let serverInstance = null;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  logger.info('🚀 Launching AQUASENSE End-to-End API Test Suite...');
  
  // Start server
  serverInstance = await startServer();
  await sleep(1000);

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      logger.success(`PASS: ${name}`);
      passed++;
    } catch (err) {
      logger.error(`FAIL: ${name} -> ${err.message}`, err.response ? JSON.stringify(err.response.data) : '');
      failed++;
    }
  }

  // 1. Health check
  await test('GET /api/health', async () => {
    const res = await axios.get(`${API_BASE}/health`);
    if (res.data.status !== 'OK') throw new Error('Status not OK');
    if (!res.data.service.includes('AQUASENSE')) throw new Error('Service name missing');
  });

  // 2. Authentication: Register
  const testEmail = `tester_${Date.now()}@aquasense.org`;
  await test('POST /api/auth/register', async () => {
    const res = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Surveillance Officer Test',
      email: testEmail,
      password: 'securePassword123',
      role: 'AUTHORITY'
    });
    if (!res.data.success || !res.data.token) throw new Error('Token not returned');
  });

  // 3. Authentication: Login
  await test('POST /api/auth/login', async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: testEmail,
      password: 'securePassword123'
    });
    if (!res.data.success || !res.data.token) throw new Error('Login failed');
    authToken = res.data.token;
  });

  // 4. Authentication: Profile
  await test('GET /api/auth/me', async () => {
    const res = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (!res.data.success || res.data.user.email !== testEmail) throw new Error('User profile mismatch');
  });

  // 5. Dashboard Stats
  await test('GET /api/dashboard/stats', async () => {
    const res = await axios.get(`${API_BASE}/dashboard/stats`);
    const data = res.data;
    if (typeof data.totalCases !== 'number') throw new Error('totalCases missing');
    if (typeof data.casesToday !== 'number') throw new Error('casesToday missing');
    if (typeof data.highRiskAreas !== 'number') throw new Error('highRiskAreas missing');
    if (typeof data.activeAlerts !== 'number') throw new Error('activeAlerts missing');
  });

  // 6. Analytics: Trends
  await test('GET /api/analytics/trends', async () => {
    const res = await axios.get(`${API_BASE}/analytics/trends`);
    if (!res.data.success || !Array.isArray(res.data.data)) throw new Error('Trends array missing');
  });

  // 7. Analytics: Symptoms
  await test('GET /api/analytics/symptoms', async () => {
    const res = await axios.get(`${API_BASE}/analytics/symptoms`);
    if (!res.data.success || !Array.isArray(res.data.data)) throw new Error('Symptoms array missing');
  });

  // 8. Analytics: Locations
  await test('GET /api/analytics/locations', async () => {
    const res = await axios.get(`${API_BASE}/analytics/locations`);
    if (!res.data.success || !Array.isArray(res.data.data)) throw new Error('Locations array missing');
  });

  // 9. Analytics: Risk Distribution
  await test('GET /api/analytics/risk', async () => {
    const res = await axios.get(`${API_BASE}/analytics/risk`);
    const d = res.data;
    if (typeof d.low !== 'number' || typeof d.moderate !== 'number' || typeof d.high !== 'number' || typeof d.critical !== 'number') {
      throw new Error('Risk breakdown structure invalid');
    }
  });

  // 10. Analytics: Hotspots & Anomalies
  await test('GET /api/analytics/hotspots', async () => {
    const res = await axios.get(`${API_BASE}/analytics/hotspots`);
    if (!res.data.success) throw new Error('Hotspots fetch failed');
  });

  await test('GET /api/analytics/anomalies', async () => {
    const res = await axios.get(`${API_BASE}/analytics/anomalies`);
    if (!res.data.success) throw new Error('Anomalies fetch failed');
  });

  // 11. Map API
  await test('GET /api/map/cases', async () => {
    const res = await axios.get(`${API_BASE}/map/cases`);
    if (!Array.isArray(res.data) || res.data.length === 0) throw new Error('Map data empty or invalid');
    const first = res.data[0];
    if (!first.caseId || first.latitude === undefined || first.longitude === undefined || !first.locality) {
      throw new Error('Map item missing required fields');
    }
  });

  // 12. Case APIs: Create case with Automatic Alert Generation
  await test('POST /api/cases (Surge Case -> Auto Alert)', async () => {
    const res = await axios.post(`${API_BASE}/cases`, {
      age: 29,
      gender: 'FEMALE',
      symptoms: ['Watery Diarrhea', 'Severe Dehydration', 'Vomiting'],
      suspectedDisease: 'Cholera',
      symptomDate: new Date().toISOString(),
      severity: 'CRITICAL',
      district: 'Central Metro',
      locality: 'Riverbank Slum Colony',
      latitude: 12.9613,
      longitude: 77.5855,
      waterSource: 'Contaminated Open Well',
      waterQualityConcern: true,
      flooding: true
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (!res.data.success) throw new Error('Case creation failed');
    if (!res.data.case) throw new Error('Case document missing');
    if (!res.data.risk || typeof res.data.risk.score !== 'number') throw new Error('Risk score missing');
    if (!res.data.alertGenerated) throw new Error('Alert was expected to be generated for CRITICAL case');
    createdCaseId = res.data.case._id || res.data.case.caseId;
  });

  // 13. Case APIs: GET all and GET by ID
  await test('GET /api/cases', async () => {
    const res = await axios.get(`${API_BASE}/cases`);
    if (!res.data.success || !Array.isArray(res.data.data)) throw new Error('Cases array missing');
  });

  await test('GET /api/cases/:id', async () => {
    const res = await axios.get(`${API_BASE}/cases/${createdCaseId}`);
    if (!res.data.success || !res.data.data) throw new Error('Single case fetch failed');
  });

  // 14. Case APIs: PUT and DELETE
  await test('PUT /api/cases/:id', async () => {
    const res = await axios.put(`${API_BASE}/cases/${createdCaseId}`, {
      status: 'CONFIRMED'
    });
    if (!res.data.success || res.data.data.status !== 'CONFIRMED') throw new Error('Case update failed');
  });

  await test('DELETE /api/cases/:id', async () => {
    const res = await axios.delete(`${API_BASE}/cases/${createdCaseId}`);
    if (!res.data.success) throw new Error('Case deletion failed');
  });

  // 15. Alert APIs: GET, POST, PUT status, DELETE
  await test('GET /api/alerts', async () => {
    const res = await axios.get(`${API_BASE}/alerts`);
    if (!res.data.success || !Array.isArray(res.data.data)) throw new Error('Alerts array missing');
  });

  await test('POST /api/alerts', async () => {
    const res = await axios.post(`${API_BASE}/alerts`, {
      location: 'Test Lake Ward',
      riskLevel: 'HIGH',
      caseCount: 7,
      reason: 'Bacteriological contamination identified in storage tank',
      recommendedAction: 'Issue boil water notice'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (!res.data.success) throw new Error('Alert creation failed');
    createdAlertId = res.data.data._id || res.data.data.alertId;
  });

  await test('PUT /api/alerts/:id/status', async () => {
    const res = await axios.put(`${API_BASE}/alerts/${createdAlertId}/status`, {
      status: 'ACKNOWLEDGED'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (!res.data.success || res.data.data.status !== 'ACKNOWLEDGED') throw new Error('Alert status update failed');
  });

  await test('DELETE /api/alerts/:id', async () => {
    const res = await axios.delete(`${API_BASE}/alerts/${createdAlertId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (!res.data.success) throw new Error('Alert deletion failed');
  });

  logger.info('========================================================');
  logger.info(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  logger.info('========================================================');

  if (serverInstance) {
    serverInstance.close();
  }

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  logger.error(`Test runner error: ${err.message}`);
  if (serverInstance) serverInstance.close();
  process.exit(1);
});

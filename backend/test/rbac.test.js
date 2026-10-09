/**
 * AQUASENSE Role-Based Access Control (RBAC) Comprehensive Test Suite
 *
 * Verifies all 14 mandatory RBAC test cases:
 *  1. Worker login succeeds.
 *  2. Authority login succeeds.
 *  3. Worker can submit a case.
 *  4. Worker cannot view another worker's private records.
 *  5. Worker receives HTTP 403 when requesting authority analytics.
 *  6. Worker cannot resolve an alert.
 *  7. Worker cannot access authority dashboard data through direct API requests.
 *  8. Authority can view authorized case reports.
 *  9. Authority can view analytics and alerts.
 * 10. Authority can update alert status.
 * 11. Unauthenticated requests receive HTTP 401.
 * 12. Tampering with client-side role information does not grant privileges.
 * 13. Public registration cannot create an authority account.
 * 14. Expired or invalid authentication tokens are rejected.
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
const { startServer } = require('../src/server');
const logger = require('../src/utils/logger');

const TEST_PORT = 5005;
const API_BASE = `http://localhost:${TEST_PORT}/api`;
process.env.PORT = String(TEST_PORT);
process.env.NODE_ENV = 'test';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runRBACTests() {
  logger.info('===============================================================');
  logger.info('🔒 Launching AQUASENSE RBAC Verification Test Suite (14 Tests)');
  logger.info('===============================================================');

  const serverInstance = await startServer(TEST_PORT);
  await sleep(1000);

  let passed = 0;
  let failed = 0;
  const results = [];

  async function testCase(id, name, testFn) {
    try {
      await testFn();
      logger.success(`[PASS] Case ${id}: ${name}`);
      passed++;
      results.push({ id, name, status: 'PASSED' });
    } catch (err) {
      const errorDetail = err.response
        ? `HTTP ${err.response.status} - ${JSON.stringify(err.response.data)}`
        : err.message;
      logger.error(`[FAIL] Case ${id}: ${name} -> ${errorDetail}`);
      failed++;
      results.push({ id, name, status: 'FAILED', error: errorDetail });
    }
  }

  let workerToken = null;
  let workerUser = null;
  let authorityToken = null;
  let authorityUser = null;

  let workerCaseId = null;
  let worker2CaseId = null;
  let targetAlertId = null;

  // 1. Worker login succeeds
  await testCase(1, 'Worker login succeeds', async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'healthworker@demo.com',
      password: 'password123'
    });
    if (!res.data.success || !res.data.token) {
      throw new Error('Token not returned in login response');
    }
    if (res.data.user.role !== 'HEALTH_WORKER') {
      throw new Error(`Expected role HEALTH_WORKER, got ${res.data.user.role}`);
    }
    workerToken = res.data.token;
    workerUser = res.data.user;
  });

  // 2. Authority login succeeds
  await testCase(2, 'Authority login succeeds', async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'authority@demo.com',
      password: 'password123'
    });
    if (!res.data.success || !res.data.token) {
      throw new Error('Token not returned in login response');
    }
    if (res.data.user.role !== 'HEALTH_AUTHORITY') {
      throw new Error(`Expected role HEALTH_AUTHORITY, got ${res.data.user.role}`);
    }
    authorityToken = res.data.token;
    authorityUser = res.data.user;
  });

  // 3. Worker can submit a case
  await testCase(3, 'Worker can submit a case', async () => {
    const casePayload = {
      age: 29,
      gender: 'FEMALE',
      symptoms: ['Watery Diarrhea', 'Severe Dehydration'],
      suspectedDisease: 'Cholera',
      symptomDate: new Date().toISOString(),
      district: 'Central Metro',
      locality: 'Ward 4 Community Tap',
      latitude: 12.965,
      longitude: 77.589,
      waterSource: 'Public Tap'
    };

    const res = await axios.post(`${API_BASE}/cases`, casePayload, {
      headers: { Authorization: `Bearer ${workerToken}` }
    });

    if (res.status !== 201 || !res.data.success || !res.data.case) {
      throw new Error('Failed to create case');
    }
    if (!res.data.case._id && !res.data.case.caseId) {
      throw new Error('Missing case identifier in response');
    }
    workerCaseId = res.data.case._id || res.data.case.caseId;
  });

  // 4. Worker cannot view another worker's private records
  await testCase(4, "Worker cannot view another worker's private records", async () => {
    // Register a second worker
    const worker2Email = `worker2_${Date.now()}@aquasense.org`;
    const regRes = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Second Worker',
      email: worker2Email,
      password: 'password123'
    });
    const worker2Token = regRes.data.token;

    // Worker 2 creates a private case
    const case2Res = await axios.post(
      `${API_BASE}/cases`,
      {
        age: 44,
        gender: 'MALE',
        symptoms: ['Vomiting', 'High Fever'],
        suspectedDisease: 'Acute Gastroenteritis',
        symptomDate: new Date().toISOString(),
        district: 'West District',
        locality: 'Private Colony 12',
        latitude: 12.971,
        longitude: 77.592
      },
      { headers: { Authorization: `Bearer ${worker2Token}` } }
    );
    worker2CaseId = case2Res.data.case._id || case2Res.data.case.caseId;

    // Worker 1 attempts to fetch Worker 2's case directly
    try {
      await axios.get(`${API_BASE}/cases/${worker2CaseId}`, {
        headers: { Authorization: `Bearer ${workerToken}` }
      });
      throw new Error('Worker 1 was improperly allowed to view Worker 2 private record');
    } catch (err) {
      if (err.response && (err.response.status === 403 || err.response.status === 404)) {
        // Success: rejected with 403 Forbidden (or 404 non-disclosure)
        return;
      }
      throw err;
    }
  });

  // 5. Worker receives HTTP 403 when requesting authority analytics
  await testCase(5, 'Worker receives HTTP 403 when requesting authority analytics', async () => {
    try {
      await axios.get(`${API_BASE}/analytics/trends`, {
        headers: { Authorization: `Bearer ${workerToken}` }
      });
      throw new Error('Worker was improperly allowed to access analytics/trends');
    } catch (err) {
      if (!err.response || err.response.status !== 403) {
        throw new Error(`Expected HTTP 403, received ${err.response ? err.response.status : err.message}`);
      }
    }

    try {
      await axios.get(`${API_BASE}/analytics/hotspots`, {
        headers: { Authorization: `Bearer ${workerToken}` }
      });
      throw new Error('Worker was improperly allowed to access analytics/hotspots');
    } catch (err) {
      if (!err.response || err.response.status !== 403) {
        throw new Error(`Expected HTTP 403, received ${err.response ? err.response.status : err.message}`);
      }
    }
  });

  // 6. Worker cannot resolve an alert
  await testCase(6, 'Worker cannot resolve an alert', async () => {
    // Get alerts using authority token first to find an active alert ID
    const alertsRes = await axios.get(`${API_BASE}/alerts`, {
      headers: { Authorization: `Bearer ${authorityToken}` }
    });

    let alertToTest = (alertsRes.data.data || alertsRes.data)[0];
    if (!alertToTest) {
      // Create one if none exists
      const newAlert = await axios.post(
        `${API_BASE}/alerts`,
        {
          location: 'Test Outbreak Zone',
          riskLevel: 'CRITICAL',
          caseCount: 8,
          reason: 'Surveillance Alert'
        },
        { headers: { Authorization: `Bearer ${authorityToken}` } }
      );
      alertToTest = newAlert.data.data;
    }
    targetAlertId = alertToTest._id || alertToTest.alertId;

    // Worker attempts to resolve the alert
    try {
      await axios.put(
        `${API_BASE}/alerts/${targetAlertId}/status`,
        { status: 'RESOLVED' },
        { headers: { Authorization: `Bearer ${workerToken}` } }
      );
      throw new Error('Worker was improperly allowed to update alert status');
    } catch (err) {
      if (!err.response || err.response.status !== 403) {
        throw new Error(`Expected HTTP 403, received ${err.response ? err.response.status : err.message}`);
      }
    }
  });

  // 7. Worker cannot access authority dashboard data through direct API requests
  await testCase(7, 'Worker cannot access authority dashboard data through direct API requests', async () => {
    try {
      await axios.get(`${API_BASE}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${workerToken}` }
      });
      throw new Error('Worker was improperly allowed to access /api/dashboard/stats');
    } catch (err) {
      if (!err.response || err.response.status !== 403) {
        throw new Error(`Expected HTTP 403, received ${err.response ? err.response.status : err.message}`);
      }
    }
  });

  // 8. Authority can view authorized case reports
  await testCase(8, 'Authority can view authorized case reports', async () => {
    const res = await axios.get(`${API_BASE}/cases`, {
      headers: { Authorization: `Bearer ${authorityToken}` }
    });
    if (res.status !== 200 || !res.data.success || !Array.isArray(res.data.data)) {
      throw new Error('Authority failed to fetch cases');
    }
    if (res.data.count < 1) {
      throw new Error('Expected at least 1 case in surveillance registry');
    }

    // Authority can inspect specific report created by worker
    if (worker2CaseId) {
      const singleRes = await axios.get(`${API_BASE}/cases/${worker2CaseId}`, {
        headers: { Authorization: `Bearer ${authorityToken}` }
      });
      if (singleRes.status !== 200 || !singleRes.data.success) {
        throw new Error('Authority failed to inspect case report');
      }
    }
  });

  // 9. Authority can view analytics and alerts
  await testCase(9, 'Authority can view analytics and alerts', async () => {
    const trendsRes = await axios.get(`${API_BASE}/analytics/trends`, {
      headers: { Authorization: `Bearer ${authorityToken}` }
    });
    if (trendsRes.status !== 200 || !trendsRes.data.success) {
      throw new Error('Authority failed to fetch trends');
    }

    const alertsRes = await axios.get(`${API_BASE}/alerts`, {
      headers: { Authorization: `Bearer ${authorityToken}` }
    });
    if (alertsRes.status !== 200 || !alertsRes.data.success) {
      throw new Error('Authority failed to fetch alerts');
    }
  });

  // 10. Authority can update alert status
  await testCase(10, 'Authority can update alert status', async () => {
    const resReviewed = await axios.put(
      `${API_BASE}/alerts/${targetAlertId}/status`,
      { status: 'REVIEWED' },
      { headers: { Authorization: `Bearer ${authorityToken}` } }
    );
    if (resReviewed.status !== 200 || resReviewed.data.data.status !== 'REVIEWED') {
      throw new Error('Authority failed to update alert status to REVIEWED');
    }

    const resResolved = await axios.put(
      `${API_BASE}/alerts/${targetAlertId}/status`,
      { status: 'RESOLVED' },
      { headers: { Authorization: `Bearer ${authorityToken}` } }
    );
    if (resResolved.status !== 200 || resResolved.data.data.status !== 'RESOLVED') {
      throw new Error('Authority failed to update alert status to RESOLVED');
    }
  });

  // 11. Unauthenticated requests receive HTTP 401
  await testCase(11, 'Unauthenticated requests receive HTTP 401', async () => {
    const protectedEndpoints = [
      { method: 'get', url: `${API_BASE}/cases` },
      { method: 'post', url: `${API_BASE}/cases`, data: { age: 30 } },
      { method: 'get', url: `${API_BASE}/dashboard/stats` },
      { method: 'get', url: `${API_BASE}/analytics/trends` },
      { method: 'get', url: `${API_BASE}/alerts` },
      { method: 'get', url: `${API_BASE}/auth/me` }
    ];

    for (const ep of protectedEndpoints) {
      try {
        if (ep.method === 'get') {
          await axios.get(ep.url);
        } else {
          await axios.post(ep.url, ep.data);
        }
        throw new Error(`Endpoint ${ep.url} failed to reject unauthenticated request with 401`);
      } catch (err) {
        if (!err.response || err.response.status !== 401) {
          throw new Error(`Endpoint ${ep.url} returned status ${err.response ? err.response.status : err.message}, expected 401`);
        }
      }
    }
  });

  // 12. Tampering with client-side role information does not grant privileges
  await testCase(12, 'Tampering with client-side role information does not grant privileges', async () => {
    // Attempt privilege escalation by injecting role in body or headers with worker token
    try {
      await axios.get(`${API_BASE}/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${workerToken}`,
          'X-User-Role': 'HEALTH_AUTHORITY',
          Role: 'HEALTH_AUTHORITY'
        },
        params: { role: 'HEALTH_AUTHORITY' }
      });
      throw new Error('Client role parameter granted unauthorized access');
    } catch (err) {
      if (!err.response || err.response.status !== 403) {
        throw new Error(`Expected HTTP 403, received ${err.response ? err.response.status : err.message}`);
      }
    }

    // Attempt with forged token signed by arbitrary key
    const forgedToken = jwt.sign(
      { id: workerUser?.id || workerUser?._id || 'user_demo_worker', role: 'HEALTH_AUTHORITY' },
      'forged_fake_secret_key_999',
      { expiresIn: '1h' }
    );

    try {
      await axios.get(`${API_BASE}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${forgedToken}` }
      });
      throw new Error('Forged token was improperly accepted');
    } catch (err) {
      if (!err.response || err.response.status !== 401) {
        throw new Error(`Expected HTTP 401 for forged token, received ${err.response ? err.response.status : err.message}`);
      }
    }
  });

  // 13. Public registration cannot create an authority account
  await testCase(13, 'Public registration cannot create an authority account', async () => {
    const maliciousEmail = `attacker_${Date.now()}@infiltrate.net`;

    const regRes = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Hostile Entity',
      email: maliciousEmail,
      password: 'password123',
      role: 'HEALTH_AUTHORITY' // Client attempts self-promotion
    });

    if (!regRes.data.success || !regRes.data.token) {
      throw new Error('Registration failed');
    }

    // Role returned by server MUST be HEALTH_WORKER
    if (regRes.data.user.role !== 'HEALTH_WORKER') {
      throw new Error(`Security breach: Registration permitted authority role '${regRes.data.user.role}'`);
    }

    // Verify token cannot access authority endpoints
    try {
      await axios.get(`${API_BASE}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${regRes.data.token}` }
      });
      throw new Error('Newly registered user was able to access authority dashboard');
    } catch (err) {
      if (!err.response || err.response.status !== 403) {
        throw new Error(`Expected HTTP 403, received ${err.response ? err.response.status : err.message}`);
      }
    }
  });

  // 14. Expired or invalid authentication tokens are rejected
  await testCase(14, 'Expired or invalid authentication tokens are rejected', async () => {
    // 14a. Invalid token
    try {
      await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: 'Bearer totally.invalid.signature' }
      });
      throw new Error('Invalid token string was accepted');
    } catch (err) {
      if (!err.response || err.response.status !== 401) {
        throw new Error(`Expected HTTP 401 for invalid token, received ${err.response ? err.response.status : err.message}`);
      }
    }

    // 14b. Expired token (signed with valid secret but expired in the past)
    const expiredToken = jwt.sign(
      { id: workerUser?.id || workerUser?._id || 'user_demo_worker' },
      process.env.JWT_SECRET || 'aquasense_jwt_secure_secret_2026_dev_key',
      { expiresIn: '-10s' }
    );

    try {
      await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${expiredToken}` }
      });
      throw new Error('Expired token was accepted');
    } catch (err) {
      if (!err.response || err.response.status !== 401) {
        throw new Error(`Expected HTTP 401 for expired token, received ${err.response ? err.response.status : err.message}`);
      }
    }
  });

  logger.info('===============================================================');
  logger.info(`RBAC Test Results: ${passed}/14 Passed, ${failed}/14 Failed`);
  logger.info('===============================================================');

  return { passed, failed, results };
}

if (require.main === module) {
  runRBACTests()
    .then(({ passed, failed }) => {
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((err) => {
      logger.error('Test runner fatal error:', err);
      process.exit(1);
    });
}

module.exports = { runRBACTests };

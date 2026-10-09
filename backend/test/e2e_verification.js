/**
 * AQUASENSE E2E Verification Script
 * Validates running backend (5000) and Python analytics (8000)
 */
const axios = require('axios');

const API = 'http://localhost:5000/api';
const PYTHON_API = 'http://localhost:8000';

async function verify() {
  console.log('--- STARTING AQUASENSE VERIFICATION ---');
  let failures = 0;

  // 1. Python Analytics direct check
  try {
    const pyHealth = await axios.get(`${PYTHON_API}/health`);
    console.log('✅ 1. Python Analytics Service Health:', pyHealth.data);
  } catch (e) {
    console.error('❌ 1. Python Analytics Service failed:', e.message);
    failures++;
  }

  // 2. Node Backend Health check
  try {
    const nodeHealth = await axios.get(`${API}/health`);
    console.log('✅ 2. Node Backend Health:', nodeHealth.data.service, nodeHealth.data.status);
  } catch (e) {
    console.error('❌ 2. Node Backend Health failed:', e.message);
    failures++;
  }

  // 3. Health Worker Login
  let workerToken = null;
  try {
    const workerRes = await axios.post(`${API}/auth/login`, {
      email: 'worker@aquasense.org',
      password: 'password123'
    });
    if (workerRes.data.success && workerRes.data.user.role === 'HEALTH_WORKER') {
      workerToken = workerRes.data.token;
      console.log('✅ 3. Health Worker Login Succeeded. Name:', workerRes.data.user.name, 'Role:', workerRes.data.user.role);
    } else {
      throw new Error('Unexpected response: ' + JSON.stringify(workerRes.data));
    }
  } catch (e) {
    console.error('❌ 3. Health Worker Login failed:', e.message);
    failures++;
  }

  // 4. Health Authority Login
  let authorityToken = null;
  try {
    const authRes = await axios.post(`${API}/auth/login`, {
      email: 'officer@aquasense.org',
      password: 'password123'
    });
    if (authRes.data.success && authRes.data.user.role === 'AUTHORITY') {
      authorityToken = authRes.data.token;
      console.log('✅ 4. Health Authority Login Succeeded. Name:', authRes.data.user.name, 'Role:', authRes.data.user.role);
    } else {
      throw new Error('Unexpected response: ' + JSON.stringify(authRes.data));
    }
  } catch (e) {
    console.error('❌ 4. Health Authority Login failed:', e.message);
    failures++;
  }

  // 5. Case Submission & Risk Scoring & Automatic Alert Generation
  let createdCaseId = null;
  try {
    const casePayload = {
      age: 26,
      gender: 'FEMALE',
      symptoms: ['Watery Diarrhea', 'Severe Dehydration', 'Vomiting', 'Rapid Pulse'],
      suspectedDisease: 'Cholera',
      symptomDate: new Date().toISOString(),
      severity: 'CRITICAL',
      district: 'Central Metro',
      locality: 'Riverbank Slum Colony',
      latitude: 12.9614,
      longitude: 77.5856,
      waterSource: 'Contaminated River Tap',
      waterQualityConcern: true,
      flooding: true,
      notes: 'Cluster outbreak verification case'
    };

    const caseRes = await axios.post(`${API}/cases`, casePayload, {
      headers: { Authorization: `Bearer ${workerToken}` }
    });

    if (caseRes.data.success && caseRes.data.case) {
      createdCaseId = caseRes.data.case._id || caseRes.data.case.caseId;
      console.log('✅ 5. Case Created Successfully.');
      console.log('   - Case ID:', caseRes.data.case.caseId);
      console.log('   - Risk Score:', caseRes.data.risk.score, 'Level:', caseRes.data.risk.level);
      console.log('   - Alert Generated?:', caseRes.data.alertGenerated);
      if (caseRes.data.alert) {
        console.log('   - Alert Details:', caseRes.data.alert.alertId, caseRes.data.alert.riskLevel, caseRes.data.alert.reason);
      }
    } else {
      throw new Error('Case creation invalid: ' + JSON.stringify(caseRes.data));
    }
  } catch (e) {
    console.error('❌ 5. Case Submission failed:', e.message);
    failures++;
  }

  // 6. Database Persistence Verification
  try {
    const fetchRes = await axios.get(`${API}/cases/${createdCaseId}`);
    if (fetchRes.data.success && fetchRes.data.data) {
      console.log('✅ 6. Database Persistence Verified: fetched case', fetchRes.data.data.caseId);
    } else {
      throw new Error('Failed to retrieve persisted case');
    }
  } catch (e) {
    console.error('❌ 6. Database Persistence failed:', e.message);
    failures++;
  }

  // 7. Dashboard Statistics
  try {
    const statsRes = await axios.get(`${API}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${authorityToken}` }
    });
    console.log('✅ 7. Dashboard Statistics:', statsRes.data);
  } catch (e) {
    console.error('❌ 7. Dashboard Stats failed:', e.message);
    failures++;
  }

  // 8. Analytics & Outbreak Map
  try {
    const [trends, symptoms, locations, riskDist, hotspots, anomalies, mapData] = await Promise.all([
      axios.get(`${API}/analytics/trends`),
      axios.get(`${API}/analytics/symptoms`),
      axios.get(`${API}/analytics/locations`),
      axios.get(`${API}/analytics/risk`),
      axios.get(`${API}/analytics/hotspots`),
      axios.get(`${API}/analytics/anomalies`),
      axios.get(`${API}/map/cases`)
    ]);

    console.log('✅ 8. Analytics Endpoints Verified:');
    console.log('   - Trends count:', trends.data.data?.length);
    console.log('   - Symptoms count:', symptoms.data.data?.length);
    console.log('   - Locations count:', locations.data.data?.length);
    console.log('   - Risk Distribution:', riskDist.data);
    console.log('   - Hotspots total:', hotspots.data.totalHotspots || hotspots.data.hotspots?.length);
    console.log('   - Anomalies detected:', anomalies.data.anomaliesDetected || anomalies.data.anomalies?.length);
    console.log('   - Map Cases count:', mapData.data?.length);
  } catch (e) {
    console.error('❌ 8. Analytics & Map endpoints failed:', e.message);
    failures++;
  }

  console.log('--- VERIFICATION COMPLETE ---');
  if (failures > 0) {
    console.error(`Total failures: ${failures}`);
    process.exit(1);
  } else {
    console.log('ALL VERIFICATION CHECKS PASSED PERFECTLY!');
    process.exit(0);
  }
}

verify().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});

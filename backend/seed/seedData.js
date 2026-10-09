/**
 * AQUASENSE - Seed Data Script
 * Generates 40+ realistic epidemiological cases, demo users, and active alerts
 * across normal areas, increasing-case areas, and high-risk hotspots.
 */

const dotenv = require('dotenv');
dotenv.config();

const { connectDB, isMongoActive, getFallbackStore } = require('../src/config/db');
const User = require('../src/models/User');
const Case = require('../src/models/Case');
const Alert = require('../src/models/Alert');
const logger = require('../src/utils/logger');
const { generateCaseId, generateAlertId } = require('../src/utils/idGenerator');

const DEMO_USERS = [
  {
    name: 'Primary Health Worker',
    email: 'healthworker@demo.com',
    password: 'password123',
    role: 'HEALTH_WORKER'
  },
  {
    name: 'District Health Authority',
    email: 'authority@demo.com',
    password: 'password123',
    role: 'HEALTH_AUTHORITY'
  },
  {
    name: 'Dr. Aisha Sharma',
    email: 'admin@aquasense.org',
    password: 'password123',
    role: 'HEALTH_AUTHORITY'
  },
  {
    name: 'Public Health Officer Rajesh',
    email: 'officer@aquasense.org',
    password: 'password123',
    role: 'HEALTH_AUTHORITY'
  },
  {
    name: 'Community Health Worker Priya',
    email: 'worker@aquasense.org',
    password: 'password123',
    role: 'HEALTH_WORKER'
  }
];

// Helper to generate past dates
const daysAgo = (days, hoursOffset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hoursOffset);
  return d;
};

const CASES_DATA = [
  // --- CLUSTER 1: HIGH-RISK OUTBREAK HOTSPOT (Riverbank Slum Colony) ---
  // Acute surge in watery diarrhea & vomiting due to flooded water source
  {
    caseId: 'CASE-HOT-001',
    age: 34,
    gender: 'FEMALE',
    symptoms: ['Watery Diarrhea', 'Severe Dehydration', 'Vomiting'],
    suspectedDisease: 'Cholera',
    symptomDate: daysAgo(0, 4),
    reportedDate: daysAgo(0, 2),
    severity: 'CRITICAL',
    district: 'Central Metro',
    locality: 'Riverbank Slum Colony',
    latitude: 12.9612,
    longitude: 77.5854,
    waterSource: 'Flooded Riverbank Tap',
    waterQualityConcern: true,
    flooding: true,
    similarCasesNearby: 14,
    riskScore: 92,
    riskLevel: 'CRITICAL',
    status: 'CONFIRMED'
  },
  {
    caseId: 'CASE-HOT-002',
    age: 8,
    gender: 'MALE',
    symptoms: ['Watery Diarrhea', 'Vomiting', 'Lethargy'],
    suspectedDisease: 'Cholera',
    symptomDate: daysAgo(0, 6),
    reportedDate: daysAgo(0, 3),
    severity: 'CRITICAL',
    district: 'Central Metro',
    locality: 'Riverbank Slum Colony',
    latitude: 12.9615,
    longitude: 77.5858,
    waterSource: 'Flooded Riverbank Tap',
    waterQualityConcern: true,
    flooding: true,
    similarCasesNearby: 14,
    riskScore: 90,
    riskLevel: 'CRITICAL',
    status: 'INVESTIGATING'
  },
  {
    caseId: 'CASE-HOT-003',
    age: 45,
    gender: 'MALE',
    symptoms: ['Watery Diarrhea', 'Abdominal Cramps', 'Vomiting'],
    suspectedDisease: 'Cholera',
    symptomDate: daysAgo(1, 2),
    reportedDate: daysAgo(0, 8),
    severity: 'CRITICAL',
    district: 'Central Metro',
    locality: 'Riverbank Slum Colony',
    latitude: 12.9609,
    longitude: 77.5851,
    waterSource: 'Contaminated Open Well',
    waterQualityConcern: true,
    flooding: true,
    similarCasesNearby: 13,
    riskScore: 89,
    riskLevel: 'CRITICAL',
    status: 'CONFIRMED'
  },
  {
    caseId: 'CASE-HOT-004',
    age: 22,
    gender: 'FEMALE',
    symptoms: ['Watery Diarrhea', 'Vomiting', 'Low Blood Pressure'],
    suspectedDisease: 'Cholera',
    symptomDate: daysAgo(1, 5),
    reportedDate: daysAgo(1, 1),
    severity: 'HIGH',
    district: 'Central Metro',
    locality: 'Riverbank Slum Colony',
    latitude: 12.9618,
    longitude: 77.5862,
    waterSource: 'Contaminated Open Well',
    waterQualityConcern: true,
    flooding: true,
    similarCasesNearby: 12,
    riskScore: 86,
    riskLevel: 'CRITICAL',
    status: 'INVESTIGATING'
  },
  {
    caseId: 'CASE-HOT-005',
    age: 62,
    gender: 'MALE',
    symptoms: ['Severe Dehydration', 'Watery Diarrhea', 'Muscle Cramps'],
    suspectedDisease: 'Cholera',
    symptomDate: daysAgo(1, 8),
    reportedDate: daysAgo(1, 3),
    severity: 'CRITICAL',
    district: 'Central Metro',
    locality: 'Riverbank Slum Colony',
    latitude: 12.9605,
    longitude: 77.5849,
    waterSource: 'Flooded Riverbank Tap',
    waterQualityConcern: true,
    flooding: true,
    similarCasesNearby: 11,
    riskScore: 91,
    riskLevel: 'CRITICAL',
    status: 'REPORTED'
  },
  {
    caseId: 'CASE-HOT-006',
    age: 29,
    gender: 'FEMALE',
    symptoms: ['Watery Diarrhea', 'Nausea', 'Abdominal Pain'],
    suspectedDisease: 'Acute Gastroenteritis',
    symptomDate: daysAgo(2, 3),
    reportedDate: daysAgo(2, 1),
    severity: 'HIGH',
    district: 'Central Metro',
    locality: 'Riverbank Slum Colony',
    latitude: 12.9622,
    longitude: 77.5855,
    waterSource: 'Flooded Riverbank Tap',
    waterQualityConcern: true,
    flooding: true,
    similarCasesNearby: 10,
    riskScore: 84,
    riskLevel: 'CRITICAL',
    status: 'CONFIRMED'
  },
  {
    caseId: 'CASE-HOT-007',
    age: 14,
    gender: 'MALE',
    symptoms: ['Watery Diarrhea', 'Vomiting', 'Dehydration'],
    suspectedDisease: 'Cholera',
    symptomDate: daysAgo(2, 6),
    reportedDate: daysAgo(2, 2),
    severity: 'HIGH',
    district: 'Central Metro',
    locality: 'Riverbank Slum Colony',
    latitude: 12.9611,
    longitude: 77.5859,
    waterSource: 'Contaminated Open Well',
    waterQualityConcern: true,
    flooding: true,
    similarCasesNearby: 9,
    riskScore: 82,
    riskLevel: 'CRITICAL',
    status: 'INVESTIGATING'
  },
  {
    caseId: 'CASE-HOT-008',
    age: 40,
    gender: 'FEMALE',
    symptoms: ['Watery Diarrhea', 'Abdominal Cramps'],
    suspectedDisease: 'Acute Gastroenteritis',
    symptomDate: daysAgo(3, 4),
    reportedDate: daysAgo(3, 1),
    severity: 'HIGH',
    district: 'Central Metro',
    locality: 'Riverbank Slum Colony',
    latitude: 12.9614,
    longitude: 77.5847,
    waterSource: 'Flooded Riverbank Tap',
    waterQualityConcern: true,
    flooding: true,
    similarCasesNearby: 8,
    riskScore: 80,
    riskLevel: 'CRITICAL',
    status: 'CONFIRMED'
  },
  {
    caseId: 'CASE-HOT-009',
    age: 51,
    gender: 'MALE',
    symptoms: ['Vomiting', 'Watery Diarrhea', 'Weakness'],
    suspectedDisease: 'Cholera',
    symptomDate: daysAgo(3, 8),
    reportedDate: daysAgo(3, 2),
    severity: 'HIGH',
    district: 'Central Metro',
    locality: 'Riverbank Slum Colony',
    latitude: 12.9607,
    longitude: 77.5864,
    waterSource: 'Flooded Riverbank Tap',
    waterQualityConcern: true,
    flooding: true,
    similarCasesNearby: 7,
    riskScore: 78,
    riskLevel: 'CRITICAL',
    status: 'REPORTED'
  },
  {
    caseId: 'CASE-HOT-010',
    age: 19,
    gender: 'FEMALE',
    symptoms: ['Watery Diarrhea', 'Nausea'],
    suspectedDisease: 'Acute Gastroenteritis',
    symptomDate: daysAgo(4, 2),
    reportedDate: daysAgo(4, 1),
    severity: 'MODERATE',
    district: 'Central Metro',
    locality: 'Riverbank Slum Colony',
    latitude: 12.9620,
    longitude: 77.5852,
    waterSource: 'Contaminated Open Well',
    waterQualityConcern: true,
    flooding: false,
    similarCasesNearby: 6,
    riskScore: 68,
    riskLevel: 'HIGH',
    status: 'RESOLVED'
  },
  {
    caseId: 'CASE-HOT-011',
    age: 31,
    gender: 'MALE',
    symptoms: ['Watery Diarrhea', 'Abdominal Pain'],
    suspectedDisease: 'Acute Gastroenteritis',
    symptomDate: daysAgo(5, 5),
    reportedDate: daysAgo(5, 2),
    severity: 'MODERATE',
    district: 'Central Metro',
    locality: 'Riverbank Slum Colony',
    latitude: 12.9613,
    longitude: 77.5861,
    waterSource: 'Contaminated Open Well',
    waterQualityConcern: true,
    flooding: false,
    similarCasesNearby: 5,
    riskScore: 65,
    riskLevel: 'HIGH',
    status: 'RESOLVED'
  },
  {
    caseId: 'CASE-HOT-012',
    age: 26,
    gender: 'FEMALE',
    symptoms: ['Watery Diarrhea', 'Vomiting'],
    suspectedDisease: 'Cholera',
    symptomDate: daysAgo(6, 4),
    reportedDate: daysAgo(6, 1),
    severity: 'HIGH',
    district: 'Central Metro',
    locality: 'Riverbank Slum Colony',
    latitude: 12.9608,
    longitude: 77.5856,
    waterSource: 'Flooded Riverbank Tap',
    waterQualityConcern: true,
    flooding: false,
    similarCasesNearby: 4,
    riskScore: 72,
    riskLevel: 'HIGH',
    status: 'RESOLVED'
  },

  // --- CLUSTER 2: INCREASING-CASE AREA (Old Market Basti) ---
  // Escalating cases with broken municipal water line
  {
    caseId: 'CASE-INC-001',
    age: 38,
    gender: 'MALE',
    symptoms: ['High Fever', 'Watery Diarrhea', 'Abdominal Pain'],
    suspectedDisease: 'Typhoid',
    symptomDate: daysAgo(0, 5),
    reportedDate: daysAgo(0, 3),
    severity: 'HIGH',
    district: 'Central Metro',
    locality: 'Old Market Basti',
    latitude: 12.9782,
    longitude: 77.5924,
    waterSource: 'Broken Municipal Pipeline',
    waterQualityConcern: true,
    flooding: false,
    similarCasesNearby: 8,
    riskScore: 74,
    riskLevel: 'HIGH',
    status: 'INVESTIGATING'
  },
  {
    caseId: 'CASE-INC-002',
    age: 21,
    gender: 'FEMALE',
    symptoms: ['Watery Diarrhea', 'Abdominal Cramps', 'Vomiting'],
    suspectedDisease: 'Acute Gastroenteritis',
    symptomDate: daysAgo(1, 4),
    reportedDate: daysAgo(0, 7),
    severity: 'HIGH',
    district: 'Central Metro',
    locality: 'Old Market Basti',
    latitude: 12.9786,
    longitude: 77.5929,
    waterSource: 'Broken Municipal Pipeline',
    waterQualityConcern: true,
    flooding: false,
    similarCasesNearby: 8,
    riskScore: 71,
    riskLevel: 'HIGH',
    status: 'CONFIRMED'
  },
  {
    caseId: 'CASE-INC-003',
    age: 47,
    gender: 'MALE',
    symptoms: ['Fever', 'Bloody Stool', 'Abdominal Cramps'],
    suspectedDisease: 'Dysentery',
    symptomDate: daysAgo(1, 8),
    reportedDate: daysAgo(1, 2),
    severity: 'HIGH',
    district: 'Central Metro',
    locality: 'Old Market Basti',
    latitude: 12.9778,
    longitude: 77.5919,
    waterSource: 'Broken Municipal Pipeline',
    waterQualityConcern: true,
    flooding: false,
    similarCasesNearby: 7,
    riskScore: 69,
    riskLevel: 'HIGH',
    status: 'REPORTED'
  },
  {
    caseId: 'CASE-INC-004',
    age: 16,
    gender: 'FEMALE',
    symptoms: ['Watery Diarrhea', 'Nausea', 'Fever'],
    suspectedDisease: 'Acute Gastroenteritis',
    symptomDate: daysAgo(2, 5),
    reportedDate: daysAgo(2, 1),
    severity: 'MODERATE',
    district: 'Central Metro',
    locality: 'Old Market Basti',
    latitude: 12.9789,
    longitude: 77.5925,
    waterSource: 'Broken Municipal Pipeline',
    waterQualityConcern: true,
    flooding: false,
    similarCasesNearby: 6,
    riskScore: 62,
    riskLevel: 'HIGH',
    status: 'INVESTIGATING'
  },
  {
    caseId: 'CASE-INC-005',
    age: 55,
    gender: 'FEMALE',
    symptoms: ['High Fever', 'Chills', 'Abdominal Pain'],
    suspectedDisease: 'Typhoid',
    symptomDate: daysAgo(3, 6),
    reportedDate: daysAgo(3, 2),
    severity: 'MODERATE',
    district: 'Central Metro',
    locality: 'Old Market Basti',
    latitude: 12.9780,
    longitude: 77.5932,
    waterSource: 'Broken Municipal Pipeline',
    waterQualityConcern: true,
    flooding: false,
    similarCasesNearby: 5,
    riskScore: 58,
    riskLevel: 'HIGH',
    status: 'CONFIRMED'
  },
  {
    caseId: 'CASE-INC-006',
    age: 11,
    gender: 'MALE',
    symptoms: ['Watery Diarrhea', 'Vomiting'],
    suspectedDisease: 'Acute Gastroenteritis',
    symptomDate: daysAgo(4, 3),
    reportedDate: daysAgo(4, 1),
    severity: 'MODERATE',
    district: 'Central Metro',
    locality: 'Old Market Basti',
    latitude: 12.9784,
    longitude: 77.5918,
    waterSource: 'Broken Municipal Pipeline',
    waterQualityConcern: false,
    flooding: false,
    similarCasesNearby: 4,
    riskScore: 54,
    riskLevel: 'HIGH',
    status: 'RESOLVED'
  },
  {
    caseId: 'CASE-INC-007',
    age: 33,
    gender: 'MALE',
    symptoms: ['Abdominal Cramps', 'Nausea'],
    suspectedDisease: 'Acute Gastroenteritis',
    symptomDate: daysAgo(6, 4),
    reportedDate: daysAgo(6, 1),
    severity: 'MODERATE',
    district: 'Central Metro',
    locality: 'Old Market Basti',
    latitude: 12.9779,
    longitude: 77.5922,
    waterSource: 'Community Borewell',
    waterQualityConcern: false,
    flooding: false,
    similarCasesNearby: 3,
    riskScore: 46,
    riskLevel: 'MODERATE',
    status: 'RESOLVED'
  },

  // --- CLUSTER 3: MODERATE EARLY WARNING (Sector 4 Industrial Colony) ---
  {
    caseId: 'CASE-MOD-001',
    age: 28,
    gender: 'MALE',
    symptoms: ['Abdominal Cramps', 'Watery Diarrhea'],
    suspectedDisease: 'Dysentery',
    symptomDate: daysAgo(1, 6),
    reportedDate: daysAgo(1, 2),
    severity: 'MODERATE',
    district: 'South Industrial',
    locality: 'Sector 4 Industrial Colony',
    latitude: 12.9354,
    longitude: 77.6105,
    waterSource: 'Industrial Worker Tanker',
    waterQualityConcern: true,
    flooding: false,
    similarCasesNearby: 5,
    riskScore: 48,
    riskLevel: 'MODERATE',
    status: 'INVESTIGATING'
  },
  {
    caseId: 'CASE-MOD-002',
    age: 32,
    gender: 'FEMALE',
    symptoms: ['Nausea', 'Mild Diarrhea', 'Fever'],
    suspectedDisease: 'Acute Gastroenteritis',
    symptomDate: daysAgo(2, 4),
    reportedDate: daysAgo(2, 1),
    severity: 'MODERATE',
    district: 'South Industrial',
    locality: 'Sector 4 Industrial Colony',
    latitude: 12.9351,
    longitude: 77.6101,
    waterSource: 'Industrial Worker Tanker',
    waterQualityConcern: true,
    flooding: false,
    similarCasesNearby: 4,
    riskScore: 45,
    riskLevel: 'MODERATE',
    status: 'CONFIRMED'
  },
  {
    caseId: 'CASE-MOD-003',
    age: 41,
    gender: 'MALE',
    symptoms: ['Abdominal Pain', 'Vomiting'],
    suspectedDisease: 'Acute Gastroenteritis',
    symptomDate: daysAgo(3, 5),
    reportedDate: daysAgo(3, 2),
    severity: 'MODERATE',
    district: 'South Industrial',
    locality: 'Sector 4 Industrial Colony',
    latitude: 12.9358,
    longitude: 77.6109,
    waterSource: 'Industrial Worker Tanker',
    waterQualityConcern: false,
    flooding: false,
    similarCasesNearby: 3,
    riskScore: 42,
    riskLevel: 'MODERATE',
    status: 'REPORTED'
  },
  {
    caseId: 'CASE-MOD-004',
    age: 24,
    gender: 'FEMALE',
    symptoms: ['Mild Diarrhea', 'Headache'],
    suspectedDisease: 'Acute Gastroenteritis',
    symptomDate: daysAgo(5, 7),
    reportedDate: daysAgo(5, 3),
    severity: 'LOW',
    district: 'South Industrial',
    locality: 'Sector 4 Industrial Colony',
    latitude: 12.9348,
    longitude: 77.6102,
    waterSource: 'Industrial Worker Tanker',
    waterQualityConcern: false,
    flooding: false,
    similarCasesNearby: 2,
    riskScore: 35,
    riskLevel: 'MODERATE',
    status: 'RESOLVED'
  },
  {
    caseId: 'CASE-MOD-005',
    age: 50,
    gender: 'MALE',
    symptoms: ['Nausea', 'Fever'],
    suspectedDisease: 'Hepatitis A',
    symptomDate: daysAgo(7, 3),
    reportedDate: daysAgo(7, 1),
    severity: 'MODERATE',
    district: 'South Industrial',
    locality: 'Sector 4 Industrial Colony',
    latitude: 12.9355,
    longitude: 77.6112,
    waterSource: 'Community Borewell',
    waterQualityConcern: false,
    flooding: false,
    similarCasesNearby: 1,
    riskScore: 32,
    riskLevel: 'MODERATE',
    status: 'RESOLVED'
  },

  // --- CLUSTER 4: NORMAL / BASELINE SURVEILLANCE AREAS (Low Risk) ---
  // Greenfield Heights (Treated Municipal Supply)
  {
    caseId: 'CASE-NORM-001',
    age: 27,
    gender: 'FEMALE',
    symptoms: ['Mild Nausea', 'Headache'],
    suspectedDisease: 'Acute Gastroenteritis',
    symptomDate: daysAgo(2, 6),
    reportedDate: daysAgo(2, 2),
    severity: 'LOW',
    district: 'East Suburbs',
    locality: 'Greenfield Heights',
    latitude: 12.9912,
    longitude: 77.6515,
    waterSource: 'Treated Piped Municipal',
    waterQualityConcern: false,
    flooding: false,
    similarCasesNearby: 1,
    riskScore: 18,
    riskLevel: 'LOW',
    status: 'RESOLVED'
  },
  {
    caseId: 'CASE-NORM-002',
    age: 36,
    gender: 'MALE',
    symptoms: ['Mild Diarrhea'],
    suspectedDisease: 'Acute Gastroenteritis',
    symptomDate: daysAgo(6, 4),
    reportedDate: daysAgo(6, 1),
    severity: 'LOW',
    district: 'East Suburbs',
    locality: 'Greenfield Heights',
    latitude: 12.9908,
    longitude: 77.6521,
    waterSource: 'Treated Piped Municipal',
    waterQualityConcern: false,
    flooding: false,
    similarCasesNearby: 0,
    riskScore: 15,
    riskLevel: 'LOW',
    status: 'RESOLVED'
  },
  // Silver Oaks Cantonment
  {
    caseId: 'CASE-NORM-003',
    age: 48,
    gender: 'FEMALE',
    symptoms: ['Abdominal Discomfort', 'Fatigue'],
    suspectedDisease: 'Acute Gastroenteritis',
    symptomDate: daysAgo(3, 8),
    reportedDate: daysAgo(3, 3),
    severity: 'LOW',
    district: 'South Cantonment',
    locality: 'Silver Oaks Cantonment',
    latitude: 12.9152,
    longitude: 77.6418,
    waterSource: 'Reverse Osmosis Filtered Supply',
    waterQualityConcern: false,
    flooding: false,
    similarCasesNearby: 1,
    riskScore: 16,
    riskLevel: 'LOW',
    status: 'RESOLVED'
  },
  {
    caseId: 'CASE-NORM-004',
    age: 18,
    gender: 'MALE',
    symptoms: ['Mild Nausea'],
    suspectedDisease: 'Acute Gastroenteritis',
    symptomDate: daysAgo(8, 2),
    reportedDate: daysAgo(8, 1),
    severity: 'LOW',
    district: 'South Cantonment',
    locality: 'Silver Oaks Cantonment',
    latitude: 12.9148,
    longitude: 77.6405,
    waterSource: 'Reverse Osmosis Filtered Supply',
    waterQualityConcern: false,
    flooding: false,
    similarCasesNearby: 0,
    riskScore: 12,
    riskLevel: 'LOW',
    status: 'RESOLVED'
  },
  // Central Hill Enclave
  {
    caseId: 'CASE-NORM-005',
    age: 52,
    gender: 'MALE',
    symptoms: ['Mild Diarrhea', 'Fatigue'],
    suspectedDisease: 'Acute Gastroenteritis',
    symptomDate: daysAgo(4, 5),
    reportedDate: daysAgo(4, 2),
    severity: 'LOW',
    district: 'West Hills',
    locality: 'Central Hill Enclave',
    latitude: 12.9715,
    longitude: 77.5612,
    waterSource: 'Treated Piped Municipal',
    waterQualityConcern: false,
    flooding: false,
    similarCasesNearby: 0,
    riskScore: 20,
    riskLevel: 'LOW',
    status: 'RESOLVED'
  },
  {
    caseId: 'CASE-NORM-006',
    age: 23,
    gender: 'FEMALE',
    symptoms: ['Abdominal Cramps'],
    suspectedDisease: 'Acute Gastroenteritis',
    symptomDate: daysAgo(9, 4),
    reportedDate: daysAgo(9, 1),
    severity: 'LOW',
    district: 'West Hills',
    locality: 'Central Hill Enclave',
    latitude: 12.9721,
    longitude: 77.5620,
    waterSource: 'Treated Piped Municipal',
    waterQualityConcern: false,
    flooding: false,
    similarCasesNearby: 0,
    riskScore: 14,
    riskLevel: 'LOW',
    status: 'RESOLVED'
  },
  // Lakeview Gardens
  {
    caseId: 'CASE-NORM-007',
    age: 39,
    gender: 'FEMALE',
    symptoms: ['Fever', 'Nausea'],
    suspectedDisease: 'Typhoid',
    symptomDate: daysAgo(5, 7),
    reportedDate: daysAgo(5, 2),
    severity: 'MODERATE',
    district: 'East Suburbs',
    locality: 'Lakeview Gardens',
    latitude: 12.9845,
    longitude: 77.6250,
    waterSource: 'Treated Piped Municipal',
    waterQualityConcern: false,
    flooding: false,
    similarCasesNearby: 1,
    riskScore: 28,
    riskLevel: 'LOW',
    status: 'INVESTIGATING'
  },
  {
    caseId: 'CASE-NORM-008',
    age: 65,
    gender: 'MALE',
    symptoms: ['Mild Diarrhea'],
    suspectedDisease: 'Acute Gastroenteritis',
    symptomDate: daysAgo(7, 6),
    reportedDate: daysAgo(7, 2),
    severity: 'LOW',
    district: 'East Suburbs',
    locality: 'Lakeview Gardens',
    latitude: 12.9851,
    longitude: 77.6258,
    waterSource: 'Treated Piped Municipal',
    waterQualityConcern: false,
    flooding: false,
    similarCasesNearby: 0,
    riskScore: 19,
    riskLevel: 'LOW',
    status: 'RESOLVED'
  },

  // Additional cases for rich date spread and symptom variety
  {
    caseId: 'CASE-EXTRA-001',
    age: 30,
    gender: 'MALE',
    symptoms: ['Watery Diarrhea', 'Vomiting', 'Abdominal Cramps'],
    suspectedDisease: 'Cholera',
    symptomDate: daysAgo(0, 1),
    reportedDate: daysAgo(0, 1),
    severity: 'CRITICAL',
    district: 'Central Metro',
    locality: 'Riverbank Slum Colony',
    latitude: 12.9616,
    longitude: 77.5857,
    waterSource: 'Flooded Riverbank Tap',
    waterQualityConcern: true,
    flooding: true,
    similarCasesNearby: 15,
    riskScore: 94,
    riskLevel: 'CRITICAL',
    status: 'REPORTED'
  },
  {
    caseId: 'CASE-EXTRA-002',
    age: 12,
    gender: 'FEMALE',
    symptoms: ['High Fever', 'Watery Diarrhea'],
    suspectedDisease: 'Typhoid',
    symptomDate: daysAgo(0, 2),
    reportedDate: daysAgo(0, 1),
    severity: 'HIGH',
    district: 'Central Metro',
    locality: 'Old Market Basti',
    latitude: 12.9785,
    longitude: 77.5927,
    waterSource: 'Broken Municipal Pipeline',
    waterQualityConcern: true,
    flooding: false,
    similarCasesNearby: 9,
    riskScore: 76,
    riskLevel: 'CRITICAL',
    status: 'REPORTED'
  }
];

const DEMO_ALERTS = [
  {
    alertId: 'ALT-2026-HOT-01',
    location: 'Riverbank Slum Colony',
    riskLevel: 'CRITICAL',
    caseCount: 13,
    reason: 'Epidemic surge detected: Rapid increase in suspected Cholera cases with high clinical severity following localized riverbank flooding.',
    recommendedAction: 'URGENT: Deploy rapid epidemic response team to Riverbank Slum Colony. Initiate emergency chlorine purification distribution, set up localized Oral Rehydration Therapy (ORT) corners, and seal contaminated open wells.',
    status: 'ACTIVE'
  },
  {
    alertId: 'ALT-2026-INC-02',
    location: 'Old Market Basti',
    riskLevel: 'HIGH',
    caseCount: 8,
    reason: 'Accelerating cluster of acute gastrointestinal infections linked to compromised municipal distribution pipeline.',
    recommendedAction: 'HIGH PRIORITY: Issue public boil-water advisory for Old Market Basti. Dispatch municipal water engineering team to isolate and repair damaged pipeline section. Distribute halogen tablets.',
    status: 'ACTIVE'
  },
  {
    alertId: 'ALT-2026-MOD-03',
    location: 'Sector 4 Industrial Colony',
    riskLevel: 'MODERATE',
    caseCount: 5,
    reason: 'Elevated case count identified among industrial worker barracks sharing private tanker water source.',
    recommendedAction: 'Inspect commercial water delivery tankers serving Sector 4. Conduct microbiological culture testing of water tanks.',
    status: 'ACKNOWLEDGED'
  }
];

const seedDatabase = async () => {
  try {
    logger.info('Starting AQUASENSE database seeding routine...');
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Case.deleteMany({});
    await Alert.deleteMany({});
    logger.info('Cleared existing users, cases, and alerts.');

    // 1. Seed Users
    logger.info(`Seeding ${DEMO_USERS.length} user accounts...`);
    for (const userData of DEMO_USERS) {
      await User.create(userData);
    }
    logger.success(`Seeded ${DEMO_USERS.length} users successfully!`);

    // 2. Seed Cases
    logger.info(`Seeding ${CASES_DATA.length} epidemiological cases...`);
    for (const caseData of CASES_DATA) {
      await Case.create(caseData);
    }
    logger.success(`Seeded ${CASES_DATA.length} cases successfully!`);

    // 3. Seed Alerts
    logger.info(`Seeding ${DEMO_ALERTS.length} public health alerts...`);
    for (const alertData of DEMO_ALERTS) {
      await Alert.create(alertData);
    }
    logger.success(`Seeded ${DEMO_ALERTS.length} alerts successfully!`);

    logger.success('========================================================');
    logger.success('🎉 AQUASENSE DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    logger.success(`   👥 Users: ${DEMO_USERS.length} (Admin, Authority, Health Worker)`);
    logger.success(`   📋 Cases: ${CASES_DATA.length} across 6 distinct localities`);
    logger.success(`   🚨 Alerts: ${DEMO_ALERTS.length} (Critical, High, Moderate)`);
    logger.success('========================================================');

    if (process.env.NODE_ENV !== 'test') {
      process.exit(0);
    }
  } catch (err) {
    logger.error(`Failed to seed database: ${err.message}`);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, CASES_DATA, DEMO_USERS, DEMO_ALERTS };

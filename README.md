# AQUASENSE 🌊
### AI-Powered Water-Borne Disease Outbreak Early Warning System

> **Medical Disclaimer**: AQUASENSE is a public health surveillance and early-warning decision support system. It does **not** provide medical diagnoses or substitute professional clinical judgment.

---

## 📌 Problem & Overview

Water-borne disease outbreaks (such as Cholera, Acute Gastroenteritis, Typhoid, and Dysentery) frequently escalate into epidemics because health workers lack systematic case-data collection, spatial clustering tools, and real-time predictive analytics.

**AQUASENSE** bridges this gap:
- Collects and standardizes clinical case reports from community health workers.
- Evaluates multi-factor outbreak risk (0–100 score) using a transparent scoring engine.
- Detects abnormal surges compared to historical baselines using Isolation Forest & statistical z-score methods.
- Aggregates cases geographically to pinpoint outbreak hotspots and clusters.
- Automatically dispatches high-priority public health alerts when critical thresholds are exceeded.
- Serves clean, high-performance REST APIs to power interactive frontend dashboards and GIS maps.

---

## 🏗️ Architecture

```
                 +-----------------------------------+
                 |    React / Web Frontend App       |
                 +-----------------+-----------------+
                                   | REST API (JSON)
                                   v
+--------------------------------------------------------------------+
|                Node.js + Express API Gateway (Port 5000)           |
|                                                                    |
|  ├── Authentication (JWT & bcrypt)                                 |
|  ├── Case Management (CRUD + Geospatial Metadata)                  |
|  ├── Alert Management & Auto-Triggering                            |
|  ├── Dashboard Aggregations (/api/dashboard/stats)                 |
|  ├── Map Telemetry (/api/map/cases)                                |
|  └── Analytics Gateway (Trends, Symptoms, Locations, Risk)         |
+-------------------+----------------------------+-------------------+
                    |                            |
       Mongoose / DB|                            | HTTP REST
                    v                            v
+-----------------------------+   +----------------------------------+
|      MongoDB Database       |   | Python FastAPI Service (Port 8000)|
| (Local / Atlas / Fallback)  |   |                                  |
|                             |   |  ├── Transparent Risk Scoring    |
|  ├── Users Collection       |   |  ├── Baseline Anomaly Detector   |
|  ├── Cases Collection       |   |  ├── Scikit-Learn Isolation Forest|
|  └── Alerts Collection      |   |  └── Geospatial Hotspot Cluster  |
+-----------------------------+   +----------------------------------+
```

---

## 📁 Project Structure

```
backend/
│
├── src/
│   ├── config/
│   │   ├── db.js                 # Resilient dual-mode DB connector & persistence
│   │   └── aquasense_store.json  # Seeded persistent datastore
│   ├── controllers/
│   │   ├── alertController.js    # Alert listing, creation, status updates
│   │   ├── analyticsController.js# Trends, symptoms, locations, risk breakdown
│   │   ├── authController.js     # User registration, login, profile (/me)
│   │   ├── caseController.js     # Case reports & automated analytics trigger
│   │   ├── dashboardController.js# High-level KPIs (/api/dashboard/stats)
│   │   └── mapController.js      # GIS coordinate points for map pins
│   ├── middleware/
│   │   ├── auth.js               # JWT bearer token authentication
│   │   ├── errorHandler.js       # Centralized 404 & error handlers
│   │   ├── roleCheck.js          # Role-based authorization guard
│   │   └── validate.js           # Input validation rules
│   ├── models/
│   │   ├── Alert.js              # Alert schema & query adapter
│   │   ├── Case.js               # Clinical case schema & geospatial queries
│   │   └── User.js               # User accounts & bcrypt password hashing
│   ├── routes/
│   │   ├── alertRoutes.js        # /api/alerts
│   │   ├── analyticsRoutes.js    # /api/analytics/*
│   │   ├── authRoutes.js         # /api/auth/*
│   │   ├── caseRoutes.js         # /api/cases/*
│   │   ├── dashboardRoutes.js    # /api/dashboard/*
│   │   ├── healthRoutes.js       # /api/health
│   │   └── mapRoutes.js          # /api/map/*
│   ├── services/
│   │   ├── alertService.js       # Automated alert triggering engine
│   │   ├── analyticsClient.js    # Node -> Python FastAPI HTTP client
│   │   └── riskService.js        # Locality analytics & risk orchestrator
│   ├── utils/
│   │   ├── idGenerator.js        # Formatted readable IDs (CASE-*, ALT-*)
│   │   └── logger.js             # Structured console logging
│   └── server.js                 # Express server bootstrap & middleware
│
├── analytics/
│   ├── main.py                   # FastAPI application & API endpoints
│   ├── risk_model.py             # Transparent multi-factor risk engine
│   ├── anomaly_detection.py      # Statistical z-score & Isolation Forest
│   ├── hotspot_detection.py      # Spatial coordinate density clustering
│   └── requirements.txt          # Python ML dependencies
│
├── seed/
│   └── seedData.js               # Realistic dataset (34 cases, 3 alerts, 3 users)
│
├── test/
│   └── api.test.js               # 21-point automated end-to-end test suite
│
├── .env                          # Local environment variables
├── .env.example                  # Environment template
├── package.json                  # NPM dependencies and scripts
└── README.md                     # Comprehensive documentation
```

---

## ⚙️ Prerequisites & Tech Stack

- **Node.js**: v18+ (tested on Node.js v24)
- **Python**: 3.10+ (tested on Python 3.13)
- **MongoDB**: (Optional) MongoDB local or MongoDB Atlas. AQUASENSE automatically detects if MongoDB is offline and activates its built-in persistent datastore so the backend runs anywhere out of the box!
- **Libraries**:
  - Express.js, Mongoose, JWT, bcryptjs, Axios, CORS, Morgan, Concurrently
  - FastAPI, Uvicorn, Pandas, NumPy, Scikit-learn, Pydantic

---

## 🚀 Quick Start & Installation

### 1. Install Node Dependencies
```bash
npm install
```

### 2. Install Python Analytics Dependencies
```bash
pip install -r analytics/requirements.txt
```
*(Or `python -m pip install fastapi uvicorn pandas numpy scikit-learn`)*

### 3. Setup Environment Variables
Copy `.env.example` to `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/aquasense
JWT_SECRET=aquasense_jwt_secure_secret_2026_dev_key
ANALYTICS_URL=http://localhost:8000
NODE_ENV=development
```

### 4. Seed Database with Realistic Demo Data
```bash
npm run seed
```
Seeds 34 realistic epidemiological cases across multiple localities (hotspots, increasing zones, normal areas), 3 public health alerts, and 3 pre-configured user accounts.

### 5. Start the Services

#### Option A: Start Both Services Concurrently (Recommended)
```bash
npm run dev:all
```

#### Option B: Start Services in Separate Terminals

**Terminal 1 (Python Analytics Service):**
```bash
python analytics/main.py
# Runs on http://localhost:8000
```

**Terminal 2 (Node.js Backend Server):**
```bash
npm run dev
# Runs on http://localhost:5000
```

---

## 🧪 Running the Test Suite

Run the full end-to-end automated test suite:
```bash
npm test
```
Validates all 21 endpoints, JWT authentication, risk scoring, anomaly detection, map points, CRUD operations, and automatic alert dispatching.

---

## 🔑 Demo User Credentials

The database comes pre-seeded with these accounts:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **ADMIN** | `admin@aquasense.org` | `password123` | Full administrative control |
| **AUTHORITY** | `officer@aquasense.org` | `password123` | Public health officers & alert response |
| **HEALTH_WORKER** | `worker@aquasense.org` | `password123` | Case reporting and field surveillance |

---

## 🧠 Risk Engine & AI Analytics

### 1. Transparent Outbreak Risk Scoring (0–100)
The risk engine implements an explainable multi-factor model:

| Factor | Weight | Evaluation Criteria |
|---|---|---|
| **Case Volume** | 0–18 pts | Absolute volume of active cases in locality window |
| **Growth Rate & Surge** | 0–28 pts | Percentage increase over prior baseline window (e.g. +150% growth) |
| **Spatial Clustering** | 0–24 pts | Geographic density & matching symptomatic case concentration |
| **Clinical Severity** | 0–22 pts | Mild (6), Moderate (14), High (22), Critical (25) |
| **Environmental Hazard** | 0–8 pts | Reported flooding (+4.5) and water quality concerns (+3.5) |

#### Risk Classifications:
- **0–30**: `LOW`
- **31–50**: `MODERATE`
- **51–75**: `HIGH`
- **76–100**: `CRITICAL`

### 2. Anomaly Detection
- **Statistical Z-Score Baseline**: Compares current daily counts against historical average:
  $$\text{Z-Score} = \frac{\text{Current} - \text{Baseline Mean}}{\text{Std Dev}}$$
  Flags abnormal surges when $Z \ge 2.0$ (e.g. baseline 5 cases/day $\rightarrow$ spike of 18 cases/day).
- **Scikit-Learn Isolation Forest**: Unsupervised multivariate outlier detection flagging abnormal velocity shifts.

### 3. Hotspot Detection
- Groups reports by coordinate clusters and localities.
- Calculates cluster centroids, density spread radius (km), predominant symptoms, and risk levels.

### 4. Automatic Alert Generation Workflow
When a new case is posted to `POST /api/cases`:
1. Saves case to database.
2. Evaluates historical window in the same locality.
3. Calculates growth velocity and similar symptom concentration.
4. Calls Python `/predict-risk` endpoint (or transparent JS fallback).
5. If risk is **`HIGH`** or **`CRITICAL`**:
   - Automatically generates a public health `ALERT`.
   - Generates actionable interventions (e.g., boil-water advisories, chlorine tablet distribution, pipeline repairs).
6. Returns risk score and alert metadata directly to frontend in the creation response.

---

## 📡 API Reference & Documentation

### Health Check

#### `GET /api/health`
Verifies backend status and Python microservice connectivity.

**Response:**
```json
{
  "status": "OK",
  "service": "AQUASENSE Backend",
  "database": "MongoDB Connected",
  "analyticsService": "Online",
  "timestamp": "2026-10-08T10:42:24.563Z"
}
```

---

### Authentication APIs

#### `POST /api/auth/register`
**Request:**
```json
{
  "name": "Dr. Priya Sen",
  "email": "priya.sen@aquasense.org",
  "password": "securePassword123",
  "role": "HEALTH_WORKER"
}
```
**Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_179145...",
    "name": "Dr. Priya Sen",
    "email": "priya.sen@aquasense.org",
    "role": "HEALTH_WORKER",
    "createdAt": "2026-10-08T10:42:25.125Z"
  }
}
```

#### `POST /api/auth/login`
**Request:**
```json
{
  "email": "admin@aquasense.org",
  "password": "password123"
}
```
**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_...",
    "name": "Dr. Aisha Sharma",
    "email": "admin@aquasense.org",
    "role": "ADMIN"
  }
}
```

#### `GET /api/auth/me`
*Requires `Authorization: Bearer <token>`*

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "user_...",
    "name": "Dr. Aisha Sharma",
    "email": "admin@aquasense.org",
    "role": "ADMIN"
  }
}
```

---

### Case APIs

#### `POST /api/cases`
Reports a clinical case. Triggers outbreak analytics and automated alert creation.

**Request:**
```json
{
  "age": 32,
  "gender": "FEMALE",
  "symptoms": ["Watery Diarrhea", "Vomiting", "Severe Dehydration"],
  "suspectedDisease": "Cholera",
  "symptomDate": "2026-10-08T08:30:00.000Z",
  "severity": "CRITICAL",
  "district": "Central Metro",
  "locality": "Riverbank Slum Colony",
  "latitude": 12.9613,
  "longitude": 77.5855,
  "waterSource": "Flooded Riverbank Tap",
  "waterQualityConcern": true,
  "flooding": true
}
```

**Response (201):**
```json
{
  "success": true,
  "case": {
    "caseId": "CASE-145454-506",
    "age": 32,
    "gender": "FEMALE",
    "symptoms": ["Watery Diarrhea", "Vomiting", "Severe Dehydration"],
    "suspectedDisease": "Cholera",
    "severity": "CRITICAL",
    "locality": "Riverbank Slum Colony",
    "riskScore": 93,
    "riskLevel": "CRITICAL",
    "status": "REPORTED"
  },
  "risk": {
    "score": 93,
    "level": "CRITICAL",
    "reason": "Rapid increase in similar cases detected; High clinical severity (CRITICAL); High geographic case density; Recent flooding event reported",
    "breakdown": {
      "volume_score": 18,
      "growth_score": 28,
      "clustering_score": 22.8,
      "severity_score": 25,
      "environmental_score": 8
    }
  },
  "alertGenerated": true,
  "alert": {
    "alertId": "ALT-2026-HOT-01",
    "location": "Riverbank Slum Colony",
    "riskLevel": "CRITICAL",
    "caseCount": 16,
    "reason": "Epidemic surge detected: Rapid increase in suspected Cholera cases...",
    "recommendedAction": "URGENT: Deploy rapid epidemic response team to Riverbank Slum Colony...",
    "status": "ACTIVE"
  },
  "disclaimer": "AQUASENSE is an early warning / decision support system for public health surveillance and does not provide medical diagnoses."
}
```

#### `GET /api/cases`
Query all cases with optional filters:
- `?locality=Riverbank Slum Colony`
- `?riskLevel=CRITICAL`
- `?suspectedDisease=Cholera`
- `?status=INVESTIGATING`

#### `GET /api/cases/:id`
Fetch a specific case by MongoDB `_id` or `caseId`.

#### `PUT /api/cases/:id`
Update clinical case details or investigation status (`REPORTED`, `INVESTIGATING`, `CONFIRMED`, `RESOLVED`).

#### `DELETE /api/cases/:id`
Delete a case report.

---

### Dashboard API

#### `GET /api/dashboard/stats`
Supplies real-time operational metrics for dashboard headline cards.

**Response (200):**
```json
{
  "totalCases": 35,
  "casesToday": 4,
  "highRiskAreas": 2,
  "activeAlerts": 2
}
```

---

### Analytics APIs

#### `GET /api/analytics/trends`
Case counts grouped chronologically by date.

**Response:**
```json
{
  "success": true,
  "totalDays": 10,
  "data": [
    { "date": "2026-09-29", "count": 2 },
    { "date": "2026-09-30", "count": 3 },
    { "date": "2026-10-01", "count": 4 },
    { "date": "2026-10-07", "count": 8 },
    { "date": "2026-10-08", "count": 14 }
  ]
}
```

#### `GET /api/analytics/symptoms`
Frequency distribution of observed symptoms.

**Response:**
```json
{
  "success": true,
  "totalOccurrences": 78,
  "data": [
    { "symptom": "Watery Diarrhea", "count": 26, "percentage": 33.3 },
    { "symptom": "Vomiting", "count": 16, "percentage": 20.5 },
    { "symptom": "Abdominal Cramps", "count": 14, "percentage": 17.9 },
    { "symptom": "Severe Dehydration", "count": 8, "percentage": 10.3 },
    { "symptom": "Fever", "count": 8, "percentage": 10.3 }
  ]
}
```

#### `GET /api/analytics/locations`
Aggregated case volume, average risk scores, and environmental indicators per locality.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "locality": "Riverbank Slum Colony",
      "district": "Central Metro",
      "count": 15,
      "averageRiskScore": 86,
      "riskLevel": "CRITICAL",
      "latitude": 12.9612,
      "longitude": 77.5854,
      "waterQualityConcerns": 15,
      "floodingReports": 12
    },
    {
      "locality": "Old Market Basti",
      "district": "Central Metro",
      "count": 9,
      "averageRiskScore": 68,
      "riskLevel": "HIGH",
      "latitude": 12.9782,
      "longitude": 77.5924,
      "waterQualityConcerns": 8,
      "floodingReports": 0
    }
  ]
}
```

#### `GET /api/analytics/risk`
Breakdown across risk classifications.

**Response:**
```json
{
  "low": 12,
  "moderate": 7,
  "high": 6,
  "critical": 10
}
```

#### `GET /api/analytics/hotspots`
Clusters identified by coordinate density analysis.

#### `GET /api/analytics/anomalies`
Evaluates historical velocity and flags statistical z-score and Isolation Forest anomalies.

---

### Map API

#### `GET /api/map/cases`
Provides geospatial telemetry tailored for map pins, clusters, and heatmap layers.

**Response:**
```json
[
  {
    "caseId": "CASE-HOT-001",
    "latitude": 12.9612,
    "longitude": 77.5854,
    "locality": "Riverbank Slum Colony",
    "caseCount": 1,
    "riskLevel": "CRITICAL",
    "symptoms": ["Watery Diarrhea", "Severe Dehydration", "Vomiting"],
    "date": "2026-10-08T06:00:00.000Z"
  }
]
```

---

### Alert APIs

#### `GET /api/alerts`
Returns public health outbreak alerts. Supports `?status=ACTIVE`.

#### `POST /api/alerts`
Manually trigger an alert.

#### `PUT /api/alerts/:id/status`
Update status lifecycle: `ACTIVE` $\rightarrow$ `ACKNOWLEDGED` $\rightarrow$ `RESOLVED`.

**Request:**
```json
{
  "status": "ACKNOWLEDGED"
}
```

#### `DELETE /api/alerts/:id`
Delete an alert.

---

### Python Analytics Service APIs (Port 8000)

#### `POST /predict-risk`
**Request:**
```json
{
  "case_count": 20,
  "previous_case_count": 8,
  "growth_rate": 150,
  "similar_cases": 12,
  "severity": "HIGH",
  "location_density": 0.8
}
```
**Response:**
```json
{
  "risk_score": 90,
  "risk_level": "CRITICAL",
  "reason": "Rapid increase in similar cases detected; High clinical severity (HIGH); High geographic case density"
}
```

#### `POST /detect-anomalies`
Compares daily counts against rolling baseline with z-scores and Isolation Forest.

#### `POST /detect-hotspots`
Clusters cases geographically by latitude/longitude.

---

## 💻 Frontend Integration Guide

The React / Next.js / Vue frontend connects to this backend over standard REST APIs.

### Base URLs
```js
const API_BASE = "http://localhost:5000/api";
```

### CORS Configuration
CORS is already configured on the Node.js backend to allow requests from any origin (e.g. `http://localhost:3000`, `http://localhost:5173`, etc.) with full header support.

### Authenticated Request Example (Axios / Fetch)
```javascript
// Example: Submitting a new case report from the frontend form
const submitCaseReport = async (caseFormData, token) => {
  const response = await fetch('http://localhost:5000/api/cases', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(caseFormData)
  });
  
  const result = await response.json();
  if (result.alertGenerated) {
    console.warn("⚠️ Immediate Outbreak Alert Generated:", result.risk.level);
  }
  return result;
};
```

---

## 🏆 Hackathon Demo Script (Instructions for Judges)

Follow this 3-minute sequence to demonstrate the power of AQUASENSE during your hackathon presentation:

1. **Start the System**:
   ```bash
   npm run seed
   npm run dev:all
   ```
2. **Show Health & Dual-Microservice Architecture**:
   - Open browser to `http://localhost:5000/api/health`
   - Show `Node.js Gateway: OK`, `Python FastAPI Analytics: Online`.
3. **Show Dashboard Overview**:
   - `GET http://localhost:5000/api/dashboard/stats`
   - Show total cases, cases today, high-risk areas, and active alerts.
4. **Show Interactive Map Telemetry**:
   - `GET http://localhost:5000/api/map/cases`
   - Point out coordinate clusters in `Riverbank Slum Colony` (Hotspot) vs `Greenfield Heights` (Normal baseline).
5. **Demonstrate Outbreak Anomaly Detection**:
   - `GET http://localhost:5000/api/analytics/anomalies`
   - Explain how Isolation Forest and z-score baseline detect abnormal case acceleration (+260% spike).
6. **Live Outbreak Trigger Simulation**:
   - Send a `POST /api/cases` with `locality: "Riverbank Slum Colony"` and `severity: "CRITICAL"`.
   - Point out that within milliseconds, the Python AI engine calculates a **93/100 CRITICAL risk score** and **automatically dispatches a public health alert** (`alertGenerated: true`).
7. **Highlight Explainability & Safety**:
   - Emphasize the clear, explainable factors breakdown (`volume`, `growth`, `clustering`, `severity`, `environmental`) and the explicit medical non-diagnostic disclaimer.

---

## 📱 RUN AQUASENSE ON A REAL ANDROID PHONE

### 1. Prerequisites
- **Computer:** Node.js (v18+) with npm installed.
- **Physical Android Phone:** Running Android 8.0+ connected to the **SAME Wi-Fi network** as your laptop (or connected to your phone's Wi-Fi hotspot).
- **Tools (Optional for testing):**
  - **Expo Go App:** Install free from Google Play Store for instant over-the-air testing.
  - **EAS CLI:** `npm install -g eas-cli` (only if compiling a standalone APK file).

---

### 2. Backend & Database Setup
1. Open PowerShell / Terminal in the project root:
   ```powershell
   cd backend
   npm install
   ```
2. Start the backend services (Node.js API Gateway + Python FastAPI):
   ```powershell
   npm run dev:all
   ```
3. **Database:**
   - If MongoDB is installed locally or configured in `backend/.env` (`MONGO_URI`), AQUASENSE connects automatically.
   - If MongoDB is not installed, the system automatically activates the **Zero-Setup Persistent Datastore (`aquasense_store.json`)** so case submission and analytics work immediately without installing anything.
4. Verify backend is active on your network:
   - Check the console output: `🚀 AQUASENSE Backend Server Running on port 5000 (0.0.0.0)`
   - Note the network IP shown in the console (e.g., `http://172.16.43.161:5000`).

---

### 3. Finding Your Laptop IPv4 Address
On Windows (PowerShell or Command Prompt):
```powershell
ipconfig
```
Look for **IPv4 Address** under your active **Wireless LAN adapter Wi-Fi** (e.g., `192.168.1.100` or `172.16.43.161`).

> **CRITICAL RULE:** Do NOT use `http://localhost:5000` inside your phone app! On a physical Android phone, `localhost` means the phone itself. You MUST use your laptop's Wi-Fi IPv4 address.

---

### 4. Configuring `EXPO_PUBLIC_API_URL`
Create or edit `aquasense-mobile/.env`:
```env
EXPO_PUBLIC_API_URL=http://YOUR_LAPTOP_IP:5000/api
```
*Example:*
```env
EXPO_PUBLIC_API_URL=http://172.16.43.161:5000/api
```
*(For production or cloud deployments, replace with: `EXPO_PUBLIC_API_URL=https://your-domain.com/api`)*

> **⚡ In-App Dynamic Configurator:** If your laptop IP changes, you don't even need to rebuild the app! Open the AQUASENSE mobile app, tap the **"Configure Server IP"** gear icon on the Login screen, enter your laptop's current IP (e.g. `http://172.16.43.161:5000/api`), and tap **Save & Connect**.

---

### 5. Running the Mobile App in Development (Expo Go)
1. In a new terminal window:
   ```powershell
   cd aquasense-mobile
   npm install
   npx expo start
   ```
2. A QR code will appear in your terminal.
3. Open the **Expo Go** app on your physical Android phone.
4. Scan the QR code with your phone camera or Expo Go. The AQUASENSE app will compile and launch on your phone!

---

### 6. Building the Standalone Android APK (`eas.json`)
The project includes a pre-configured `eas.json` for building an installable `.apk` file:

1. Install EAS CLI:
   ```powershell
   npm install -g eas-cli
   ```
2. Log into Expo (create a free account at expo.dev):
   ```powershell
   npx eas-cli login
   ```
3. Trigger the standalone APK build:
   ```powershell
   cd aquasense-mobile
   npx eas-cli build -p android --profile preview
   ```
4. Expo builds the APK in the cloud and provides a direct download link / QR code.
5. Download the `.apk` on your phone, allow "Install from unknown sources" in Android settings, and install AQUASENSE!

---

### 7. End-to-End Live Hackathon Demonstration Flow
Demonstrate the complete live loop between your phone and your laptop:

1. **Laptop:** Open the Authority Dashboard in your browser:
   ```text
   http://localhost:3000   (or http://YOUR_LAPTOP_IP:3000)
   ```
   Note the initial **Total Cases** count and map view.
2. **Phone:** Open the AQUASENSE mobile app.
3. **Login:** Tap **`1-TAP DEMO LOGIN`** (uses real JWT authentication with backend).
4. **Report Case:**
   - Tap **`+ REPORT NEW CASE`**.
   - Fill in patient age and gender.
   - Select symptoms: `Watery Diarrhea`, `Severe Dehydration`, `Vomiting`.
   - Select severity: `Severe / Critical`.
   - Tap **`USE MY CURRENT LOCATION`** (grants GPS access, locks actual coordinates).
   - Select water source (e.g., `Flooded Riverbank Tap`) and environmental observations.
5. **Submit Case:**
   - Tap **`SUBMIT CASE FOR RISK EVALUATION`**.
   - Mobile sends live `POST /api/cases` with JWT header.
   - Backend persists the case in database.
   - AI risk engine calculates real risk score.
   - Backend auto-creates a critical outbreak alert.
6. **Phone Result:**
   - Phone displays real **Risk Score (e.g., 93 - CRITICAL)**.
   - Shows explainable factor attribution breakdown and official non-diagnostic disclaimer.
7. **Verify Phone Case History:**
   - Open **`My Cases`** on the phone to see the newly submitted case listed with live case ID.
8. **Verify Laptop Dashboard Sync:**
   - Switch back to the laptop Authority Dashboard (`http://localhost:3000`).
   - Refresh or view dashboard:
     - Total Cases count increases by 1.
     - The newly submitted case appears at the top of recent cases.
     - The case GPS location appears as a map pin.
     - Active Outbreak Alerts count updates with the newly triggered alert!

---

### 8. Troubleshooting Network & Connection Issues

| Issue | Cause | Solution |
|---|---|---|
| **"Unable to connect to AQUASENSE server"** | Phone cannot reach laptop IP | 1. Ensure phone & laptop are on the **SAME Wi-Fi**.<br>2. Check laptop IP via `ipconfig` (IPv4).<br>3. Tap "Configure Server IP" on mobile login screen and type `http://<IP>:5000/api`. |
| **"Network Error / ECONNREFUSED"** | Using `localhost` on physical phone | Never use `localhost` on Android phone. Use laptop's Wi-Fi IPv4 address (e.g., `172.16.43.161:5000`). |
| **Connection Times Out** | Windows Firewall blocking port 5000 | Run PowerShell as Admin:<br>`New-NetFirewallRule -DisplayName "AQUASENSE Port 5000" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow` |
| **Backend Not Running** | Backend process terminated | Run `cd backend; npm run dev:all` and verify `Server Running on port 5000 (0.0.0.0)` appears. |
| **"Session Expired / Unauthorized"** | JWT token expired or cleared | Log out and log back in, or tap "1-Tap Demo Login" to obtain a fresh token. |
| **Offline Mode Triggered** | No Wi-Fi or airplane mode active | Cases entered offline are safely stored as `PENDING SYNC` without faking submission. Once reconnected, open "My Cases" and tap **"Sync All"**. |
| **MongoDB Connection Refused** | Local mongod service not running | The backend automatically activates the built-in persistent datastore `aquasense_store.json`. No manual action needed. |


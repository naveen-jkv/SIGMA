# AQUASENSE — Frontend Portal 🌊
### AI-Powered Water-Borne Disease Outbreak Early Warning System

> **Medical Disclaimer**: AQUASENSE is a clinical decision-support and epidemiological surveillance system. It does **not** medically diagnose diseases.

---

## 🚀 Overview

The **AQUASENSE Frontend** is a modern, responsive single-page web application built with **React**, **Vite**, **Tailwind CSS**, **Recharts**, and **Leaflet**.

It is completely decoupled from the backend and communicates exclusively through REST API endpoints.

---

## 📦 Tech Stack

- **React 18** + **Vite 6**
- **Tailwind CSS** (Custom Healthcare & Epidemiological Theme)
- **React Router v6** (Role-based access guard & dynamic routing)
- **Recharts** (Epidemiological curve, risk-level donut, symptom & locality bar charts)
- **Leaflet & React Leaflet** (Geospatial outbreak map with risk-colored pins & popups)
- **Axios** (Centralized API client with JWT interceptor & transparent mock fallback)
- **Lucide React** (Clean, professional medical/surveillance icons)

---

## 🏗️ Folder Structure

```
frontend/
├── src/
│   ├── components/       # Reusable components
│   ├── layouts/
│   │   └── DashboardLayout.jsx  # Responsive sidebar, navigation, status indicator
│   ├── pages/
│   │   ├── LoginPage.jsx              # Auth with instant hackathon demo buttons
│   │   ├── AuthorityDashboardPage.jsx # Main showcase dashboard with 4 KPIs, charts & map
│   │   ├── WorkerDashboardPage.jsx    # Field worker portal & quick reporting
│   │   ├── ReportCasePage.jsx         # Clinical case submission form
│   │   ├── CasesPage.jsx              # Searchable case table & dossier view
│   │   ├── OutbreakMapPage.jsx        # Full GIS map with risk-colored markers
│   │   ├── AlertsPage.jsx             # Active alerts feed & status review actions
│   │   ├── AnalyticsPage.jsx          # Deep analytics & Outbreak Risk Score hero
│   │   └── SettingsPage.jsx           # Role switcher, demo mode toggle & health check
│   ├── services/
│   │   ├── api.js        # Centralized Axios API service with mock fallback
│   │   └── mockData.js   # 25+ realistic clinical cases, 5 alerts & analytics
│   ├── hooks/
│   │   ├── useAuth.jsx   # Session management, roles & demo login
│   │   └── useToast.jsx  # Floating toast notifications
│   ├── App.jsx           # Routing configuration & route guards
│   ├── main.jsx          # Entrypoint
│   └── index.css         # Tailwind & custom Leaflet styles
├── .env                  # Local environment configuration
├── .env.example          # Environment template
├── index.html            # HTML template with Google Fonts & Leaflet CSS
├── package.json          # Dependencies & scripts
├── tailwind.config.js    # Custom brand & risk color tokens
└── vite.config.js        # Vite configuration
```

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create or verify `.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ENABLE_MOCK_FALLBACK=true
```

### 3. Run Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🔑 Demo Login (Hackathon Mode)

On the Login page, click either of the instant access buttons:
- **Authority Demo**: Signs in as Health Authority (`officer@aquasense.org`) with full access to the Executive Showcase Dashboard, Outbreak Map, and Alerts.
- **Worker Demo**: Signs in as Community Health Worker (`worker@aquasense.org`) focused on rapid field case reporting.

---

## 📡 REST API Endpoints Used

| Endpoint | Method | Purpose |
|---|---|---|
| `/auth/login` | POST | Authenticates user & returns JWT |
| `/auth/me` | GET | Returns current user profile |
| `/cases` | GET | Lists cases with query filters |
| `/cases` | POST | Submits new clinical report & triggers automated alert |
| `/cases/:id` | GET | Returns single case dossier |
| `/cases/:id` | PUT | Updates investigation status |
| `/dashboard/stats` | GET | Returns top 4 KPI numbers |
| `/analytics/trends` | GET | Chronological case velocity |
| `/analytics/symptoms` | GET | Symptom frequency breakdown |
| `/analytics/locations`| GET | Case counts per locality |
| `/analytics/risk` | GET | Risk tier distribution |
| `/analytics/anomalies`| GET | Isolation Forest anomaly report |
| `/map/cases` | GET | Geospatial coordinate points |
| `/alerts` | GET | Outbreak alert notifications |
| `/alerts` | POST | Manual alert dispatch |
| `/alerts/:id/status`| PUT | Transitions alert lifecycle |
| `/health` | GET | Health verification |

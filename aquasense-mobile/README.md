# AQUASENSE Mobile App 🌊📱
### AI-Powered Water-Borne Disease Outbreak Early Warning System (Health Worker Client)

A live, production-grade mobile surveillance client built with **React Native** and **Expo** for community health workers and epidemiological field teams.

---

## ⚡ Quick Start (Under 60 Seconds)

### 1. Start the AQUASENSE Backend
In the project root, start both the Node.js API Gateway (port 5000) and Python FastAPI AI Engine (port 8000):
```powershell
cd backend
npm run dev:all
```
*(Backend will run on `http://0.0.0.0:5000` and Python Analytics on `http://0.0.0.0:8000`)*

### 2. Start the Mobile Application
Open a new terminal window:
```powershell
cd aquasense-mobile
npx expo start
```
* **To run on your Android Phone:** Install **Expo Go** from the Google Play Store, open your phone camera, and scan the QR code printed in the terminal.
* **To run in Android Emulator:** Press `a` in the terminal.
* **To test in Web Browser:** Press `w` in the terminal.

---

## 🌐 Connecting a Physical Phone to Your Computer

When running on a physical Android phone, **`localhost` refers to the phone itself**, so the app must connect to your computer's **LAN IPv4 address**.

### 1. Find Your Computer's LAN IP Address
* **Windows (PowerShell/CMD):**
  ```powershell
  ipconfig
  ```
  Look for `IPv4 Address` under your active Wi-Fi adapter (e.g., `192.168.1.100` or `172.16.43.161`).
* **Mac / Linux:**
  ```bash
  ifconfig | grep "inet "
  ```

### 2. Set `EXPO_PUBLIC_API_URL` in `.env`
In `aquasense-mobile/.env`:
```env
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:5000/api
```
*(Example: `EXPO_PUBLIC_API_URL=http://172.16.43.161:5000/api`)*

> **💡 In-App IP Configurator:** You can also change the Server IP directly on your phone's screen on the Login and Profile screens without rebuilding!

### 3. Critical Network Checklist for Live Demos
1. **Same Wi-Fi Network:** Ensure your Android phone and your development computer are connected to the same Wi-Fi router or phone mobile hotspot.
2. **Server Interface:** The Node.js Express backend binds to `0.0.0.0` (all interfaces), making it accessible across the LAN.
3. **Windows Firewall:** If your phone cannot connect, allow port `5000` through Windows Defender Firewall, or run PowerShell as Administrator:
   ```powershell
   New-NetFirewallRule -DisplayName "AQUASENSE Backend Port 5000" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
   ```

---

## 🔑 Login Credentials

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Health Worker (Default)** | `worker@aquasense.org` | `password123` | Field surveillance & case reporting |
| **Demo Account** | `healthworker@demo.com` | `demo123` | Auto-registers on backend if missing |
| **1-Tap Demo Button** | *(No typing required)* | *(No typing required)* | Instant 1-tap evaluation for judges |

---

## 🏆 2-Minute Hackathon Live Demonstration Flow

Follow this exact sequence during your pitch to judges:

1. **Launch App:**
   * Open AQUASENSE on your Android phone. Show the branding: *"Detect Early. Alert Faster. Protect Communities."*
2. **1-Tap Login:**
   * Tap **`1-TAP DEMO LOGIN`**. The app communicates with the live backend, authenticates, and opens the Health Worker Dashboard.
3. **Surveillance Dashboard:**
   * Point out the real-time KPIs: **Total Cases**, **Cases Today**, **High-Risk Areas**, and **Active Alerts**.
4. **Report a Critical Case:**
   * Tap **`+ REPORT NEW CASE`**.
   * **Step 1:** Enter age `29`, gender `Female`.
   * **Step 2:** Select symptoms: `Watery Diarrhea`, `Vomiting`, `Severe Dehydration`.
   * **Step 3:** Select severity `Severe / Critical`.
   * **Step 4:** Tap **`USE MY CURRENT LOCATION`**. The app requests GPS permissions and locks the exact coordinates (`Location captured ✓`).
   * **Step 5:** Select water source `Flooded Riverbank Tap`, water contamination concern `YES`, recent flooding `YES`, similar cases nearby `12`.
5. **Real-time Backend AI Risk Assessment:**
   * Tap **`SUBMIT CASE FOR RISK EVALUATION`**.
   * Emphasize to judges: The app does **NOT** fake the score. It sends a live `POST /api/cases` request to the backend.
6. **Show Live Risk Result:**
   * Highlight the evaluated **Risk Score (e.g., 93 / 100 - CRITICAL)**.
   * Point out the **Explainable Factor Attribution**:
     * Case Growth Velocity (+28 pts)
     * Symptom Similarity (+18 pts)
     * Geographic Cluster Density (+22.8 pts)
     * Clinical Severity (+25 pts)
     * Environmental Hazard (+8 pts)
   * Highlight the Early-Warning Signal: *"Potential outbreak pattern detected."*
   * Show the automated warning: **🚨 OUTBREAK ALERT GENERATED** (*Health authorities have been notified*).
7. **Verify Database Insertion:**
   * Tap **`View In Case History`**. The newly submitted case appears at the top of the feed with its live case ID.

---

## 📦 Creating an Installable Android APK

You can build an Android APK without needing Android Studio installed on your computer by using **Expo Application Services (EAS)**:

### 1. Install EAS CLI
```powershell
npm install -g eas-cli
```

### 2. Log In to Expo
```powershell
npx eas-cli login
```
*(Create a free account at https://expo.dev if you don't have one).*

### 3. Configure EAS Build
```powershell
npx eas-cli build:configure
```

### 4. Build the Standalone Android APK
Run the cloud build command to produce a direct `.apk` file:
```powershell
npx eas-cli build -p android --profile preview
```
* Once completed, Expo will generate a download link and QR code for the `.apk`.
* Download the APK directly onto your Android phone and tap to install!

---

## 📂 Project Architecture

```
aquasense-mobile/
├── app/
│   ├── _layout.jsx         # Root Stack Navigator & Global Auth Provider
│   ├── index.jsx           # Splash screen with auto-token verification
│   ├── login.jsx           # Login screen & live Server IP configurator
│   ├── dashboard.jsx       # Health worker KPIs, stats grid & recent cases
│   ├── report-case.jsx     # 5-step clinical intake wizard with GPS tagging
│   ├── risk-result.jsx     # Algorithmic risk score & factor breakdown
│   ├── cases.jsx           # Filterable & searchable case history
│   ├── alerts.jsx          # Public health outbreak warnings feed
│   └── profile.jsx         # Officer credentials & network diagnostics
│
├── src/
│   ├── components/
│   │   ├── Header.jsx          # Branded healthcare navigation header
│   │   ├── RiskBadge.jsx       # Color-coded risk pills (Low/Mod/High/Critical)
│   │   ├── CaseCard.jsx        # Clinical case summary card
│   │   ├── AlertCard.jsx       # Outbreak alert card with intervention steps
│   │   └── NetworkBanner.jsx   # Offline detector with retry trigger
│   ├── constants/
│   │   └── theme.js            # Design tokens, medical palette & shadows
│   ├── context/
│   │   └── AuthContext.js      # Global user authentication session
│   └── services/
│       └── api.js              # Centralized Axios client & offline fallback
│
├── assets/                 # App icons, splash artwork & logo assets
├── .env                    # Machine-specific LAN IP endpoint
├── .env.example            # Environment configuration template
├── app.json                # Expo config with Android permissions
└── package.json            # Dependencies & start scripts
```

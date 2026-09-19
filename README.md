# 🏫 Green Park School Management & Parent Portal

An offline-first, dual-environment school management system designed for both **campus LAN operations** and **online cloud hosting**. Staff can mark attendance, enter marks, and manage student fees inside the school without internet access, while parents can submit admission enquiries and view records online. All records synchronize bidirectionally when connected.

---

## 🌟 Key Architecture & Features

### 1. 🔄 Two-Way Database Sync Engine
* **Odd/Even Collision-Free Partitioning**:
  * **Local School Server**: Generates **ODD** IDs (`1001, 1003, 1005...`).
  * **Cloud Neon Database**: Generates **EVEN** IDs (`1002, 1004, 1006...`).
  * Eliminates primary key collisions when syncing offline and online submissions.
* **Automated Background Sync**: Runs every **60 seconds** via APScheduler.
* **Sync Status Badge**: Real-time indicator in the Admin and Staff dashboard header:
  * 🟢 **Synced**: All local changes match Cloud Neon.
  * 🟡 **Pending (X)**: Local offline records queued safely for sync.
  * 🔴 **Offline**: School network disconnected from internet; local operations continue without interruption.
  * Includes manual **"Sync Now"** trigger button.

### 2. 🖼️ Offline Media & Image Storage
* Profile photos, receipts, and event photos are saved directly to `uploads/` on the local machine.
* Cached images load instantly at internal LAN speeds without internet or external CDN round-trips.
* When online, local media automatically replicates to Cloudflare R2 / cloud storage.

### 3. 👥 Multi-Role Authentication with Shared Phone Numbers
* Supports teachers/staff who are also parents of students attending the school.
* Single mobile number can hold separate **Staff** and **Parent** roles simultaneously:
  * Logging into the **Staff** tab opens the Teacher Dashboard.
  * Logging into the **Parent** tab opens the Parent Dashboard.
  * Selecting the wrong role tab provides an immediate actionable hint.

---

## 🚀 Quick Start: Native Windows LAN Deployment (Recommended)

Run the portal natively on the school PC without Docker overhead (uses ~3GB less RAM and requires no WSL/virtualization).

### Prerequisites
* **Python 3.11+** installed (`python --version`)
* **Node.js 18+** installed (`node --version`)
* **PostgreSQL 15+** installed as a Windows Service (`localhost:5432`)

### 1. Initial Setup
```bash
# Clone the repository
git clone https://github.com/Kavitha04-04Sonachalam/GreenPark-School.git
cd GreenPark-School

# Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..

# Install frontend dependencies & build
cd frontend
npm install
npm run build
cd ..

# Copy environment configuration
cp .env.example .env
```

### 2. One-Click Daily Launchers
In the root directory, double-click:
* 🟢 **`start_lan_server.bat`**: Checks native PostgreSQL, detects host Wi-Fi/LAN IP, and launches both Backend and Frontend.
* 🛑 **`stop_lan_server.bat`**: Gracefully terminates backend and frontend processes.

### 3. Zero-Touch Windows Auto-Start (On PC Boot)
To make the entire system start automatically and silently in the background when the school PC powers on:
1. Right-click **`install_autostart.bat`** &rarr; **Run as administrator**.
2. This will:
   * Add a silent runner shortcut to the Windows Startup folder (`%APPDATA%\...\Startup`).
   * Add Windows Defender Firewall rules for ports `5173` and `8000` so teachers can connect from phones and laptops on school Wi-Fi.
   * Create an **"Open GreenPark Portal"** shortcut directly on the Desktop.
3. To remove auto-start at any time, run **`uninstall_autostart.bat`**.

---

## 🐳 Docker Deployment Option (Alternative)

If you prefer running via Docker containers:
```bash
# Start all containers in the background
docker compose up -d

# Check container status
docker compose ps

# Stop containers
docker compose down
```
* **Portal Web URL**: `http://localhost:5175`
* **Local Postgres Port**: `localhost:5434`
* **API Documentation**: `http://localhost:8000/docs`

---

## 🌐 LAN & Wi-Fi Access URLs

Once started, anyone connected to the same school Wi-Fi or Ethernet network can open:

| Service | Local Host Access | Other Computers / Phones on Wi-Fi |
| :--- | :--- | :--- |
| **Web Portal** | `http://localhost:5173` | `http://<SERVER_LAN_IP>:5173` |
| **API Docs (Swagger)** | `http://localhost:8000/docs` | `http://<SERVER_LAN_IP>:8000/docs` |

*(Replace `<SERVER_LAN_IP>` with the IP printed when running `start_lan_server.bat`, e.g., `192.168.1.50`)*

---

## 🔑 Default Test Credentials

| Role | Tab to Select | Phone Number | Password | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| 🛡️ **Admin** | **Admin** | `1234567890` | `admin123` | Complete school management, fee structures, sync |
| 👨‍🏫 **Staff** | **Staff** | `9876543210` | `password123` | Mark daily student attendance & enter exam marks |
| 👨‍🏫 **Staff (2)** | **Staff** | `2345678998` | `password123` | Secondary teacher account |
| 👨‍👩‍👧 **Parent** | **Parent** | `8838787065` | `password123` | View child attendance, fees, report cards |
| 🎓 **Student** | **Student** | `8838787065` | `password123` | Student view (shares mobile with parent) |

---

## ⚙️ Environment Configuration (`.env`)

All configurations are centralized in the root `.env` file (copied from `.env.example`):

```env
# Environment Mode ('local' for school LAN PC, 'cloud' for Render/Vercel)
APP_ENV=local
VITE_APP_ENV=local

# Local School Database (Native PostgreSQL port 5432)
LOCAL_DATABASE_PORT=5432
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/greenpark_db

# Online Neon Cloud Database (For Two-Way Sync)
NEON_DATABASE_URL=postgresql://neondb_owner:...@ep-twilight-haze...neon.tech/neondb?sslmode=require

# Media & Uploads Storage Directory
UPLOADS_DIR=uploads

# Sessions & Security
SECRET_KEY=your_secret_key
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Cloudflare R2 Media Storage (Optional; local disk cache used if dummy credentials)
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_ENDPOINT_URL=https://your-account-id.r2.cloudflarestorage.com
R2_BUCKET_NAME=greenpark-school-images

# Frontend API URL (leave empty for automatic dynamic LAN host detection)
VITE_API_URL=
```

### 🌍 Cloud vs. Local Mode (`APP_ENV` / `VITE_APP_ENV`)
* **`local` (Campus School Server - Default)**:
  * Full offline-first capabilities: local PostgreSQL database, local media disk storage (`uploads/`), and background 60s bidirectional sync engine to Neon.
  * Sync badge displays offline/online connection state and pending queue count with manual sync trigger.
* **`cloud` (Render / Vercel Production)**:
  * Direct writes to the Neon central cloud database without background scheduler polling.
  * Sync badge displays 🟢 **Cloud Online / Live Central Database**, auto-detecting hostnames (`vercel.app`, `onrender.com`).


---

## 📁 Project Directory Layout

```text
GreenPark-School/
├── backend/
│   ├── app/
│   │   ├── api/v1/         # REST API endpoints (sync, auth, marks, attendance, fees...)
│   │   ├── core/           # Security, configuration, and database engines
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── services/       # Business logic and sync_service.py (push/pull engine)
│   │   └── utils/          # Offline media management (s3.py)
│   ├── scripts/            # Database migration, constraints, and partitioning utilities
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/     # UI components (Header, SyncStatusBadge, ErrorBoundary...)
│   │   ├── config.js       # Dynamic LAN API resolver
│   │   ├── pages/          # Admin, Staff, Parent, Student pages
│   │   └── App.jsx         # Client routing
│   ├── nginx.conf          # Nginx static caching configuration (for Docker)
│   └── vite.config.js      # Vite build & proxy settings
├── uploads/                # Local offline image storage (profile photos, receipts, events)
├── start_lan_server.bat    # Native Windows LAN launcher
├── stop_lan_server.bat     # Native process shutdown script
├── install_autostart.bat   # Windows Startup & Firewall auto-configurator
└── uninstall_autostart.bat # Uninstaller for Windows Startup shortcut
```


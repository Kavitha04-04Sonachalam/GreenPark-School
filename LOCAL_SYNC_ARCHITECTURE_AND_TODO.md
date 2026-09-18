# Green Park School — Local Database, Offline Operation & Two-Way Sync

**Document Version:** 1.0  
**Branch:** `loki`  
**Target Environment:** School LAN + Online Cloud (Neon, Render, Vercel, Cloudflare R2)

---

## 1. Executive Summary & Architecture

The objective is to establish an **offline-first local school server** allowing teachers and administrators to work seamlessly without internet connectivity, while maintaining an **online cloud portal** for parents, public visitors, and online admissions.

```
                  ┌─────────────────────────────────────────────────┐
                  │                 ONLINE CLOUD                    │
                  │   Vercel (Frontend) + Render (API) + Neon DB    │
                  └───────────────────────┬─────────────────────────┘
                                          │
                        ▲ PUSH            │ ▼ PULL
                        │ (Attendance,    │ (Admissions,
                        │  Marks, Fees)   │  Online Pay)
                                          │
                  ┌───────────────────────▼─────────────────────────┐
                  │              SCHOOL LOCAL SERVER                │
                  │  FastAPI (0.0.0.0:8000) + Native PostgreSQL     │
                  │          Vite / Dist (0.0.0.0:5173)             │
                  └───────────────────────┬─────────────────────────┘
                                          │
                         School Wi-Fi / LAN Subnet
                                          │
                  ┌───────────────────────▼─────────────────────────┐
                  │          CLIENT DEVICES (OFFLINE / LAN)         │
                  │   Teacher Laptops, Mobile Phones, Tablets       │
                  └─────────────────────────────────────────────────┘
```

---

## 2. Research Findings & Strategic Decisions

### A. Database Hosting: Native PostgreSQL vs. Docker
- **Research Outcome:** For the school computer, **Native Windows PostgreSQL is significantly better** than Docker Desktop.
- **Rationale:**
  - Native PostgreSQL consumes only **~30MB to 50MB of RAM** compared to **2GB to 4GB** consumed by Docker Desktop + WSL2.
  - Native PostgreSQL runs as a silent Windows Service starting automatically at system boot before user login.
  - Zero popups, license prompts, or WSL2 virtual machine crashes.

### B. Two-Way (Bidirectional) Synchronization
- **PUSH (School Local $\to$ Neon):**
  - Daily student attendance.
  - Exam / term marks.
  - In-person fee collections (cash, cheque, offline receipts).
  - Staff & student record modifications.
- **PULL (Neon $\to$ School Local):**
  - New admission enquiries submitted by parents from home.
  - Online fee payments made via online payment gateways.
  - Password reset requests initiated online.
- **Loop Prevention:** Uses a `last_synced_at` watermark timestamp to prevent re-inserting records in an infinite ping-pong loop.

### C. Primary Key & Conflict Prevention
- **Challenge:** If offline local school DB and online mobile users both generate auto-increment IDs (`101, 102`), primary key collisions occur.
- **Decisions:**
  1. **Primary Pattern:** Business unique keys + SQL `UPSERT` (`ON CONFLICT DO UPDATE`).
  2. **Timestamp Tracking:** Every synced table tracks `created_at`, `updated_at`, and `sync_status` (`pending`, `synced`, `failed`).
  3. **Last-Write-Wins:** In case of concurrent modifications, the record with the newer `updated_at` takes precedence.

### D. Media & Image Strategy (Cloudflare R2 Offline Resilience)
- **Challenge:** Cloudflare R2 presigned URLs fail when school internet is offline.
- **Solution:** 
  - On the local server, file uploads save to a local `backend/uploads/` directory first and immediately return a local LAN URL.
  - The sync daemon uploads pending images to Cloudflare R2 when internet connectivity is detected.

### E. Billing Immortality & Financial Lock
- **Requirement:** Once a receipt is printed/finalized, it must be locked against edits.
- **Enforcement:** Enforced at the FastAPI database layer (rejecting `PUT`/`DELETE` on locked receipts with HTTP 403).
- **Corrections:** Adjustments are recorded as separate signed accounting entries (`fee_adjustments`) preserving full financial audit history.

### F. Network & LAN Discovery
- **Dynamic IP Binding:** Frontend API base URL dynamically resolves to `window.location.hostname:8000` rather than hardcoding IP addresses.
- **Windows Firewall:** Inbound TCP rules for ports `8000` and `5173` allow any device on the school Wi-Fi subnet to access the portal.

---

## 3. Master TODO List

### Phase 1: Local Laptop Preparation (Branch: `loki`)
- [x] **1.1** Initialize `loki` git branch.
- [x] **1.2** Verify local PostgreSQL database and all 26 schema tables.
- [x] **1.3** Seed initial Admin (`1234567890`/`admin123`) and Parent (`9876543210`/`password123`).
- [ ] **1.4** Update `frontend/src/config/api.js` to dynamically use `window.location.hostname`.
- [ ] **1.5** Add `sync_status`, `sync_attempts`, and `last_sync_error` columns to syncable models.
- [ ] **1.6** Implement the `fee_adjustments` model and backend bill-locking validation.
- [ ] **1.7** Implement the offline image upload fallback (local disk storage $\to$ R2 queue).
- [ ] **1.8** Build the two-way sync engine module (`backend/app/services/sync_service.py`):
  - Internet heartbeat detector (`8.8.8.8` / Render ping).
  - PUSH routine (local `pending` records $\to$ Neon).
  - PULL routine (Neon records where `updated_at > watermark` $\to$ local).
- [ ] **1.9** Add `APScheduler` background job (triggers sync every 5 minutes).
- [ ] **1.10** Add a manual "Sync Now" endpoint (`POST /api/v1/sync/run`) and Admin UI badge.
- [ ] **1.11** Create the 1-click Windows startup script (`start_school_server.bat` / `.vbs`).
- [ ] **1.12** Commit and push all changes to GitHub on branch `loki`.

---

### Phase 2: USB Deployment Kit Preparation
- [ ] **2.1** Download **PostgreSQL 16 Windows x64 Installer** (.exe).
- [ ] **2.2** Download **Python 3.12+ Windows Installer** (.exe).
- [ ] **2.3** Download **Node.js 20 LTS Windows Installer** (.exe).
- [ ] **2.4** Download **Git for Windows Installer** (.exe).
- [ ] **2.5** Save installer files to a dedicated USB drive for offline installation.

---

### Phase 3: On-Site School Deployment (or via AnyDesk)
- [ ] **3.1** Run installers from the USB drive on the school PC:
  - Install PostgreSQL (record password for user `postgres`).
  - Install Python (check *"Add python.exe to PATH"*).
  - Install Node.js LTS and Git.
- [ ] **3.2** Clone the repository:
  ```powershell
  git clone -b loki <REPO_URL>
  ```
- [ ] **3.3** Set up `backend/.env` with local PostgreSQL connection string:
  ```env
  DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/greenpark_school
  ```
- [ ] **3.4** Install dependencies:
  ```powershell
  cd backend && pip install -r requirements.txt
  cd ../frontend && npm install
  ```
- [ ] **3.5** Execute the initial data migration script (copies existing records from Neon to local DB).
- [ ] **3.6** Configure Windows Defender Firewall inbound rules:
  ```powershell
  New-NetFirewallRule -DisplayName "GreenPark LAN" -Direction Inbound -LocalPort 8000,5173 -Protocol TCP -Action Allow
  ```
- [ ] **3.7** Place the auto-startup script into `shell:startup`.
- [ ] **3.8** Reserve a static local IP (e.g. `192.168.1.150`) on the school Wi-Fi router.

---

### Phase 4: Testing & Drill Verification
- [ ] **4.1 Connected LAN Test:** Connect a mobile phone to school Wi-Fi, open `http://<SERVER_IP>:5173`, test login.
- [ ] **4.2 Offline Drill:** Disconnect the internet router / WAN cable:
  - Take student attendance locally.
  - Enter marks locally.
  - Print a fee receipt and verify it is locked against edits.
- [ ] **4.3 Sync Drill:** Reconnect the internet:
  - Verify `sync_status` transitions from `pending` to `synced`.
  - Check online Neon database to confirm the new records appeared.
  - Submit a test admission enquiry online and verify it pulls down to the local school database.

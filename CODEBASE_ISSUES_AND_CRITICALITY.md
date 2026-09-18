# Codebase Issues Assessment & Criticality Report

**Project:** Green Park School Management & Parent Portal  
**Branch:** `loki`  
**Date:** September 12, 2026  
**Status:** Audit Completed — Pending Remediation

---

## Criticality Matrix Summary

| ID | Issue Title | Component | Criticality Level | Impact Summary |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Dangerous Inline `DROP TABLE CASCADE` on Startup | Backend (`main.py`) | 🔴 **CRITICAL** | Total Data Loss Risk |
| **NET-01** | Dual Hardcoded API Configurations Blocking LAN | Frontend (`config.js`, `api.js`) | 🔴 **CRITICAL** | Zero LAN / Mobile Functionality |
| **DAT-01** | Hardcoded `"2024-25"` in Marks & Attendance | Backend (`admin_service.py`) | 🔴 **CRITICAL** | Silent Data Corruption across Years |
| **SYS-01** | Boto3 / R2 Startup Crash on Invalid/Offline Credentials | Backend (`s3.py`) | 🔴 **CRITICAL** | App Startup Crash / Offline Blocker |
| **FEAT-01** | Missing Staff Attendance Entry Interface & Broken Route | Frontend (`App.jsx`, `Staff`) | 🟠 **HIGH** | Teachers Cannot Record Attendance |
| **SEC-02** | Student Lookup by Concatenated Name String | Backend (`fees.py`) | 🟠 **HIGH** | Wrong Student Lookup / ID Clashes |
| **AUTH-01** | 30-Min Token Expiry with No Global 401 Catch | Backend + Frontend Auth | 🟠 **HIGH** | Silent Logouts & Lost Teacher Work |
| **API-01** | Untyped Raw JSON Parsing in Student Creation | Backend (`admin.py`) | 🟡 **MEDIUM** | Unhandled 500 Server Errors |
| **VAL-01** | Phone Number Regex Mismatch (9 vs 10 digits) | Frontend (`AdminParents`, `Login`) | 🟡 **MEDIUM** | Parent Account Permanent Lockout |

---

## Detailed Issue Analysis

### 🔴 CRITICAL ISSUES (Fix Immediately)

---

#### 1. Dangerous Inline `DROP TABLE CASCADE` on Server Boot
* **ID:** `SEC-01`
* **Criticality:** 🔴 **CRITICAL (Data Loss Risk)**
* **File Location:** `backend/app/main.py:25-45`
* **Description:**  
  On every application startup, the backend inspects the database schema and runs raw SQL dropping core tables if a legacy column is detected:
  ```python
  conn.execute(text("DROP TABLE IF EXISTS fee_payments CASCADE;"))
  conn.execute(text("DROP TABLE IF EXISTS scholarship_postings CASCADE;"))
  conn.execute(text("DROP TABLE IF EXISTS fee_structures CASCADE;"))
  conn.execute(text("DROP TABLE IF EXISTS academic_years CASCADE;"))
  conn.commit()
  ```
* **Impact:** Any minor column rename or unexpected schema state in production will silently drop all financial transaction records and fee structures.
* **Remediation:** Remove inline `DROP TABLE` from the startup file. All schema evolutions must be handled strictly through versioned Alembic migration scripts.

---

#### 2. Dual Hardcoded API Configuration Blocking LAN / Offline Devices
* **ID:** `NET-01`
* **Criticality:** 🔴 **CRITICAL (Deployment Blocker)**
* **File Locations:**  
  - `frontend/src/config.js`
  - `frontend/src/config/api.js`
  - `frontend/.env.development`
* **Description:**  
  The codebase has two competing configuration modules:
  - 19 pages import `API_BASE_URL` from `src/config.js` using native `fetch()`.
  - Multiple components import `api` from `src/config/api.js` using `axios`.
  - Both hardcode `http://localhost:8000` in local mode.
* **Impact:** When a teacher opens the portal on a phone or laptop via the school Wi-Fi (e.g., `http://192.168.1.150:5173`), API requests resolve to `localhost:8000` (the client's own device) and fail completely.
* **Remediation:** Unify both files into a single source of truth that dynamically resolves to the server machine's hostname:
  ```javascript
  export const API_BASE_URL = import.meta.env.VITE_API_URL || 
    (typeof window !== 'undefined' ? `http://${window.location.hostname}:8000` : 'http://localhost:8000');
  ```

---

#### 3. Hardcoded Academic Year (`"2024-25"`) in Marks and Attendance
* **ID:** `DAT-01`
* **Criticality:** 🔴 **CRITICAL (Data Corruption)**
* **File Locations:** `backend/app/services/admin_service.py:523 & 552`
* **Description:**  
  - Line 523: In `enter_bulk_marks`, `academic_year="2024-25"` is hardcoded into the new `Marks` record.
  - Line 552: In `mark_bulk_attendance`, `academic_year="2024-25"` is hardcoded into the new `Attendance` record.
* **Impact:** Every record saved for the current (`2025-2026`) or upcoming (`2026-2027`) school year is tagged as `"2024-25"`, corrupting reports, student historical cards, and promotion calculations.
* **Remediation:** Dynamically fetch the current active academic year from `AcademicYear.status == 'ACTIVE'` or accept `academic_year_id` in the API payload.

---

#### 4. Boto3 / R2 Startup Crash on Offline or Formatting Errors
* **ID:** `SYS-01`
* **Criticality:** 🔴 **CRITICAL (Availability Blocker)**
* **File Location:** `backend/app/utils/s3.py:15-21`
* **Description:**  
  The S3/R2 client is instantiated at top-level module import time. If credentials are dummy, missing, or contain invalid hostname characters (e.g. underscores in endpoint URL placeholders), botocore throws a fatal `ValueError` during module import.
* **Impact:** The entire FastAPI backend server fails to boot, crashing all local services.
* **Remediation:** Wrap client instantiation in lazy initialization with a fallback to local disk storage (`backend/uploads/`) when R2 credentials are not set or when internet is unavailable.

---

### 🟠 HIGH ISSUES (Major Functional Flaws)

---

#### 5. Missing Staff Attendance Entry Interface & Broken Route
* **ID:** `FEAT-01`
* **Criticality:** 🟠 **HIGH (Core Feature Incomplete)**
* **File Location:** `frontend/src/App.jsx:134`
* **Description:**  
  The backend provides `POST /api/v1/admin/attendance` for bulk daily attendance marking. However, in `App.jsx`:
  ```jsx
  <Route path="/staff/attendance" element={<AttendancePage />} />
  ```
  `AttendancePage.jsx` is strictly designed for parents and students to view history. It attempts to read `selectedChild.id` or `user.student_id`. For a staff user, both values are undefined, rendering an empty or broken screen.
* **Impact:** Teachers have no user interface to take daily student attendance or mark Present/Absent.
* **Remediation:** Build a dedicated `AdminAttendance.jsx` component (similar to `AdminMarks.jsx`) allowing teachers to pick Class, Section, and Date to toggle attendance, and wire it to `/staff/attendance` and `/admin/attendance`.

---

#### 6. Student Lookup by Concatenated Name String in Receipt Verification
* **ID:** `SEC-02`
* **Criticality:** 🟠 **HIGH (Access Control & Correctness)**
* **File Location:** `backend/app/api/v1/fees.py:138`
* **Description:**  
  In `get_legacy_receipt`:
  ```python
  student = db.query(Student).filter(
      (Student.first_name + " " + Student.last_name) == receipt["student"]["name"]
  ).first()
  ```
* **Impact:** If two students have identical names, or names with extra spacing, the system matches the wrong student, returning another student's fee details or denying legitimate access with a 403 error.
* **Remediation:** Filter receipts strictly by unique `student_id`.

---

#### 7. 30-Minute Token Expiry with No Global 401 Handler
* **ID:** `AUTH-01`
* **Criticality:** 🟠 **HIGH (User Experience & Data Loss)**
* **File Locations:**  
  - `backend/app/core/config.py:10`
  - `frontend/src/context/AuthContext.jsx`
* **Description:**  
  `ACCESS_TOKEN_EXPIRE_MINUTES = 30`. When the token expires, `localStorage` still retains the `user` object. When teachers click "Save Marks" or "Save Fees", the API responds with 401 Unauthorized. Because `fetch()` has no interceptor, pages show generic alerts ("Failed to save") and work is lost.
* **Remediation:** Increase local token lifetime (e.g. 7 days for local campus use) and add a centralized 401 error handler that preserves form state and redirects to login.

---

### 🟡 MEDIUM ISSUES (Code Quality & Validation)

---

#### 8. Untyped Raw JSON in Student Creation Endpoint
* **ID:** `API-01`
* **Criticality:** 🟡 **MEDIUM (Error Handling)**
* **File Location:** `backend/app/api/v1/admin.py:24-27`
* **Description:**  
  The endpoint uses `await request.json()` and manual dictionary parsing instead of a Pydantic schema (`StudentCreate`).
* **Impact:** Invalid or missing inputs trigger internal PostgreSQL `psycopg2.errors.NotNullViolation` 500 errors instead of clean 422 HTTP validation responses.
* **Remediation:** Define and enforce `data: student_schema.StudentCreate` in the endpoint signature.

---

#### 9. Phone Number Regex Mismatch (Risk of Permanent Lockout)
* **ID:** `VAL-01`
* **Criticality:** 🟡 **MEDIUM (Account Usability)**
* **File Locations:**  
  - `frontend/src/pages/admin/AdminParents.jsx:60`
  - `frontend/src/pages/LoginPage.jsx:74`
* **Description:**  
  `AdminParents.jsx` validates `/^[6-9]\d{8,9}$/` (allowing 9 or 10 digits), while `LoginPage.jsx` strictly enforces `/^\d{10}$/` (10 digits).
* **Impact:** If an administrator creates a parent with a 9-digit phone number, the parent can never log in on `LoginPage`.
* **Remediation:** Standardize phone validation across all components to `/^[6-9]\d{9}$/`.

---

## Recommended Remediation Sequence

1. **Step 1:** Fix `SEC-01` (Remove destructive startup table dropping from `main.py`).
2. **Step 2:** Fix `NET-01` (Make frontend API base URL dynamic for LAN access).
3. **Step 3:** Fix `DAT-01` (Remove hardcoded `"2024-25"` from `admin_service.py`).
4. **Step 4:** Fix `SYS-01` (Add resilient S3/R2 fallback initialization in `s3.py`).
5. **Step 5:** Fix `FEAT-01` (Build teacher bulk attendance marking UI).
6. **Step 6:** Fix `SEC-02` (Use `student_id` in receipt verification).
7. **Step 7:** Fix `AUTH-01`, `API-01`, and `VAL-01` (Token lifetime, Pydantic schemas, and regex alignment).

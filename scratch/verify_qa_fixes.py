import requests
import json
import sys
import os

# Set environment variables for app config
os.environ["DATABASE_URL"] = "postgresql://postgres:postgres@localhost:5432/greenpark_db"

sys.path.insert(0, os.path.abspath("backend"))
from app.core.security import create_access_token

BASE_URL = "http://127.0.0.1:8000"

def log_result(test_num, name, status, details=""):
    symbol = "PASS" if status else "FAIL"
    print(f"[{symbol}] Test {test_num:02d}: {name} - {details}")
    return status

def run_tests():
    results = []
    
    # 1. Backend health check
    try:
        res = requests.get(f"{BASE_URL}/", timeout=5)
        results.append(log_result(1, "Backend health check", res.status_code == 200, f"Status: {res.status_code}"))
    except Exception as e:
        results.append(log_result(1, "Backend health check", False, f"Connection failed: {e}"))
        return results

    # Generate valid JWT tokens for test roles:
    # User ID 1 = Admin, User ID 4 = Parent PAR001, User ID 5 = Parent PAR002, User ID 19 = Student STU001, User ID 20 = Staff STF001
    admin_token = create_access_token({"sub": "1", "role": "admin"})
    staff_token = create_access_token({"sub": "20", "role": "staff"})
    parent1_token = create_access_token({"sub": "4", "role": "parent"})
    parent2_token = create_access_token({"sub": "5", "role": "parent"})
    student1_token = create_access_token({"sub": "19", "role": "student"})

    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    headers_staff = {"Authorization": f"Bearer {staff_token}"}
    headers_parent1 = {"Authorization": f"Bearer {parent1_token}"}
    headers_parent2 = {"Authorization": f"Bearer {parent2_token}"}
    headers_student1 = {"Authorization": f"Bearer {student1_token}"}

    # 2. Unauthenticated attendance request -> 401
    res = requests.get(f"{BASE_URL}/api/v1/attendance/2023657401")
    results.append(log_result(2, "Unauthenticated attendance request -> 401", res.status_code == 401, f"Status: {res.status_code}"))

    # 3. Authenticated attendance request -> works (200 OK)
    res = requests.get(f"{BASE_URL}/api/v1/attendance/2023657401", headers=headers_admin)
    results.append(log_result(3, "Authenticated attendance request -> works", res.status_code == 200, f"Status: {res.status_code}"))

    # 4. Unauthenticated marks request -> 401
    res = requests.get(f"{BASE_URL}/api/v1/marks/2023657401")
    results.append(log_result(4, "Unauthenticated marks request -> 401", res.status_code == 401, f"Status: {res.status_code}"))

    # 5. Authenticated marks request -> works (200 OK)
    res = requests.get(f"{BASE_URL}/api/v1/marks/2023657401", headers=headers_admin)
    results.append(log_result(5, "Authenticated marks request -> works", res.status_code == 200, f"Status: {res.status_code}"))

    # 6. Unauthenticated parent profile request -> 401
    res = requests.get(f"{BASE_URL}/api/v1/profile/PAR001")
    results.append(log_result(6, "Unauthenticated parent profile request -> 401", res.status_code == 401, f"Status: {res.status_code}"))

    # 7. Authenticated parent profile request -> works
    res = requests.get(f"{BASE_URL}/api/v1/profile/PAR001", headers=headers_parent1)
    results.append(log_result(7, "Authenticated parent profile request -> works", res.status_code == 200, f"Status: {res.status_code}"))

    # 8. Unauthenticated parent students request -> 401
    res = requests.get(f"{BASE_URL}/api/v1/students/PAR001")
    results.append(log_result(8, "Unauthenticated parent students request -> 401", res.status_code == 401, f"Status: {res.status_code}"))

    # 9. Parent cannot access another parent's students (403 Forbidden)
    res = requests.get(f"{BASE_URL}/api/v1/students/PAR001", headers=headers_parent2)
    results.append(log_result(9, "Cross-parent IDOR access denied -> 403", res.status_code == 403, f"Status: {res.status_code}"))

    # 10. Admin/staff access still works where intended
    res_admin = requests.get(f"{BASE_URL}/api/v1/students/PAR001", headers=headers_admin)
    res_staff = requests.get(f"{BASE_URL}/api/v1/students/PAR001", headers=headers_staff)
    status_ok = (res_admin.status_code == 200) and (res_staff.status_code == 200)
    results.append(log_result(10, "Admin/Staff cross-access authorized", status_ok, f"Admin: {res_admin.status_code}, Staff: {res_staff.status_code}"))

    # 11. Staff fetch attendance roster -> works
    res_roster = requests.get(f"{BASE_URL}/api/v1/admin/attendance?class_name=7&section=A&date=2026-09-19", headers=headers_staff)
    results.append(log_result(11, "Staff fetch attendance roster -> works", res_roster.status_code == 200, f"Status: {res_roster.status_code}"))

    # 12. Student view own attendance -> 200 OK
    res_stu_own = requests.get(f"{BASE_URL}/api/v1/attendance/2023657401", headers=headers_student1)
    results.append(log_result(12, "Student view own attendance -> 200", res_stu_own.status_code == 200, f"Status: {res_stu_own.status_code}"))

    # 13. Student view other student attendance -> 403 Forbidden
    res_stu_other = requests.get(f"{BASE_URL}/api/v1/attendance/2023626642", headers=headers_student1)
    results.append(log_result(13, "Student view other student attendance -> 403", res_stu_other.status_code == 403, f"Status: {res_stu_other.status_code}"))

    # 14. Parent view child attendance -> 200 OK
    res_par_child = requests.get(f"{BASE_URL}/api/v1/attendance/2023657401", headers=headers_parent1)
    results.append(log_result(14, "Parent view child attendance -> 200", res_par_child.status_code == 200, f"Status: {res_par_child.status_code}"))

    # 15. Parent view other student attendance -> 403 Forbidden
    res_par_other = requests.get(f"{BASE_URL}/api/v1/attendance/2023626642", headers=headers_parent1)
    results.append(log_result(15, "Parent view other student attendance -> 403", res_par_other.status_code == 403, f"Status: {res_par_other.status_code}"))

    # 16. Unauthenticated parent photo upload -> 401
    res_upload_unauth = requests.post(f"{BASE_URL}/api/v1/profile/upload-photo", data={"parent_id": "PAR001"})
    results.append(log_result(16, "Unauthenticated photo upload -> 401", res_upload_unauth.status_code == 401, f"Status: {res_upload_unauth.status_code}"))

    # 17. Unauthorized parent photo upload (cross-parent) -> 403
    files = {"image": ("test.jpg", b"dummy content", "image/jpeg")}
    res_upload_idor = requests.post(f"{BASE_URL}/api/v1/profile/upload-photo", data={"parent_id": "PAR001"}, files=files, headers=headers_parent2)
    results.append(log_result(17, "Cross-parent photo upload -> 403", res_upload_idor.status_code == 403, f"Status: {res_upload_idor.status_code}"))

    passed = sum(results)
    total = len(results)
    print(f"\n==========================================")
    print(f"FINAL QA REMEDIATION RESULT: {passed}/{total} PASSED")
    print(f"==========================================")

if __name__ == "__main__":
    run_tests()

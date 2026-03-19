import requests

# Login
login_resp = requests.post(
    "http://localhost:8000/api/v1/login",
    json={"phone_number": "1234567890", "password": "admin123", "role": "admin"}
)
print(f"Login status: {login_resp.status_code}")
if login_resp.status_code != 200:
    print(f"Login response: {login_resp.text}")
else:
    token = login_resp.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test the students API
    print("\n=== Testing GET /admin/students?class_name=7&section=A ===")
    res = requests.get(
        "http://localhost:8000/api/v1/admin/students?class_name=7&section=A",
        headers=headers
    )
    print(f"Status: {res.status_code}")
    if res.status_code == 200:
        students = res.json()
        print(f"Count returned: {len(students)}")
        for s in students[:3]:
            print(f"  Student: {s}")
    else:
        print(f"Error: {res.text}")

    # Also test without filter
    print("\n=== Testing GET /admin/students (no filter) ===")
    res2 = requests.get("http://localhost:8000/api/v1/admin/students", headers=headers)
    print(f"Status: {res2.status_code}")
    if res2.status_code == 200:
        students2 = res2.json()
        print(f"Total returned: {len(students2)}")
    else:
        print(f"Error: {res2.text}")

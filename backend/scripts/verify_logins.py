import urllib.request
import json

def test_login(phone, password, role):
    url = 'http://localhost:8000/api/v1/login'
    payload = {'phone_number': phone, 'password': password, 'role': role}
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            name = data.get("user", {}).get("name")
            print(f"[SUCCESS] Role: {role:<8} | Phone: {phone} | Name: {name}")
    except Exception as e:
        print(f"[FAILED]  Role: {role:<8} | Phone: {phone} | Error: {e}")

if __name__ == "__main__":
    print("--- TESTING LOGIN CREDENTIALS ---")
    test_login("1234567890", "admin123", "admin")
    test_login("2345678998", "password123", "staff")
    test_login("9876543210", "password123", "staff")
    test_login("8978675634", "password123", "parent")
    test_login("8838787065", "password123", "parent")
    test_login("8838787065", "password123", "student")

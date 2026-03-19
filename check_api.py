import requests

url = "http://localhost:8000/api/v1/admin/fees?class_name=7&section=A"
# Assuming we don't need auth for this test if we bypass the Depends, 
# but I can't easily bypass it via requests.
# However, I can check if it returns 401/404/500.
try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text[:200]}")
except Exception as e:
    print(f"Error: {e}")

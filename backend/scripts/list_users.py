import psycopg2
from psycopg2.extras import RealDictCursor
from app.core.security import verify_password

conn = psycopg2.connect('postgresql://postgres:postgres@localhost:5434/greenpark_db', cursor_factory=RealDictCursor)
cur = conn.cursor()

cur.execute("""
    SELECT user_id, phone_number, role, password, parent_id, student_id, staff_id, admin_id
    FROM users 
    ORDER BY role, user_id;
""")
users = cur.fetchall()

test_passwords = [
    "admin123", "password", "password123", "Admin@123", "Staff@123", 
    "greenpark", "12345678", "secret", "123456", "parent123", "student123"
]

print(f"Total users in DB: {len(users)}\n")
for u in users:
    matched_pw = None
    # Check if password is stored as plaintext
    if u["password"] in test_passwords or len(u["password"]) < 20:
        matched_pw = u["password"]
    else:
        for p in test_passwords:
            try:
                if verify_password(p, u["password"]):
                    matched_pw = p
                    break
            except Exception:
                pass
            
    print(f"Role: {u['role']:<8} | Phone: {str(u['phone_number']):<15} | Password: {matched_pw or 'HASHED'}")

conn.close()

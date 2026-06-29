import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.models.parent import Parent
from app.models.staff import Staff
from app.models.admin import Admin

db = SessionLocal()
try:
    phone = "9876543210"
    print(f"Checking who owns phone number: {phone}")
    
    parent = db.query(Parent).filter(Parent.phone_primary == phone).first()
    if parent:
        print(f" [+] Found Parent: {parent.father_name} / {parent.mother_name} (ID: {parent.parent_id})")
    else:
        print(" [-] No Parent has this phone number.")
        
    staff = db.query(Staff).filter(Staff.phone == phone).first()
    if staff:
        print(f" [+] Found Staff: {staff.first_name} {staff.last_name} (ID: {staff.staff_id}, Dept: {staff.department})")
    else:
        print(" [-] No Staff has this phone number.")
        
    admin = db.query(Admin).filter(Admin.phone == phone).first()
    if admin:
        print(f" [+] Found Admin: {admin.first_name} {admin.last_name} (ID: {admin.admin_id})")
    else:
        print(" [-] No Admin has this phone number.")
finally:
    db.close()

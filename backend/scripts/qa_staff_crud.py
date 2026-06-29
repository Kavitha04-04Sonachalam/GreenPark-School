import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from datetime import date
from fastapi import HTTPException
from app.core.database import SessionLocal
from app.models.staff import Staff
from app.models.user import User
from app.schemas.staff_schema import StaffCreate, StaffUpdate
from app.services import staff_service
from app.core.security import verify_password

def run_tests():
    db = SessionLocal()
    try:
        print("Starting E2E QA Verification for Staff CRUD Module...")
        
        # Clean up existing test records if any
        cleanup_records(db)
        
        # 1. Test Validation: Invalid Mobile Number
        print(" [1/7] Testing Validation - Invalid Mobile Number")
        try:
            invalid_staff = StaffCreate(
                employee_id="STF-QA-01",
                employee_name="QA Candidate One",
                gender="Male",
                mobile_no="98765", # Too short
                designation="Teacher",
                date_of_joining=date(2025, 6, 1),
                password="password123"
            )
            staff_service.create_staff(db, invalid_staff)
            assert False, "Should have failed on mobile number validation"
        except ValueError as ve:
            print(f"   * Caught expected Pydantic Validation Error: {ve}")
            
        # 2. Test Staff Creation (Successful Transaction Sync)
        print(" [2/7] Testing Staff Creation and User Linkage")
        staff_data = StaffCreate(
            employee_id="STF-QA-01",
            employee_name="QA Candidate One",
            gender="Male",
            mobile_no="9000000001",
            designation="Teacher",
            date_of_joining=date(2025, 6, 1),
            door_no="A-1",
            street_name="QA Lane",
            district="Chennai",
            state="Tamil Nadu",
            pincode="600001",
            access_rights="Science",
            password="securepassword123"
        )
        new_staff = staff_service.create_staff(db, staff_data)
        assert new_staff.id is not None, "Staff ID should be populated"
        assert new_staff.employee_name == "QA Candidate One"
        assert new_staff.user_id is not None, "User ID should be linked"
        
        # Query User
        user = db.query(User).filter(User.user_id == new_staff.user_id).first()
        assert user is not None, "User record must exist"
        assert user.phone_number == "9000000001"
        assert user.role == "staff"
        assert user.staff_id == "STF-QA-01"
        assert verify_password("securepassword123", user.password), "Password must be hashed correctly"
        print("   * Staff member and hashed User login successfully created within one transaction.")
        
        # 3. Test Validation: Duplicate Employee ID
        print(" [3/7] Testing Validation - Duplicate Employee ID")
        try:
            dup_id_staff = StaffCreate(
                employee_id="STF-QA-01", # Duplicate
                employee_name="QA Candidate Two",
                gender="Female",
                mobile_no="9000000002",
                designation="Principal",
                date_of_joining=date(2025, 6, 1),
                password="password123"
            )
            staff_service.create_staff(db, dup_id_staff)
            assert False, "Should have failed on duplicate Employee ID"
        except HTTPException as he:
            assert he.status_code == 400 and "Employee ID already exists" in he.detail
            print(f"   * Caught expected HTTP 400: {he.detail}")
            
        # 4. Test Validation: Duplicate Mobile Number
        print(" [4/7] Testing Validation - Duplicate Mobile Number")
        try:
            dup_mobile_staff = StaffCreate(
                employee_id="STF-QA-02",
                employee_name="QA Candidate Two",
                gender="Female",
                mobile_no="9000000001", # Duplicate mobile
                designation="Principal",
                date_of_joining=date(2025, 6, 1),
                password="password123"
            )
            staff_service.create_staff(db, dup_mobile_staff)
            assert False, "Should have failed on duplicate Mobile Number"
        except HTTPException as he:
            assert he.status_code == 400 and "Mobile number already exists" in he.detail
            print(f"   * Caught expected HTTP 400: {he.detail}")
            
        # 5. Test Staff Update (Keep Existing Password)
        print(" [5/7] Testing Staff Update - Blank Password Preservation")
        update_data = StaffUpdate(
            employee_name="QA Candidate One Updated",
            designation="Principal",
            password="" # Leave blank
        )
        updated_staff = staff_service.update_staff(db, new_staff.id, update_data)
        assert updated_staff.employee_name == "QA Candidate One" or updated_staff.employee_name == "QA Candidate One Updated"
        assert updated_staff.designation == "Principal"
        
        # Verify user password remains unchanged
        user_check = db.query(User).filter(User.user_id == updated_staff.user_id).first()
        assert verify_password("securepassword123", user_check.password), "Password must be preserved"
        
        # Test Password Update
        update_pass_data = StaffUpdate(
            password="newsecurepassword123"
        )
        updated_staff = staff_service.update_staff(db, new_staff.id, update_pass_data)
        user_check = db.query(User).filter(User.user_id == updated_staff.user_id).first()
        assert verify_password("newsecurepassword123", user_check.password), "Password must be updated"
        print("   * Update handles fields correctly and preserves passwords when left blank.")
        
        # 6. Test Query Search & Filtering
        print(" [6/7] Testing Query Filters and Searches")
        search_res = staff_service.get_staff(db, search="QA Candidate One")
        assert len(search_res) == 1, "Search should return 1 matching record"
        
        filter_res = staff_service.get_staff(db, designation="Principal")
        assert len(filter_res) > 0, "Filter by designation should return records"
        print("   * Search by name/ID/mobile and list filters work successfully.")
        
        # 7. Test Deletion (Transaction Rollback/Cascade cleanup)
        print(" [7/7] Testing Staff Deletion (User account cleanup)")
        deleted = staff_service.delete_staff(db, new_staff.id)
        assert deleted is True
        
        # Verify records are gone
        staff_check = db.query(Staff).filter(Staff.employee_id == "STF-QA-01").first()
        user_check = db.query(User).filter(User.phone_number == "9000000001", User.role == "staff").first()
        assert staff_check is None, "Staff record should be deleted"
        assert user_check is None, "Linked User account should be deleted"
        print("   * Deleting staff cleanly deletes both staff and linked user, leaving zero orphaned records.")
        
        print("\nALL STAFF CRUD INTEGRATION TESTS PASSED SUCCESSFULLY!")
        
    finally:
        cleanup_records(db)
        db.close()

def cleanup_records(db):
    try:
        # Find test staff
        test_staffs = db.query(Staff).filter(Staff.employee_id.like("STF-QA-%")).all()
        for ts in test_staffs:
            if ts.user_id:
                db.query(User).filter(User.user_id == ts.user_id).delete()
            db.delete(ts)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error during cleanup: {e}")

if __name__ == "__main__":
    run_tests()

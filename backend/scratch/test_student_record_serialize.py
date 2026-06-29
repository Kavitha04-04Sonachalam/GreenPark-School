import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.schemas.student_schema import StudentSchema

class StudentRecord:
    def __init__(self):
        self.student_id = "S123"
        self.first_name = "John"
        self.last_name = "Doe"
        self.gender = "Male"
        self.date_of_birth = None
        self.class_ = "LKG"
        self.section = "A"
        self.roll_number = "10"
        self.academic_year = "2025-2026"
        self.admission_number = "ADM-10"
        self.parent_id = "P123"

obj = StudentRecord()
schema = StudentSchema.model_validate(obj)
print("Serialized successfully:", schema.model_dump(by_alias=True))

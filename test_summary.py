from backend.app.core.database import SessionLocal
from backend.app.models import Student, Parent, ClassModel, Activity
from typing import Optional

def check(class_name: Optional[str] = None, section: Optional[str] = None):
    db = SessionLocal()
    student_query = db.query(Student)
    parent_query = db.query(Parent)
    class_query = db.query(ClassModel)
    
    if class_name:
        print(f"Filtering by Class: {class_name}")
        student_query = student_query.filter(Student.class_ == class_name)
        class_query = class_query.filter(ClassModel.class_name == class_name)
    
    if section:
        print(f"Filtering by Section: {section}")
        student_query = student_query.filter(Student.section == section)
        class_query = class_query.filter(ClassModel.section == section)
        
    if class_name or section:
        parent_query = parent_query.join(Student)
        if class_name:
            parent_query = parent_query.filter(Student.class_ == class_name)
        if section:
            parent_query = parent_query.filter(Student.section == section)
        
    res = {
        "total_students": student_query.count(),
        "total_parents": parent_query.distinct().count(),
        "total_classes": class_query.count(),
        "total_activities": db.query(Activity).count()
    }
    db.close()
    return res

print("Overall:", check())
print("7A:", check("7", "A"))

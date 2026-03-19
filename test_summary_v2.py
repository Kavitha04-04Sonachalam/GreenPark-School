from backend.app.core.database import SessionLocal
from backend.app.models import Student, Parent, ClassModel, Activity
from typing import Optional
from sqlalchemy import func

def get_dashboard_summary(db: SessionLocal, class_name: Optional[str] = None, section: Optional[str] = None):
    student_query = db.query(Student)
    parent_query = db.query(Parent)
    class_query = db.query(ClassModel)
    
    # Mapping for common class naming inconsistencies
    class_map = {"7": "VII", "VII": "7"}
    
    if class_name:
        if class_name in class_map:
            alt_class = class_map[class_name]
            student_query = student_query.filter(Student.class_.in_([class_name, alt_class]))
            class_query = class_query.filter(ClassModel.class_name.in_([class_name, alt_class]))
        else:
            student_query = student_query.filter(Student.class_ == class_name)
            class_query = class_query.filter(ClassModel.class_name == class_name)
    
    if section:
        student_query = student_query.filter(Student.section == section)
        class_query = class_query.filter(ClassModel.section == section)
        
    if class_name or section:
        parent_query = parent_query.join(Student)
        if class_name:
            if class_name in class_map:
                parent_query = parent_query.filter(Student.class_.in_([class_name, class_map[class_name]]))
            else:
                parent_query = parent_query.filter(Student.class_ == class_name)
        if section:
            parent_query = parent_query.filter(Student.section == section)
    
    # Log counts for debugging
    student_count = student_query.count()
    parent_count = parent_query.distinct(Parent.parent_id).count() if (class_name or section) else parent_query.count()
    
    # If filtered and no class found in ClassModel but students exist, set class count to 1
    total_classes = class_query.count()
    if (class_name or section) and total_classes == 0 and student_count > 0:
        total_classes = 1

    return {
        "total_students": student_count,
        "total_parents": parent_count,
        "total_classes": total_classes,
        "total_activities": db.query(Activity).count()
    }

db = SessionLocal()
print("7A:", get_dashboard_summary(db, "7", "A"))
db.close()

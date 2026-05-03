from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..models.notification import Notification
from typing import List, Optional

def create_notification(db: Session, notification_data: dict):
    if "target_classes" in notification_data:
        t_classes = notification_data.pop("target_classes")
        if t_classes:
            notification_data["class_name"] = ",".join(t_classes)

    db_notification = Notification(**notification_data)
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification

def get_all_notifications(db: Session):
    return db.query(Notification).order_by(Notification.created_at.desc()).all()

def get_notifications_for_parent(db: Session, parent_class: Optional[str] = None):
    # Filter: target_type='all' OR (target_type='class' and class_name=parent_class)
    query = db.query(Notification)
    if parent_class:
        query = query.filter(
            or_(
                Notification.target_type == 'all',
                Notification.class_name == parent_class,
                Notification.class_name.like(f"{parent_class},%"),
                Notification.class_name.like(f"%,{parent_class},%"),
                Notification.class_name.like(f"%,{parent_class}")
            )
        )
    else:
        query = query.filter(Notification.target_type == 'all')
        
    return query.order_by(Notification.created_at.desc()).all()

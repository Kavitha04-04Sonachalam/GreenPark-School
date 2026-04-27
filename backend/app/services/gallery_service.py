from sqlalchemy.orm import Session
from ..models.gallery import Event, Media
from ..schemas.gallery_schema import EventCreate, MediaCreate
from typing import List

def get_events(db: Session) -> List[Event]:
    return db.query(Event).order_by(Event.date.desc()).all()

def get_event(db: Session, event_id: int) -> Event:
    return db.query(Event).filter(Event.id == event_id).first()

def create_event(db: Session, event_data: dict) -> Event:
    db_event = Event(**event_data)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def delete_event(db: Session, event_id: int):
    db_event = db.query(Event).filter(Event.id == event_id).first()
    if db_event:
        db.delete(db_event)
        db.commit()
    return db_event

def create_media(db: Session, event_id: int, media_url: str, media_type: str = "image") -> Media:
    db_media = Media(event_id=event_id, media_url=media_url, media_type=media_type)
    db.add(db_media)
    db.commit()
    db.refresh(db_media)
    return db_media

def delete_media(db: Session, media_id: int):
    db_media = db.query(Media).filter(Media.id == media_id).first()
    if db_media:
        db.delete(db_media)
        db.commit()
    return db_media

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from ...core.database import get_db
from ...services import sync_service
from ..deps import get_current_staff_user

router = APIRouter()

@router.get("/status")
def get_sync_status(db: Session = Depends(get_db), current_user = Depends(get_current_staff_user)):
    """
    Returns pending count, failed count, internet status, and last synced timestamp.
    """
    is_online = sync_service.check_internet_connection()
    last_sync = sync_service.get_watermark(db, "last_synced_at")

    pending_marks = db.execute(text("SELECT count(*) FROM marks WHERE sync_status = 'pending';")).scalar() or 0
    pending_att = db.execute(text("SELECT count(*) FROM attendance WHERE sync_status = 'pending';")).scalar() or 0
    pending_fees = db.execute(text("SELECT count(*) FROM fee_payments WHERE sync_status = 'pending';")).scalar() or 0

    failed_marks = db.execute(text("SELECT count(*) FROM marks WHERE sync_status = 'sync_failed';")).scalar() or 0
    failed_att = db.execute(text("SELECT count(*) FROM attendance WHERE sync_status = 'sync_failed';")).scalar() or 0
    failed_fees = db.execute(text("SELECT count(*) FROM fee_payments WHERE sync_status = 'sync_failed';")).scalar() or 0

    total_pending = pending_marks + pending_att + pending_fees
    total_failed = failed_marks + failed_att + failed_fees

    return {
        "is_online": is_online,
        "last_synced_at": last_sync.isoformat() if last_sync else None,
        "total_pending": total_pending,
        "total_failed": total_failed,
        "breakdown": {
            "pending_marks": pending_marks,
            "pending_attendance": pending_att,
            "pending_fee_payments": pending_fees,
            "failed_marks": failed_marks,
            "failed_attendance": failed_att,
            "failed_fee_payments": failed_fees
        }
    }

@router.post("/trigger")
def trigger_sync_now(current_user = Depends(get_current_staff_user)):
    """
    Manually triggers an immediate bidirectional sync cycle.
    """
    return sync_service.run_sync_cycle()

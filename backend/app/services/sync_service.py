import os
import socket
import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..core.database import SessionLocal, engine
from ..core.config import settings

# Online Neon connection string (from environment or .env)
NEON_DATABASE_URL = (
    os.environ.get("NEON_DATABASE_URL")
    or getattr(settings, "NEON_DATABASE_URL", None)
    or "postgresql://neondb_owner:npg_LWGS7NyJuc0X@ep-twilight-haze-ayi43kcc-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require"
)

def check_internet_connection(timeout=2):
    """
    Fast, non-blocking check to verify if internet is available.
    Pings Google DNS 8.8.8.8:53 with a 2-second timeout.
    """
    try:
        socket.setdefaulttimeout(timeout)
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect(("8.8.8.8", 53))
        s.close()
        return True
    except Exception:
        return False

def get_watermark(db: Session, key: str):
    row = db.execute(text("SELECT value FROM sync_meta WHERE key = :key;"), {"key": key}).fetchone()
    if row and row[0]:
        try:
            return datetime.datetime.fromisoformat(row[0])
        except Exception:
            return None
    return None

def set_watermark(db: Session, key: str, dt: datetime.datetime):
    val_str = dt.isoformat()
    db.execute(text("""
        INSERT INTO sync_meta (key, value, updated_at) 
        VALUES (:key, :val, NOW()) 
        ON CONFLICT (key) DO UPDATE SET value = :val, updated_at = NOW();
    """), {"key": key, "val": val_str})
    db.commit()

def push_pending_records(db: Session, neon_conn):
    """
    Pushes local records where sync_status = 'pending' to Neon using Last-Write-Wins.
    """
    pushed_summary = {}

    # 1. Marks
    pending_marks = db.execute(text("""
        SELECT * FROM marks WHERE sync_status = 'pending' AND COALESCE(sync_attempts, 0) < 3;
    """)).mappings().all()

    if pending_marks:
        neon_cur = neon_conn.cursor()
        success_ids = []
        for m in pending_marks:
            try:
                neon_cur.execute("""
                    INSERT INTO marks (mark_id, student_id, class, section, subject, exam_type, marks_obtained, total_marks, exam_date, academic_year, updated_at, sync_status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'synced')
                    ON CONFLICT (student_id, exam_type, subject, academic_year)
                    DO UPDATE SET 
                        marks_obtained = EXCLUDED.marks_obtained,
                        total_marks = EXCLUDED.total_marks,
                        updated_at = EXCLUDED.updated_at
                    WHERE EXCLUDED.updated_at >= marks.updated_at;
                """, (
                    m["mark_id"], m["student_id"], m["class"], m["section"], m["subject"], m["exam_type"],
                    m["marks_obtained"], m["total_marks"], m["exam_date"], m["academic_year"],
                    m["updated_at"] or datetime.datetime.utcnow()
                ))
                success_ids.append(m["mark_id"])
            except Exception as e:
                neon_conn.rollback()
                print(f"[SYNC] Error pushing mark_id {m['mark_id']}: {e}")
                db.execute(text("UPDATE marks SET sync_attempts = sync_attempts + 1 WHERE mark_id = :id;"), {"id": m["mark_id"]})
                db.commit()

        if success_ids:
            neon_conn.commit()
            db.execute(text("UPDATE marks SET sync_status = 'synced', sync_attempts = 0 WHERE mark_id IN :ids;"), {"ids": tuple(success_ids)})
            db.commit()
            pushed_summary["marks"] = len(success_ids)

    # 2. Attendance
    pending_att = db.execute(text("""
        SELECT * FROM attendance WHERE sync_status = 'pending' AND COALESCE(sync_attempts, 0) < 3;
    """)).mappings().all()

    if pending_att:
        neon_cur = neon_conn.cursor()
        success_ids = []
        for a in pending_att:
            try:
                neon_cur.execute("""
                    INSERT INTO attendance (id, student_id, date, class, section, status, remarks, academic_year, updated_at, sync_status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'synced')
                    ON CONFLICT (student_id, date)
                    DO UPDATE SET 
                        status = EXCLUDED.status,
                        remarks = EXCLUDED.remarks,
                        updated_at = EXCLUDED.updated_at
                    WHERE EXCLUDED.updated_at >= attendance.updated_at;
                """, (
                    a["id"], a["student_id"], a["date"], a["class"], a["section"], a["status"],
                    a["remarks"], a["academic_year"], a["updated_at"] or datetime.datetime.utcnow()
                ))
                success_ids.append(a["id"])
            except Exception as e:
                neon_conn.rollback()
                print(f"[SYNC] Error pushing attendance id {a['id']}: {e}")
                db.execute(text("UPDATE attendance SET sync_attempts = sync_attempts + 1 WHERE id = :id;"), {"id": a["id"]})
                db.commit()

        if success_ids:
            neon_conn.commit()
            db.execute(text("UPDATE attendance SET sync_status = 'synced', sync_attempts = 0 WHERE id IN :ids;"), {"ids": tuple(success_ids)})
            db.commit()
            pushed_summary["attendance"] = len(success_ids)

    # 3. Fee Payments (Local receipts pushed to Neon)
    pending_fees = db.execute(text("""
        SELECT * FROM fee_payments WHERE sync_status = 'pending' AND COALESCE(sync_attempts, 0) < 3;
    """)).mappings().all()

    if pending_fees:
        neon_cur = neon_conn.cursor()
        success_ids = []
        for f in pending_fees:
            try:
                neon_cur.execute("""
                    INSERT INTO fee_payments (id, receipt_no, student_id, fee_structure_id, amount_paid, payment_mode, payment_date, updated_at, sync_status, sync_attempts)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'synced', 0)
                    ON CONFLICT (receipt_no) DO UPDATE SET
                        amount_paid = EXCLUDED.amount_paid,
                        payment_mode = EXCLUDED.payment_mode,
                        updated_at = EXCLUDED.updated_at
                    WHERE EXCLUDED.updated_at >= fee_payments.updated_at;
                """, (
                    f["id"], f["receipt_no"], f["student_id"], f["fee_structure_id"], f["amount_paid"],
                    f["payment_mode"], f["payment_date"], f["updated_at"] or datetime.datetime.utcnow()
                ))
                success_ids.append(f["id"])
            except Exception as e:
                neon_conn.rollback()
                print(f"[SYNC] Error pushing fee_payment id {f['id']}: {e}")
                db.execute(text("UPDATE fee_payments SET sync_attempts = sync_attempts + 1 WHERE id = :id;"), {"id": f["id"]})
                db.commit()

        if success_ids:
            neon_conn.commit()
            db.execute(text("UPDATE fee_payments SET sync_status = 'synced', sync_attempts = 0 WHERE id IN :ids;"), {"ids": tuple(success_ids)})
            db.commit()
            pushed_summary["fee_payments"] = len(success_ids)

    return pushed_summary

def pull_online_records(db: Session, neon_conn):
    """
    Pulls newly created records from Neon (Admission Enquiries, Online Payments) to Local DB.
    """
    import psycopg2.extras
    pulled_summary = {}

    last_pull = get_watermark(db, "last_pulled_at") or (datetime.datetime.utcnow() - datetime.timedelta(days=365))
    neon_cur = neon_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # 1. Pull Admission Enquiries
    try:
        neon_cur.execute("""
            SELECT * FROM admission_enquiries 
            WHERE created_at > %s
            ORDER BY created_at ASC;
        """, (last_pull,))
        enquiries = neon_cur.fetchall()

        if enquiries:
            count = 0
            for eq in enquiries:
                db.execute(text("""
                    INSERT INTO admission_enquiries (
                        id, student_name, class_applied, parent_name, phone, message, created_at, updated_at, sync_status
                    ) VALUES (
                        :id, :sname, :class, :pname, :phone, :msg, :created_at, :updated_at, 'synced'
                    ) ON CONFLICT (id) DO UPDATE SET
                        student_name = EXCLUDED.student_name,
                        class_applied = EXCLUDED.class_applied,
                        parent_name = EXCLUDED.parent_name,
                        phone = EXCLUDED.phone,
                        message = EXCLUDED.message,
                        updated_at = EXCLUDED.updated_at;
                """), {
                    "id": eq.get("id"),
                    "sname": eq.get("student_name"),
                    "class": eq.get("class_applied"),
                    "pname": eq.get("parent_name"),
                    "phone": eq.get("phone"),
                    "msg": eq.get("message"),
                    "created_at": eq.get("created_at") or datetime.datetime.utcnow(),
                    "updated_at": eq.get("updated_at") or datetime.datetime.utcnow()
                })
                count += 1
            db.commit()
            pulled_summary["admission_enquiries"] = count
    except Exception as e:
        print(f"[SYNC] Error pulling admission enquiries: {e}")

    # 2. Pull Online Fee Payments (created in Neon with even IDs)
    try:
        neon_cur.execute("""
            SELECT * FROM fee_payments 
            WHERE MOD(id, 2) = 0 AND (payment_date > %s OR updated_at > %s)
            ORDER BY payment_date ASC;
        """, (last_pull, last_pull))
        online_payments = neon_cur.fetchall()

        if online_payments:
            count = 0
            for op in online_payments:
                db.execute(text("""
                    INSERT INTO fee_payments (
                        id, receipt_no, student_id, fee_structure_id, amount_paid, payment_mode, payment_date, updated_at, sync_status, sync_attempts
                    ) VALUES (
                        :id, :receipt_no, :student_id, :fee_structure_id, :amount_paid, :payment_mode, :payment_date, :updated_at, 'synced', 0
                    ) ON CONFLICT (receipt_no) DO NOTHING;
                """), {
                    "id": op.get("id"),
                    "receipt_no": op.get("receipt_no"),
                    "student_id": op.get("student_id"),
                    "fee_structure_id": op.get("fee_structure_id"),
                    "amount_paid": op.get("amount_paid"),
                    "payment_mode": op.get("payment_mode"),
                    "payment_date": op.get("payment_date"),
                    "updated_at": op.get("updated_at") or datetime.datetime.utcnow()
                })
                count += 1
            db.commit()
            pulled_summary["online_fee_payments"] = count
    except Exception as e:
        print(f"[SYNC] Error pulling online fee payments: {e}")

    # Update Watermark
    now_dt = datetime.datetime.utcnow()
    set_watermark(db, "last_pulled_at", now_dt)
    set_watermark(db, "last_synced_at", now_dt)

    return pulled_summary

def run_sync_cycle():
    """
    Main orchestration routine called by background scheduler or manual trigger.
    """
    if not check_internet_connection():
        return {
            "success": False,
            "status": "offline",
            "message": "Internet connection unavailable. Local records remain queued safely."
        }

    import psycopg2
    try:
        neon_conn = psycopg2.connect(NEON_DATABASE_URL, connect_timeout=5)
    except Exception as e:
        return {
            "success": False,
            "status": "neon_unreachable",
            "message": f"Online Neon database unreachable: {str(e)}"
        }

    db = SessionLocal()
    try:
        pushed = push_pending_records(db, neon_conn)
        pulled = pull_online_records(db, neon_conn)
        neon_conn.close()
        now_iso = datetime.datetime.utcnow().isoformat()
        db.execute(text("""
            INSERT INTO sync_meta (key, value, updated_at)
            VALUES ('last_sync_status', 'success', NOW())
            ON CONFLICT (key) DO UPDATE SET value = 'success', updated_at = NOW();
        """))
        db.commit()

        # Media Sync (runs if R2 is configured and internet is up)
        media_result = None
        try:
            from ..utils.s3 import sync_media_files
            media_result = sync_media_files()
        except Exception as me:
            print(f"[SYNC] Media sync skipped or failed: {me}")

        print(f"[SYNC] Completed cycle at {now_iso}. Pushed: {pushed}, Pulled: {pulled}, Media: {media_result}")
        return {
            "success": True,
            "status": "synced",
            "pushed": pushed,
            "pulled": pulled,
            "media": media_result,
            "timestamp": now_iso
        }
    except Exception as e:
        if neon_conn:
            neon_conn.close()
        print(f"[SYNC] Error during sync cycle: {e}")
        return {
            "success": False,
            "status": "error",
            "message": str(e)
        }
    finally:
        db.close()


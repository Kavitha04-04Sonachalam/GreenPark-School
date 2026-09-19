import os
import sys
from sqlalchemy import create_engine, text

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.core.database import engine as default_engine

NEON_URL = os.environ.get(
    "NEON_DATABASE_URL",
    "postgresql://neondb_owner:npg_LWGS7NyJuc0X@ep-twilight-haze-ayi43kcc-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require"
)

def partition_sequences(mode="local"):
    """
    mode: 'local' (odd sequences: 1001, 1003...) or 'neon' (even sequences: 1002, 1004...)
    """
    increment = 2
    restart_val = 1001 if mode == "local" else 1002

    sequence_names = [
        "users_user_id_seq",
        "staff_id_seq",
        "attendance_id_seq",
        "marks_mark_id_seq",
        "fee_payments_id_seq",
        "fee_structures_id_seq",
        "fees_fee_id_seq",
        "admission_enquiries_id_seq",
        "activities_id_seq",
        "announcements_id_seq",
        "notifications_id_seq",
        "student_enrollments_id_seq",
        "scholarship_postings_id_seq",
        "academic_years_year_id_seq",
        "events_id_seq",
        "fee_categories_category_id_seq",
        "media_id_seq",
        "password_reset_requests_id_seq",
        "promotion_audit_logs_id_seq",
        "scholarships_id_seq",
        "subject_subj_id_seq",
        "terms_term_id_seq"
    ]

    target_engine = create_engine(NEON_URL) if mode == "neon" else default_engine

    print(f"Setting sequence partitioning for [{mode.upper()}] (Increment: {increment}, Restart base: {restart_val})...")
    with target_engine.connect() as conn:
        for seq in sequence_names:
            try:
                # Find current max ID in table if any, to avoid resetting below existing data
                check_seq = conn.execute(text(f"SELECT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = '{seq}');")).scalar()
                if not check_seq:
                    continue
                
                # Check current value
                curr = conn.execute(text(f"SELECT last_value FROM {seq};")).scalar() or 1
                new_start = max(restart_val, (curr // 2 * 2) + (1 if mode == 'local' else 2))
                
                conn.execute(text(f"ALTER SEQUENCE {seq} INCREMENT BY {increment} RESTART WITH {new_start};"))
                print(f"  [OK] {seq} -> INCREMENT BY {increment} RESTART WITH {new_start}")
            except Exception as e:
                print(f"  [SKIP] {seq}: {e}")
        conn.commit()

    print(f"Sequence partitioning applied for {mode} successfully!")

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "local"
    partition_sequences(mode)

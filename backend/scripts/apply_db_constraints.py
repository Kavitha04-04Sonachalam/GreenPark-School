import os
import sys
from sqlalchemy import create_engine, text

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.core.database import engine as default_engine, Base
from app.models import *

NEON_URL = os.environ.get(
    "NEON_DATABASE_URL",
    "postgresql://neondb_owner:npg_LWGS7NyJuc0X@ep-twilight-haze-ayi43kcc-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require"
)

def apply_constraints(target="local"):
    print(f"Applying constraints and sync columns for [{target.upper()}]...")
    target_engine = create_engine(NEON_URL) if target == "neon" else default_engine

    print("Ensuring all tables exist...")
    Base.metadata.create_all(bind=target_engine)

    print("Applying sync tracking columns and unique constraints...")
    statements = [
        # Marks
        "ALTER TABLE marks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
        "ALTER TABLE marks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
        "ALTER TABLE marks ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'synced';",
        "ALTER TABLE marks ADD COLUMN IF NOT EXISTS sync_attempts INTEGER DEFAULT 0;",
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'uq_student_exam_subject_year'
            ) THEN
                ALTER TABLE marks ADD CONSTRAINT uq_student_exam_subject_year UNIQUE (student_id, exam_type, subject, academic_year);
            END IF;
        END $$;
        """,

        # Attendance
        "ALTER TABLE attendance ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
        "ALTER TABLE attendance ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
        "ALTER TABLE attendance ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'synced';",
        "ALTER TABLE attendance ADD COLUMN IF NOT EXISTS sync_attempts INTEGER DEFAULT 0;",
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'uq_student_date_attendance'
            ) THEN
                ALTER TABLE attendance ADD CONSTRAINT uq_student_date_attendance UNIQUE (student_id, date);
            END IF;
        END $$;
        """,

        # Student Enrollments
        "ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'synced';",
        "ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS sync_attempts INTEGER DEFAULT 0;",
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'uq_student_academic_year'
            ) THEN
                ALTER TABLE student_enrollments ADD CONSTRAINT uq_student_academic_year UNIQUE (student_id, academic_year_id);
            END IF;
        END $$;
        """,

        # Fee Structures
        "ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
        "ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
        "ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'synced';",
        "ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS sync_attempts INTEGER DEFAULT 0;",

        # Scholarship Postings
        "ALTER TABLE scholarship_postings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
        "ALTER TABLE scholarship_postings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
        "ALTER TABLE scholarship_postings ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'synced';",
        "ALTER TABLE scholarship_postings ADD COLUMN IF NOT EXISTS sync_attempts INTEGER DEFAULT 0;",
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'uq_scholarship_posting_student_year'
            ) THEN
                ALTER TABLE scholarship_postings ADD CONSTRAINT uq_scholarship_posting_student_year UNIQUE (student_id, academic_year_id, scholarship_id);
            END IF;
        END $$;
        """,

        # Fee Payments
        "ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
        "ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'synced';",
        "ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS sync_attempts INTEGER DEFAULT 0;",

        # Admission Enquiries
        "ALTER TABLE admission_enquiries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
        "ALTER TABLE admission_enquiries ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'synced';"
    ]

    with target_engine.connect() as conn:
        for stmt in statements:
            conn.execute(text(stmt))
        conn.commit()

    print(f"All constraints and sync columns successfully applied to [{target.upper()}] database!")

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "local"
    apply_constraints(target)

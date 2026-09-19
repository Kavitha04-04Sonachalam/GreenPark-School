import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor

NEON_URL = os.environ.get(
    "NEON_DATABASE_URL",
    "postgresql://neondb_owner:npg_LWGS7NyJuc0X@ep-twilight-haze-ayi43kcc-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require"
)

LOCAL_URL = os.environ.get(
    "LOCAL_DATABASE_URL",
    os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/greenpark_db")
)

# Ordered topologically: Parent/independent tables first, dependent tables last.
TABLE_ORDER = [
    # 1. Foundation & Reference data
    ("academic_years", ["year_id"]),
    ("terms", ["term_id"]),
    ("fee_categories", ["category_id"]),
    ("class", ["class", "section"]),
    ("subject", ["subj_id"]),
    ("fee_structures", ["id"]),

    # 2. People & Core Entities
    ("parents", ["parent_id"]),
    ("users", ["user_id"]),
    ("admins", ["admin_id"]),
    ("staff", ["id"]),
    ("students", ["student_id"]),

    # 3. Academics, Attendance, Marks & Enrollments
    ("student_enrollments", ["id"]),
    ("attendance", ["id"]),
    ("marks", ["mark_id"]),

    # 4. Fees & Payments
    ("fees", ["fee_id"]),
    ("fee_payments", ["id"]),
    ("scholarships", ["id"]),
    ("scholarship_postings", ["id"]),

    # 5. Communications & Miscellaneous
    ("admission_enquiries", ["id"]),
    ("announcements", ["id"]),
    ("events", ["id"]),
    ("activities", ["id"]),
    ("media", ["id"]),
    ("notifications", ["id"]),
    ("password_reset_requests", ["id"]),
    ("promotion_audit_logs", ["id"]),
]

def migrate_neon_to_local(clean_local_first=True):
    print("==================================================")
    print("   MIGRATING DATA FROM NEON TO LOCAL DATABASE")
    print("==================================================")

    try:
        print("Connecting to Neon Online Database...")
        neon_conn = psycopg2.connect(NEON_URL, cursor_factory=RealDictCursor)
        neon_cur = neon_conn.cursor()
        print("  [OK] Connected to Neon.")
    except Exception as e:
        print(f"  [ERROR] Could not connect to Neon: {e}")
        return

    try:
        print("Connecting to Local PostgreSQL Database...")
        local_conn = psycopg2.connect(LOCAL_URL)
        local_cur = local_conn.cursor()
        print("  [OK] Connected to Local Database.\n")
    except Exception as e:
        print(f"  [ERROR] Could not connect to Local Database: {e}")
        neon_conn.close()
        return

    if clean_local_first:
        print("Truncating local tables to eliminate conflicting dummy seed data...")
        # Truncate all tables in reverse order to ensure foreign key integrity
        tables_to_truncate = [t[0] for t in reversed(TABLE_ORDER)]
        for table_name in tables_to_truncate:
            try:
                local_cur.execute(f'TRUNCATE TABLE "{table_name}" CASCADE;')
            except Exception as e:
                local_conn.rollback()
                # Table might not exist or already empty
                continue
        local_conn.commit()
        print("  [OK] Local tables truncated cleanly.\n")

    total_migrated = 0

    for table_name, pk_cols in TABLE_ORDER:
        try:
            # Check if table exists in Neon
            neon_cur.execute(
                "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=%s);",
                (table_name,)
            )
            if not neon_cur.fetchone()["exists"]:
                continue

            neon_cur.execute(f'SELECT * FROM "{table_name}";')
            rows = neon_cur.fetchall()
            if not rows:
                print(f"  [-] {table_name}: 0 records in Neon (Skipping).")
                continue

            # Fetch target table columns in Local
            local_cur.execute(
                "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=%s;",
                (table_name,)
            )
            local_cols = {r[0] for r in local_cur.fetchall()}
            if not local_cols:
                print(f"  [!] {table_name}: Does not exist locally (Skipping).")
                continue

            inserted_count = 0
            for r in rows:
                row_dict = dict(r)
                # Filter row keys to only columns that exist locally
                valid_items = {k: v for k, v in row_dict.items() if k in local_cols}

                # If sync_status exists, mark initially transferred rows as 'synced'
                if "sync_status" in local_cols and "sync_status" not in valid_items:
                    valid_items["sync_status"] = "synced"
                if "sync_attempts" in local_cols and "sync_attempts" not in valid_items:
                    valid_items["sync_attempts"] = 0

                cols = list(valid_items.keys())
                values = [valid_items[c] for c in cols]
                cols_str = ", ".join([f'"{c}"' for c in cols])
                placeholders = ", ".join(["%s"] * len(cols))

                pk_conflict = ", ".join([f'"{c}"' for c in pk_cols])
                query = f'INSERT INTO "{table_name}" ({cols_str}) VALUES ({placeholders}) ON CONFLICT ({pk_conflict}) DO NOTHING;'
                local_cur.execute(query, values)
                inserted_count += 1

            local_conn.commit()
            print(f"  [+] {table_name}: Migrated {inserted_count} records.")
            total_migrated += inserted_count

        except Exception as e:
            local_conn.rollback()
            print(f"  [!] {table_name} migration error: {e}")

    # Initialize sync_meta in local DB
    try:
        local_cur.execute("""
            INSERT INTO sync_meta (key, value, updated_at)
            VALUES ('last_sync_timestamp', NOW()::text, NOW())
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
        """)
        local_cur.execute("""
            INSERT INTO sync_meta (key, value, updated_at)
            VALUES ('last_sync_status', 'success', NOW())
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
        """)
        local_conn.commit()
        print("  [+] sync_meta: Updated last_sync_timestamp and status.")
    except Exception as e:
        local_conn.rollback()
        print(f"  [!] sync_meta update skipped: {e}")

    neon_conn.close()
    local_conn.close()

    print(f"\n==================================================")
    print(f"  MIGRATION COMPLETED! Total records: {total_migrated}")
    print(f"==================================================")

    # Apply sequence partitioning for local (odd numbers)
    print("\nUpdating sequence values & partitioning for local DB...")
    try:
        from scripts.setup_sequence_partitioning import partition_sequences
        partition_sequences("local")
    except Exception as e:
        print(f"  [!] Could not run partition_sequences: {e}")

if __name__ == "__main__":
    migrate_neon_to_local(clean_local_first=True)

from sqlalchemy import inspect
from app.core.database import engine

def check_schema():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print("Tables:", tables)
    for table_name in ["students", "marks", "attendance"]:
        if table_name not in tables:
            print(f"\nTable {table_name} does not exist.")
            continue
        print(f"\nTable: {table_name}")
        # print(f"  Columns: {inspector.get_columns(table_name)}")
        print(f"  PK: {inspector.get_pk_constraint(table_name)}")
        print(f"  FKs: {inspector.get_foreign_keys(table_name)}")

if __name__ == "__main__":
    import sys
    import os
    sys.path.append(os.path.join(os.getcwd(), "backend"))
    check_schema()

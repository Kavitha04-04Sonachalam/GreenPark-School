import psycopg2

try:
    conn = psycopg2.connect(
        host="localhost",
        database="school_db",
        user="postgres",
        password="postgres",
        port=5432
    )
    cur = conn.cursor()

    # Check all distinct class/section combinations
    print("=== Class/Section Distribution ===")
    cur.execute("SELECT class, section, COUNT(*) as count FROM students GROUP BY class, section ORDER BY class, section;")
    rows = cur.fetchall()
    if rows:
        for row in rows:
            print(f"  Class: '{row[0]}' | Section: '{row[1]}' | Count: {row[2]}")
    else:
        print("  No students found in database!")

    # Check total count
    print("\n=== Total Students ===")
    cur.execute("SELECT COUNT(*) FROM students;")
    total = cur.fetchone()[0]
    print(f"  Total: {total}")

    # Check specifically for class 7 section A
    print("\n=== Students in Class 7 Section A ===")
    cur.execute("SELECT student_id, first_name, last_name, class, section FROM students WHERE class = '7' AND section = 'A' LIMIT 20;")
    rows = cur.fetchall()
    if rows:
        for row in rows:
            print(f"  {row[0]} | {row[1]} {row[2]} | Class: {row[3]} | Section: {row[4]}")
    else:
        print("  No students found for class='7' section='A'")
    
    # Show first 10 students raw data
    print("\n=== First 10 Students Raw Data ===")
    cur.execute("SELECT student_id, first_name, last_name, class, section FROM students LIMIT 10;")
    rows = cur.fetchall()
    for row in rows:
        print(f"  ID: {row[0]} | Name: {row[1]} {row[2]} | Class: '{row[3]}' | Section: '{row[4]}'")

    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")

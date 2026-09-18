import psycopg2

neon_url = 'postgresql://neondb_owner:npg_LWGS7NyJuc0X@ep-twilight-haze-ayi43kcc-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require'
local_url = 'postgresql://postgres:postgres@localhost:5434/greenpark_db'

nconn = psycopg2.connect(neon_url)
ncur = nconn.cursor()

lconn = psycopg2.connect(local_url)
lcur = lconn.cursor()

ncur.execute("""
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
""")
tables = [r[0] for r in ncur.fetchall()]

print(f"{'Table':26} | {'Neon':6} | {'Local':6}")
print("-" * 44)
for t in tables:
    ncur.execute(f'SELECT count(*) FROM "{t}";')
    nc = ncur.fetchone()[0]
    try:
        lcur.execute(f'SELECT count(*) FROM "{t}";')
        lc = lcur.fetchone()[0]
    except Exception as e:
        lc = "ERR"
        lconn.rollback()
    print(f"{t:26} | {nc:6} | {str(lc):6}")

nconn.close()
lconn.close()

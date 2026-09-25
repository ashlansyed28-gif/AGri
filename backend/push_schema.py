import os
import sys
import ssl
import re

try:
    import pg8000.native
except ImportError:
    print("Error: pg8000 is not installed. Run: python -m pip install pg8000")
    sys.exit(1)

def parse_database_url(url):
    # postgresql://user:password@host:port/dbname
    pattern = r"postgres(?:ql)?://([^:]+):([^@]+)@([^:/]+)(?::(\d+))?/(.+)"
    match = re.match(pattern, url)
    if not match:
        raise ValueError("Invalid DATABASE_URL format")
    user, password, host, port, database = match.groups()
    return {
        "user": user,
        "password": password,
        "host": host,
        "port": int(port) if port else 5432,
        "database": database.split("?")[0]
    }

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sql_file = os.path.join(script_dir, "setup.sql")
    env_file = os.path.join(script_dir, ".env")

    # Read .env if available
    db_url = None
    if os.path.exists(env_file):
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("DATABASE_URL=") and not line.startswith("#"):
                    db_url = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break

    # Override if passed as argument
    if len(sys.argv) > 1:
        arg = sys.argv[1]
        if "://" in arg:
            db_url = arg
        else:
            # treat as password
            db_url = f"postgresql://postgres:{arg}@db.txpnsrgwumiofxsrkbyt.supabase.co:5432/postgres"

    if not db_url or "[YOUR-PASSWORD]" in db_url:
        print("\n=======================================================")
        print("Supabase Schema Push Utility")
        print("Project: txpnsrgwumiofxsrkbyt (https://txpnsrgwumiofxsrkbyt.supabase.co)")
        print("=======================================================\n")
        print("Usage:")
        print("  python push_schema.py <YOUR_SUPABASE_DB_PASSWORD>")
        print("  OR set the complete DATABASE_URL with your password in backend/.env")
        print("  OR execute backend/setup.sql directly in the Supabase Dashboard SQL Editor:")
        print("  https://supabase.com/dashboard/project/txpnsrgwumiofxsrkbyt/sql/new\n")
        sys.exit(1)

    print(f"Connecting to Supabase database...")
    try:
        conn_params = parse_database_url(db_url)
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE

        conn = pg8000.native.Connection(
            user=conn_params["user"],
            password=conn_params["password"],
            host=conn_params["host"],
            port=conn_params["port"],
            database=conn_params["database"],
            ssl_context=ssl_ctx
        )
        print("Connected successfully to Supabase!")

        with open(sql_file, "r", encoding="utf-8") as f:
            sql_script = f.read()

        print(f"Applying schema from {sql_file}...")
        # Execute script
        conn.run(sql_script)
        print("Schema successfully pushed to Supabase database!")
        print("Created tables: users, plots, advisories with RLS policies and indexes.")
        conn.close()

    except Exception as e:
        print(f"Error pushing schema to Supabase: {e}")
        print("\nTip: If your password contains special characters, ensure it is URL-encoded,")
        print("or run backend/setup.sql directly in the Supabase SQL editor:")
        print("https://supabase.com/dashboard/project/txpnsrgwumiofxsrkbyt/sql/new")
        sys.exit(1)

if __name__ == "__main__":
    main()

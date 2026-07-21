import os
import psycopg
from psycopg.rows import dict_row
from contextlib import contextmanager
from pathlib import Path
from alembic.config import Config
from alembic import command

# Load DATABASE_URL from environment, fallback to local dev postgres container port
DATABASE_URL = os.environ.get(
    "DATABASE_URL", 
    "postgresql://postgres:postgres@localhost:5432/studio"
)

# Reference Schema for initial migration (SQLite equivalent)
SCHEMA = """
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    initials TEXT NOT NULL,
    project TEXT NOT NULL,
    area TEXT NOT NULL,
    style TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Lead',
    created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS')),
    photos INTEGER NOT NULL DEFAULT 0,
    photos_paths TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    budget TEXT NOT NULL DEFAULT '—',
    msg TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    cat TEXT NOT NULL,
    sub TEXT NOT NULL,
    loc TEXT NOT NULL,
    img TEXT NOT NULL,
    live INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    n TEXT NOT NULL,
    t TEXT NOT NULL,
    d TEXT NOT NULL,
    tag TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    desc TEXT NOT NULL DEFAULT '',
    price_per_meter INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
);
"""

def get_conn():
    """Establish a connection to the PostgreSQL database."""
    conn = psycopg.connect(DATABASE_URL, row_factory=dict_row)
    return conn

@contextmanager
def db_cursor():
    """Provide a transactional cursor context manager."""
    conn = get_conn()
    try:
        cur = conn.cursor()
        yield cur
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def init_db():
    """Programmatically run Alembic migrations on startup."""
    backend_dir = Path(__file__).parent.resolve()
    alembic_ini_path = backend_dir / "alembic.ini"
    
    if alembic_ini_path.exists():
        print("Running database migrations via Alembic...")
        cfg = Config(str(alembic_ini_path))
        cfg.set_main_option("sqlalchemy.url", DATABASE_URL)
        command.upgrade(cfg, "head")
        print("Migrations complete.")
    else:
        print("Alembic configuration not found. Skipping programmatic migration step.")

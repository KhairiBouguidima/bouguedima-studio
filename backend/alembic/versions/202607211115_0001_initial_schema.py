"""Initial Schema

Revision ID: 0001
Revises: 
Create Date: 2026-07-21 11:15:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create leads table
    op.execute("""
    CREATE TABLE leads (
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
    """)

    # Create projects table
    op.execute("""
    CREATE TABLE projects (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        cat TEXT NOT NULL,
        sub TEXT NOT NULL,
        loc TEXT NOT NULL,
        img TEXT NOT NULL,
        live INTEGER NOT NULL DEFAULT 1
    );
    """)

    # Create admin_users table
    op.execute("""
    CREATE TABLE admin_users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL
    );
    """)

    # Create services table
    op.execute("""
    CREATE TABLE services (
        id SERIAL PRIMARY KEY,
        n TEXT NOT NULL,
        t TEXT NOT NULL,
        d TEXT NOT NULL,
        tag TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
    );
    """)

    # Create categories table
    op.execute("""
    CREATE TABLE categories (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        desc TEXT NOT NULL DEFAULT '',
        price_per_meter INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0
    );
    """)

def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS categories;")
    op.execute("DROP TABLE IF EXISTS services;")
    op.execute("DROP TABLE IF EXISTS admin_users;")
    op.execute("DROP TABLE IF EXISTS projects;")
    op.execute("DROP TABLE IF EXISTS leads;")

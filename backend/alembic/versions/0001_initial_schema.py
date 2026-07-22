"""Create the initial application schema.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-07-22
"""

from alembic import op


revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.execute("""
        CREATE TABLE IF NOT EXISTS admin_users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS leads (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            initials TEXT NOT NULL,
            project TEXT NOT NULL,
            area TEXT NOT NULL,
            style TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Lead',
            created_at TEXT NOT NULL,
            photos INTEGER NOT NULL DEFAULT 0,
            photos_paths TEXT NOT NULL DEFAULT '',
            location TEXT NOT NULL DEFAULT '',
            budget TEXT NOT NULL DEFAULT '—',
            msg TEXT NOT NULL DEFAULT '',
            email TEXT NOT NULL DEFAULT '',
            phone TEXT NOT NULL DEFAULT ''
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            cat TEXT NOT NULL,
            sub TEXT NOT NULL,
            loc TEXT NOT NULL,
            img TEXT NOT NULL,
            live INTEGER NOT NULL DEFAULT 1
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS services (
            id SERIAL PRIMARY KEY,
            n TEXT NOT NULL,
            t TEXT NOT NULL,
            d TEXT NOT NULL,
            tag TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            "desc" TEXT NOT NULL DEFAULT '',
            price_per_meter INTEGER NOT NULL DEFAULT 0,
            sort_order INTEGER NOT NULL DEFAULT 0
        )
    """)


def downgrade() -> None:
    op.execute("""
        DROP TABLE categories;
        DROP TABLE services;
        DROP TABLE projects;
        DROP TABLE leads;
        DROP TABLE admin_users;
    """)

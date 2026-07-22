"""add admin_users table

Revision ID: aea2351cbccf
Revises: 0001_initial_schema
Create Date: 2026-07-22 11:38:40.568565

"""
from alembic import op

revision = "xxxx_add_admin_users_table"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        CREATE TABLE IF NOT EXISTS admin_users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL
        );
    """)


def downgrade():
    op.execute("""
        DROP TABLE IF EXISTS admin_users;
    """)
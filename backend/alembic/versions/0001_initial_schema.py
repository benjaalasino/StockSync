"""add clients table and client_id to sales

Revision ID: 0002
Revises: 7b37ff3ebbc0
Create Date: 2026-05-25
"""

import sqlalchemy as sa

from alembic import op

revision = "0002"
down_revision = "7b37ff3ebbc0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "clients",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("address", sa.String(), nullable=True),
        sa.Column("notes", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_clients_id", "clients", ["id"])
    op.create_index("ix_clients_email", "clients", ["email"])

    op.add_column(
        "sales",
        sa.Column("client_id", sa.Integer(), sa.ForeignKey("clients.id"), nullable=True),
    )
    op.create_index("ix_sales_client_id", "sales", ["client_id"])


def downgrade() -> None:
    op.drop_index("ix_sales_client_id", table_name="sales")
    op.drop_column("sales", "client_id")
    op.drop_index("ix_clients_email", table_name="clients")
    op.drop_index("ix_clients_id", table_name="clients")
    op.drop_table("clients")

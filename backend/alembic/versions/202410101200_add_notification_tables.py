"""add notification tables

Revision ID: 202410101200
Revises: 
Create Date: 2024-10-10 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "202410101200"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("type", sa.String(length=64), nullable=False),
        sa.Column("channel", sa.String(length=32), nullable=False, server_default="in_app"),
        sa.Column("severity", sa.String(length=32), nullable=False, server_default="info"),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("action_url", sa.String(length=500), nullable=True),
        sa.Column("data", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("read_at", sa.DateTime(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])
    op.create_index("ix_notifications_unread", "notifications", ["user_id", "is_read"])

    op.create_table(
        "notification_preferences",
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("ai_analysis", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("project_status", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("document_events", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("workflow_updates", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("email_digest", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("user_id"),
    )


def downgrade() -> None:
    op.drop_table("notification_preferences")
    op.drop_index("ix_notifications_unread", table_name="notifications")
    op.drop_index("ix_notifications_user_id", table_name="notifications")
    op.drop_table("notifications")

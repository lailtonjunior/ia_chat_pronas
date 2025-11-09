"""Phase 1 foundations

Revision ID: 202410101400
Revises: 202410101200
Create Date: 2024-10-10 14:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "202410101400"
down_revision = "202410101200"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "notifications",
        sa.Column(
            "status",
            sa.String(length=32),
            nullable=False,
            server_default="pending",
        ),
    )
    op.add_column(
        "notification_preferences",
        sa.Column("email_on_submission", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.add_column(
        "notification_preferences",
        sa.Column("email_on_approval", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )

    op.add_column("users", sa.Column("is_2fa_enabled", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.add_column("users", sa.Column("otp_secret", sa.String(length=32), nullable=True))

    op.add_column(
        "projects",
        sa.Column("submission_status", sa.String(length=32), nullable=False, server_default="pending"),
    )
    op.add_column("projects", sa.Column("submission_id", sa.String(length=200), nullable=True))

    op.create_table(
        "project_comments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "approval_steps",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE")),
        sa.Column("approver_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("step_name", sa.String(length=200), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("order", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("decision_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "generated_reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE")),
        sa.Column("format", sa.String(length=16), nullable=False, server_default="pdf"),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="pending"),
        sa.Column("file_url", sa.String(length=1000)),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("action", sa.String(length=200), nullable=False),
        sa.Column("target_model", sa.String(length=200), nullable=False),
        sa.Column("target_id", sa.String(length=200), nullable=False),
        sa.Column("details", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("generated_reports")
    op.drop_table("approval_steps")
    op.drop_table("project_comments")
    op.drop_column("projects", "submission_id")
    op.drop_column("projects", "submission_status")
    op.drop_column("users", "otp_secret")
    op.drop_column("users", "is_2fa_enabled")
    op.drop_column("notification_preferences", "email_on_approval")
    op.drop_column("notification_preferences", "email_on_submission")
    op.drop_column("notifications", "status")

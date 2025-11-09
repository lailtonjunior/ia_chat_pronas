"""
Exports dos models para Alembic
"""

from app.db.database import Base
from app.models.user import User
from app.models.project import Project, ProjectStatus, ProjectType, SubmissionStatus
from app.models.document import Document
from app.models.ai_analysis import AIAnalysis, AIProvider, AnalysisType
from app.models.notification import (
    Notification,
    NotificationType,
    NotificationChannel,
    NotificationSeverity,
    NotificationStatus,
    NotificationPreference,
)
from app.models.project_comment import ProjectComment
from app.models.approval_step import ApprovalStep, ApprovalStatus
from app.models.generated_report import GeneratedReport, ReportFormat, ReportStatus
from app.models.audit_log import AuditLog

__all__ = [
    "Base",
    "User",
    "Project",
    "ProjectStatus",
    "ProjectType",
    "SubmissionStatus",
    "Document",
    "AIAnalysis",
    "AIProvider",
    "AnalysisType",
    "Notification",
    "NotificationType",
    "NotificationChannel",
    "NotificationSeverity",
    "NotificationStatus",
    "NotificationPreference",
    "ProjectComment",
    "ApprovalStep",
    "ApprovalStatus",
    "GeneratedReport",
    "ReportFormat",
    "ReportStatus",
    "AuditLog",
]

"""
Exports dos models para Alembic
"""

# Importar Base primeiro
from app.db.database import Base

# Importar todos os models
from app.models.user import User
from app.models.project import Project, ProjectStatus, ProjectType
from app.models.document import Document
from app.models.ai_analysis import AIAnalysis, AIProvider, AnalysisType
from app.models.notification import (
    Notification,
    NotificationType,
    NotificationChannel,
    NotificationSeverity,
    NotificationPreference,
)

# Garantir que o Base.metadata tenha todos os models
__all__ = [
    "Base",
    "User",
    "Project",
    "ProjectStatus",
    "ProjectType",
    "Document",
    "AIAnalysis",
    "AIProvider",
    "AnalysisType",
    "Notification",
    "NotificationType",
    "NotificationChannel",
    "NotificationSeverity",
    "NotificationPreference",
]

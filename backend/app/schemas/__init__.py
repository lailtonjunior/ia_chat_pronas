"""
Exports dos schemas
"""

from app.schemas.user import UserResponse, GoogleLoginResponse
from app.schemas.project import ProjectResponse, ProjectListResponse
from app.schemas.document import DocumentResponse, DocumentUploadResponse
from app.schemas.analysis import AIAnalysisResponse, ChatResponse
from app.schemas.notification import (
    NotificationResponse,
    NotificationListResponse,
    NotificationPreferenceResponse,
    NotificationPreferenceUpdate,
)

__all__ = [
    "UserResponse",
    "GoogleLoginResponse",
    "ProjectResponse",
    "ProjectListResponse",
    "DocumentResponse",
    "DocumentUploadResponse",
    "AIAnalysisResponse",
    "ChatResponse",
    "NotificationResponse",
    "NotificationListResponse",
    "NotificationPreferenceResponse",
    "NotificationPreferenceUpdate",
]

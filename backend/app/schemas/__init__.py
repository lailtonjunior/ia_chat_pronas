"""
Exports dos schemas
"""

from app.schemas.user import UserResponse, GoogleLoginResponse
from app.schemas.project import ProjectResponse, ProjectListResponse
from app.schemas.document import DocumentResponse, DocumentUploadResponse
from app.schemas.analysis import AIAnalysisResponse, ChatResponse

__all__ = [
    "UserResponse",
    "GoogleLoginResponse",
    "ProjectResponse",
    "ProjectListResponse",
    "DocumentResponse",
    "DocumentUploadResponse",
    "AIAnalysisResponse",
    "ChatResponse",
]

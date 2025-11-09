"""
Exports dos schemas
"""

from app.schemas.user import UserResponse, GoogleLoginResponse
from app.schemas.project import ProjectResponse, ProjectListResponse
from app.schemas.document import DocumentResponse, DocumentUploadResponse
from app.schemas.analysis import AIAnalysisResponse, ChatResponse
from app.schemas.workflow import (
    ProjectCommentCreate,
    ProjectCommentResponse,
    ApprovalStepResponse,
    WorkflowSummary,
    SubmitForReviewRequest,
    ApprovalActionRequest,
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
    "ProjectCommentCreate",
    "ProjectCommentResponse",
    "ApprovalStepResponse",
    "WorkflowSummary",
    "SubmitForReviewRequest",
    "ApprovalActionRequest",
]

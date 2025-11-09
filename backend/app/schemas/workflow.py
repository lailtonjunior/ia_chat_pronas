"""
Schemas para workflow de aprovação e comentários
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field


class ProjectCommentCreate(BaseModel):
    content: str = Field(..., min_length=3, max_length=4000)


class ProjectCommentResponse(BaseModel):
    id: UUID
    project_id: UUID
    user_id: UUID
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ApprovalStepResponse(BaseModel):
    id: UUID
    project_id: UUID
    step_name: str
    status: str
    order: int
    comment: Optional[str]
    decision_at: Optional[datetime]
    approver_id: Optional[UUID]

    class Config:
        from_attributes = True


class WorkflowSummary(BaseModel):
    project_id: UUID
    status: str
    steps: List[ApprovalStepResponse]
    comments: List[ProjectCommentResponse]


class SubmitForReviewRequest(BaseModel):
    approver_ids: List[UUID]
    message: Optional[str] = None


class ApprovalActionRequest(BaseModel):
    comment: Optional[str] = None

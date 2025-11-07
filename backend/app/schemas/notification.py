"""
Schemas de notificações (API)
"""

from __future__ import annotations

from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID
from enum import Enum


class NotificationTypeEnum(str, Enum):
    AI_ANALYSIS_COMPLETED = "ai_analysis_completed"
    PROJECT_STATUS_UPDATED = "project_status_updated"
    DOCUMENT_IMPORTED = "document_imported"
    WORKFLOW_EVENT = "workflow_event"
    SYSTEM_ALERT = "system_alert"


class NotificationSeverityEnum(str, Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    CRITICAL = "critical"


class NotificationChannelEnum(str, Enum):
    IN_APP = "in_app"
    EMAIL = "email"


class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    type: NotificationTypeEnum
    severity: NotificationSeverityEnum
    channel: NotificationChannelEnum
    title: str
    message: str
    action_url: Optional[str]
    data: Optional[Dict[str, Any]] = None
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    total: int
    unread_count: int
    page: int
    per_page: int


class NotificationPreferenceResponse(BaseModel):
    ai_analysis: bool = True
    project_status: bool = True
    document_events: bool = True
    workflow_updates: bool = True
    email_digest: bool = False

    class Config:
        from_attributes = True


class NotificationPreferenceUpdate(BaseModel):
    ai_analysis: Optional[bool] = None
    project_status: Optional[bool] = None
    document_events: Optional[bool] = None
    workflow_updates: Optional[bool] = None
    email_digest: Optional[bool] = None

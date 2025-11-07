"""
Modelos de Notificações do Sistema
"""

from __future__ import annotations

from sqlalchemy import (
    Column,
    String,
    Text,
    Boolean,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid

from app.db.database import Base


class NotificationChannel(str, enum.Enum):
    """Canais suportados para envio de notificações"""

    IN_APP = "in_app"
    EMAIL = "email"


class NotificationSeverity(str, enum.Enum):
    """Severidade visual da notificação"""

    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    CRITICAL = "critical"


class NotificationType(str, enum.Enum):
    """Tipos de eventos suportados"""

    AI_ANALYSIS_COMPLETED = "ai_analysis_completed"
    PROJECT_STATUS_UPDATED = "project_status_updated"
    DOCUMENT_IMPORTED = "document_imported"
    WORKFLOW_EVENT = "workflow_event"
    SYSTEM_ALERT = "system_alert"


class Notification(Base):
    """Notificação entregue para um usuário"""

    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    type = Column(
        SQLEnum(NotificationType, native_enum=False, validate_strings=True),
        nullable=False,
    )
    channel = Column(
        SQLEnum(NotificationChannel, native_enum=False, validate_strings=True),
        default=NotificationChannel.IN_APP,
        nullable=False,
    )
    severity = Column(
        SQLEnum(NotificationSeverity, native_enum=False, validate_strings=True),
        default=NotificationSeverity.INFO,
        nullable=False,
    )
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    action_url = Column(String(500), nullable=True)
    data = Column(JSONB, nullable=True)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    user = relationship("User", backref="notifications")

    def mark_as_read(self):
        self.is_read = True
        self.read_at = datetime.utcnow()

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "type": self.type.value,
            "channel": self.channel.value,
            "severity": self.severity.value,
            "title": self.title,
            "message": self.message,
            "action_url": self.action_url,
            "data": self.data,
            "is_read": self.is_read,
            "read_at": self.read_at.isoformat() if self.read_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class NotificationPreference(Base):
    """Preferências de notificações por usuário"""

    __tablename__ = "notification_preferences"

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    ai_analysis = Column(Boolean, default=True, nullable=False)
    project_status = Column(Boolean, default=True, nullable=False)
    document_events = Column(Boolean, default=True, nullable=False)
    workflow_updates = Column(Boolean, default=True, nullable=False)
    email_digest = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    user = relationship("User", backref="notification_preferences")

    def to_dict(self) -> dict:
        return {
            "user_id": str(self.user_id),
            "ai_analysis": self.ai_analysis,
            "project_status": self.project_status,
            "document_events": self.document_events,
            "workflow_updates": self.workflow_updates,
            "email_digest": self.email_digest,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

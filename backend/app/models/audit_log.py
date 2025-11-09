"""
Modelo de auditoria
"""

from __future__ import annotations

from datetime import datetime
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.db.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(200), nullable=False)
    target_model = Column(String(200), nullable=False)
    target_id = Column(String(200), nullable=False)
    details = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User")

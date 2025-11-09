"""
Etapas do workflow de aprovação
"""

from __future__ import annotations

from datetime import datetime
import enum
import uuid

from sqlalchemy import Column, DateTime, Enum as SQLEnum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ApprovalStep(Base):
    __tablename__ = "approval_steps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    approver_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    step_name = Column(String(200), nullable=False)
    status = Column(
        SQLEnum(ApprovalStatus, native_enum=False, validate_strings=True),
        default=ApprovalStatus.PENDING,
        nullable=False,
    )
    order = Column(Integer, default=1, nullable=False)
    comment = Column(Text, nullable=True)
    decision_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="approval_steps")
    approver = relationship("User", back_populates="approval_steps")

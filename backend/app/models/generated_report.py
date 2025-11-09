"""
Relatórios exportados
"""

from __future__ import annotations

from datetime import datetime
import enum
import uuid

from sqlalchemy import Column, DateTime, Enum as SQLEnum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class ReportFormat(str, enum.Enum):
    PDF = "pdf"
    DOCX = "docx"


class ReportStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class GeneratedReport(Base):
    __tablename__ = "generated_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    format = Column(
        SQLEnum(ReportFormat, native_enum=False, validate_strings=True),
        default=ReportFormat.PDF,
        nullable=False,
    )
    status = Column(
        SQLEnum(ReportStatus, native_enum=False, validate_strings=True),
        default=ReportStatus.PENDING,
        nullable=False,
    )
    file_url = Column(String(1000), nullable=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="reports")

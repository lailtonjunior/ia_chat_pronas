"""
Model de Projeto PRONAS/PCD
"""

from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Integer, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.db.database import Base

class ProjectStatus(str, enum.Enum):
    """Status possíveis do projeto"""
    DRAFT = "draft"
    IN_ANALYSIS = "in_analysis"
    REVIEWED = "reviewed"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUBMITTED = "submitted"

class ProjectType(str, enum.Enum):
    """Tipos de projeto"""
    PRONAS = "PRONAS"
    PCD = "PCD"

class Project(Base):
    __tablename__ = "projects"
    
    # Identificação
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Informações básicas
    title = Column(String(500), nullable=False)
    description = Column(Text)
    project_type = Column(
        SQLEnum(ProjectType, native_enum=False, validate_strings=True),
        default=ProjectType.PRONAS
    )
    status = Column(
        SQLEnum(ProjectStatus, native_enum=False, validate_strings=True),
        default=ProjectStatus.DRAFT
    )
    
    # Instituição proponente
    institution_name = Column(String(500))
    institution_cnpj = Column(String(18))
    institution_address = Column(Text)
    
    # Estrutura PRONAS/PCD - Anexos
    annex_1 = Column(JSONB)  # Identificação do projeto
    annex_2 = Column(JSONB)  # Justificativa
    annex_3 = Column(JSONB)  # Formulário principal do projeto
    annex_4 = Column(JSONB)  # Declaração de Responsabilidade
    annex_5 = Column(JSONB)  # Declaração de Capacidade Técnico-Operativa
    annex_6 = Column(JSONB)  # Orçamento do projeto
    annex_7 = Column(JSONB)  # Informações Complementares
    
    # Conteúdo do projeto
    content = Column(JSONB)  # Estrutura completa do documento
    
    # Análises de IA
    openai_analysis = Column(JSONB)  # Análise do modelo fine-tuned
    gemini_analysis = Column(JSONB)  # Análise do Gemini
    combined_score = Column(Integer, default=0)  # Score de 0-100
    
    # Metadados
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    analyzed_at = Column(DateTime, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    
    # Relacionamentos
    user = relationship("User", back_populates="projects")
    documents = relationship("Document", back_populates="project", cascade="all, delete-orphan")
    ai_analyses = relationship("AIAnalysis", back_populates="project", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Project {self.title[:50]}... ({self.status.value})>"
    
    def to_dict(self):
        """Converte para dicionário"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "title": self.title,
            "description": self.description,
            "project_type": self.project_type.value,
            "status": self.status.value,
            "institution_name": self.institution_name,
            "institution_cnpj": self.institution_cnpj,
            "combined_score": self.combined_score,
            "version": self.version,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "analyzed_at": self.analyzed_at.isoformat() if self.analyzed_at else None,
        }

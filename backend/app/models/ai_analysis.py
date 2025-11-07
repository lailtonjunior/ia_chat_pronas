"""
Model de Análise de IA
Armazena resultados de análises do OpenAI e Gemini
"""

from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Integer, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.db.database import Base

class AIProvider(str, enum.Enum):
    """Provedor de IA"""
    OPENAI = "openai"
    GEMINI = "gemini"
    COMBINED = "combined"

class AnalysisType(str, enum.Enum):
    """Tipo de análise"""
    FULL_PROJECT = "full_project"
    SECTION = "section"
    SUGGESTION = "suggestion"
    VALIDATION = "validation"

class AIAnalysis(Base):
    __tablename__ = "ai_analyses"
    
    # Identificação
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    # Tipo de análise
    provider = Column(
        SQLEnum(AIProvider, native_enum=False, validate_strings=True),
        nullable=False
    )
    analysis_type = Column(
        SQLEnum(AnalysisType, native_enum=False, validate_strings=True),
        nullable=False
    )
    
    # Resultado da análise
    result = Column(JSONB, nullable=False)
    score = Column(Integer, default=0)  # 0-100
    
    # Detalhes
    section_analyzed = Column(String(200), nullable=True)  # Seção específica analisada
    tokens_used = Column(Integer, default=0)
    processing_time = Column(Integer, default=0)  # milissegundos
    
    # Sugestões e problemas
    suggestions = Column(JSONB)  # Lista de sugestões
    critical_issues = Column(JSONB)  # Lista de problemas críticos
    warnings = Column(JSONB)  # Lista de avisos
    
    # Metadados
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relacionamentos
    project = relationship("Project", back_populates="ai_analyses")
    
    def __repr__(self):
        return f"<AIAnalysis {self.provider.value} - {self.analysis_type.value}>"
    
    def to_dict(self):
        """Converte para dicionário"""
        return {
            "id": str(self.id),
            "project_id": str(self.project_id),
            "provider": self.provider.value,
            "analysis_type": self.analysis_type.value,
            "score": self.score,
            "result": self.result,
            "suggestions": self.suggestions,
            "critical_issues": self.critical_issues,
            "warnings": self.warnings,
            "tokens_used": self.tokens_used,
            "processing_time": self.processing_time,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

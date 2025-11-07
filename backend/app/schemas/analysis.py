"""
Schemas Pydantic para Análise de IA
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID
from enum import Enum

class AIProviderEnum(str, Enum):
    OPENAI = "openai"
    GEMINI = "gemini"
    COMBINED = "combined"

class AnalysisTypeEnum(str, Enum):
    FULL_PROJECT = "full_project"
    SECTION = "section"
    SUGGESTION = "suggestion"
    VALIDATION = "validation"

class Suggestion(BaseModel):
    """Sugestão de melhoria"""
    section: str
    original_text: str
    suggested_text: str
    reason: str
    priority: str  # high, medium, low

class CriticalIssue(BaseModel):
    """Problema crítico"""
    section: str
    issue: str
    severity: str  # critical, high, medium
    solution: str

class AnalysisResult(BaseModel):
    """Resultado de análise"""
    score: int = Field(..., ge=0, le=100)
    summary: str
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[Suggestion]
    critical_issues: List[CriticalIssue]
    compliance: Dict[str, Any]

class AIAnalysisRequest(BaseModel):
    """Request para análise de IA"""
    project_id: UUID
    provider: AIProviderEnum = AIProviderEnum.COMBINED
    analysis_type: AnalysisTypeEnum = AnalysisTypeEnum.FULL_PROJECT
    section: Optional[str] = None

class AIAnalysisResponse(BaseModel):
    """Resposta de análise de IA"""
    id: UUID
    project_id: UUID
    provider: str
    analysis_type: str
    score: int
    result: Dict[str, Any]
    suggestions: Optional[List[Dict[str, Any]]]
    critical_issues: Optional[List[Dict[str, Any]]]
    warnings: Optional[List[Dict[str, Any]]]
    tokens_used: int
    processing_time: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ChatMessage(BaseModel):
    """Mensagem do chat"""
    role: str  # user, assistant
    content: str
    timestamp: Optional[datetime] = None

class ChatRequest(BaseModel):
    """Request para chat com IA"""
    project_id: UUID
    message: str
    conversation_history: Optional[List[ChatMessage]] = Field(default_factory=list)
    provider: AIProviderEnum = AIProviderEnum.OPENAI

class ChatResponse(BaseModel):
    """Resposta do chat"""
    message: str
    suggestions: Optional[List[str]] = None
    references: Optional[List[str]] = None


class SuggestionRequest(BaseModel):
    """Request para sugestões assistidas."""
    project_id: UUID
    section: Optional[str] = None
    selected_text: str
    improvement_type: Optional[str] = "general"


class SuggestionResponse(BaseModel):
    project_id: Optional[UUID] = None
    section: str
    original_text: str
    suggested_text: str
    improvement_type: Optional[str] = None

"""
Schemas Pydantic para Projeto
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID
from enum import Enum

class ProjectTypeEnum(str, Enum):
    PRONAS = "PRONAS"
    PCD = "PCD"

class ProjectStatusEnum(str, Enum):
    DRAFT = "draft"
    IN_ANALYSIS = "in_analysis"
    REVIEWED = "reviewed"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUBMITTED = "submitted"

class ProjectCreate(BaseModel):
    """Schema para criar projeto"""
    title: str = Field(..., min_length=5, max_length=500)
    description: Optional[str] = None
    project_type: ProjectTypeEnum = ProjectTypeEnum.PRONAS
    institution_name: Optional[str] = None
    institution_cnpj: Optional[str] = None
    institution_address: Optional[str] = None

class ProjectUpdate(BaseModel):
    """Schema para atualizar projeto"""
    title: Optional[str] = Field(None, min_length=5, max_length=500)
    description: Optional[str] = None
    status: Optional[ProjectStatusEnum] = None
    institution_name: Optional[str] = None
    institution_cnpj: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    annex_3: Optional[Dict[str, Any]] = None
    annex_4: Optional[Dict[str, Any]] = None
    annex_5: Optional[Dict[str, Any]] = None
    annex_6: Optional[Dict[str, Any]] = None
    annex_7: Optional[Dict[str, Any]] = None

class ProjectResponse(BaseModel):
    """Schema de resposta de projeto"""
    id: UUID
    user_id: UUID
    title: str
    description: Optional[str]
    project_type: str
    status: str
    institution_name: Optional[str]
    institution_cnpj: Optional[str]
    combined_score: int
    version: int
    created_at: datetime
    updated_at: datetime
    analyzed_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class ProjectDetailResponse(ProjectResponse):
    """Schema detalhado de projeto"""
    content: Optional[Dict[str, Any]]
    annex_3: Optional[Dict[str, Any]]
    annex_4: Optional[Dict[str, Any]]
    annex_5: Optional[Dict[str, Any]]
    annex_6: Optional[Dict[str, Any]]
    annex_7: Optional[Dict[str, Any]]
    openai_analysis: Optional[Dict[str, Any]]
    gemini_analysis: Optional[Dict[str, Any]]

class ProjectListResponse(BaseModel):
    """Lista de projetos"""
    projects: List[ProjectResponse]
    total: int
    page: int
    per_page: int

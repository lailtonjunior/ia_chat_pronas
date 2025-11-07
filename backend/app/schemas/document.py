"""
Schemas Pydantic para Documento
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class DocumentUploadResponse(BaseModel):
    """Resposta de upload de documento"""
    id: UUID
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    created_at: datetime
    message: str

class DocumentResponse(BaseModel):
    """Schema de resposta de documento"""
    id: UUID
    user_id: UUID
    project_id: Optional[UUID]
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    is_processed: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class PDFAnalysisRequest(BaseModel):
    """Request para análise de PDF"""
    document_id: UUID
    analyze_with_openai: bool = True
    analyze_with_gemini: bool = True
    create_project: bool = True

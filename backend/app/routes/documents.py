"""
Rotas de Documentos e Upload de Arquivos
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import Optional
from pathlib import Path
import logging
import os
import shutil
from datetime import datetime

from app.db.database import get_db
from app.models.document import Document
from app.models.project import Project
from app.models.user import User
from app.schemas.document import DocumentUploadResponse, DocumentResponse, PDFAnalysisRequest
from app.middleware.auth import get_current_user
from app.services.pdf_processor import PDFProcessor
from app.services.openai_service import OpenAIService
from app.services.gemini_service import GeminiService
from app.services.notification_service import NotificationService
from app.models.notification import NotificationType, NotificationSeverity
from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    project_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload de arquivo (PDF, DOCX, etc)
    """
    try:
        # Validar tipo de arquivo
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nome do arquivo não fornecido"
            )
        
        file_extension = Path(file.filename).suffix.lower().strip('.')
        if file_extension not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tipo de arquivo não permitido. Permitidos: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )
        
        # Validar tamanho
        file_content = await file.read()
        file_size = len(file_content)
        
        if file_size > settings.UPLOAD_MAX_SIZE:
            max_mb = settings.UPLOAD_MAX_SIZE / (1024 * 1024)
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Arquivo muito grande. Máximo: {max_mb:.0f}MB"
            )
        
        # Criar nome único para o arquivo
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_filename = f"{current_user.id}_{timestamp}_{file.filename}"
        
        # Salvar arquivo
        upload_path = Path(settings.UPLOAD_PATH) / file_extension
        upload_path.mkdir(parents=True, exist_ok=True)
        
        file_path = upload_path / unique_filename
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # Criar registro no banco
        document = Document(
            user_id=current_user.id,
            project_id=project_id,
            filename=unique_filename,
            original_filename=file.filename,
            file_path=str(file_path),
            file_type=file_extension,
            file_size=file_size,
            mime_type=file.content_type
        )
        
        db.add(document)
        await db.commit()
        await db.refresh(document)
        
        logger.info(f"✅ Arquivo enviado: {file.filename} (ID: {document.id})")
        
        return DocumentUploadResponse(
            id=document.id,
            filename=document.filename,
            original_filename=document.original_filename,
            file_type=document.file_type,
            file_size=document.file_size,
            created_at=document.created_at,
            message="Arquivo enviado com sucesso"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao fazer upload: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao fazer upload: {str(e)}"
        )

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obter informações de um documento
    """
    try:
        result = await db.execute(
            select(Document).where(
                Document.id == document_id,
                Document.user_id == current_user.id
            )
        )
        document = result.scalar_one_or_none()
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Documento não encontrado"
            )
        
        return DocumentResponse.model_validate(document)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao buscar documento: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar documento: {str(e)}"
        )

@router.post("/{document_id}/analyze")
async def analyze_document(
    document_id: UUID,
    create_project: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analisar PDF com OpenAI e Gemini
    """
    try:
        # Buscar documento
        result = await db.execute(
            select(Document).where(
                Document.id == document_id,
                Document.user_id == current_user.id
            )
        )
        document = result.scalar_one_or_none()
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Documento não encontrado"
            )
        
        # Processar PDF
        pdf_processor = PDFProcessor()
        extracted_text = pdf_processor.extract_text_from_pdf(document.file_path)
        
        if not extracted_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não foi possível extrair texto do PDF"
            )
        
        # Analisar com OpenAI (modelo fine-tuned)
        openai_service = OpenAIService()
        openai_analysis = await openai_service.analyze_project(extracted_text)
        
        # Analisar com Gemini
        gemini_service = GeminiService()
        gemini_analysis = await gemini_service.analyze_pdf(document.file_path)
        
        # Criar projeto se solicitado
        project = None
        if create_project:
            from app.models.project import Project, ProjectStatus
            
            # Extrair título do PDF
            title = document.original_filename.replace('.pdf', '')[:100]
            
            project = Project(
                user_id=current_user.id,
                title=title,
                description=f"Importado de {document.original_filename}",
                status=ProjectStatus.IN_ANALYSIS,
                content={"text": extracted_text[:5000]},  # Primeiros 5000 caracteres
                openai_analysis=openai_analysis,
                gemini_analysis=gemini_analysis
            )
            
            # Calcular score combinado
            openai_score = openai_analysis.get("score", 0)
            gemini_score = gemini_analysis.get("score", 0)
            project.combined_score = (openai_score + gemini_score) // 2
            
            db.add(project)
        
        # Atualizar documento
        document.is_processed = 1
        document.extracted_text = extracted_text
        document.processed_at = datetime.utcnow()
        
        if project:
            document.project_id = project.id
        
        await db.commit()
        if project:
            await db.refresh(project)
        
        logger.info(f"✅ Documento analisado: {document_id}")

        notification_message = (
            f"O documento \"{document.original_filename}\" foi importado e analisado."
        )
        notification_data = {
            "document_id": str(document.id),
            "project_id": str(project.id) if project else None,
            "create_project": create_project,
        }

        await NotificationService.create_notification(
            db,
            user_id=current_user.id,
            title="Importação concluída",
            message=notification_message,
            notification_type=NotificationType.DOCUMENT_IMPORTED,
            severity=NotificationSeverity.INFO,
            data=notification_data,
            action_url=f"/dashboard/projects/{project.id}" if project else None,
        )
        
        return {
            "message": "Análise concluída com sucesso",
            "document_id": str(document_id),
            "project_id": str(project.id) if project else None,
            "openai_analysis": openai_analysis,
            "gemini_analysis": gemini_analysis,
            "extracted_text_length": len(extracted_text)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao analisar documento: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao analisar documento: {str(e)}"
        )

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletar documento
    """
    try:
        result = await db.execute(
            select(Document).where(
                Document.id == document_id,
                Document.user_id == current_user.id
            )
        )
        document = result.scalar_one_or_none()
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Documento não encontrado"
            )
        
        # Deletar arquivo
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
        
        # Deletar registro
        await db.delete(document)
        await db.commit()
        
        logger.info(f"✅ Documento deletado: {document_id}")
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao deletar documento: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao deletar documento: {str(e)}"
        )

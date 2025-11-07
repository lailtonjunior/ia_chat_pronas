"""
Rotas de Análise de IA
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List
import logging

from app.db.database import get_db
from app.models.project import Project
from app.models.ai_analysis import AIAnalysis, AIProvider, AnalysisType
from app.models.notification import NotificationType, NotificationSeverity
from app.models.user import User
from app.schemas.analysis import (
    AIAnalysisRequest,
    AIAnalysisResponse,
    ChatRequest,
    ChatResponse,
    SuggestionRequest,
    SuggestionResponse,
)
from app.middleware.auth import get_current_user
from app.services.openai_service import OpenAIService
from app.services.gemini_service import GeminiService
from app.services.suggestion_service import SuggestionService
from app.services.notification_service import NotificationService

router = APIRouter()
logger = logging.getLogger(__name__)

suggestion_service = SuggestionService()

@router.post("/analyze-full", response_model=AIAnalysisResponse)
async def analyze_full_project(
    analysis_request: AIAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Análise completa do projeto com IA
    """
    try:
        # Buscar projeto
        result = await db.execute(
            select(Project).where(
                Project.id == analysis_request.project_id,
                Project.user_id == current_user.id
            )
        )
        project = result.scalar_one_or_none()
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Projeto não encontrado"
            )
        
        # Preparar texto do projeto
        project_text = project.content.get("text", "") if project.content else ""
        if not project_text:
            project_text = project.description or project.title
        
        # Análise com OpenAI (modelo fine-tuned)
        openai_service = OpenAIService()
        openai_result = await openai_service.analyze_project(project_text)
        
        # Análise com Gemini
        gemini_service = GeminiService()
        gemini_result = await gemini_service.analyze_text(project_text)
        
        # Combinar análises
        openai_score = openai_result.get("score", 0)
        gemini_score = gemini_result.get("score", 0)
        combined_score = (openai_score + gemini_score) // 2
        
        # Salvar no banco
        ai_analysis = AIAnalysis(
            project_id=project.id,
            provider=AIProvider.COMBINED,
            analysis_type=AnalysisType.FULL_PROJECT,
            result={
                "openai": openai_result,
                "gemini": gemini_result
            },
            score=combined_score,
            suggestions=openai_result.get("suggestions", []),
            critical_issues=openai_result.get("critical_issues", []),
            warnings=gemini_result.get("warnings", [])
        )
        
        # Atualizar projeto
        project.combined_score = combined_score
        project.openai_analysis = openai_result
        project.gemini_analysis = gemini_result
        
        db.add(ai_analysis)
        await db.commit()
        await db.refresh(ai_analysis)
        
        logger.info(f"✅ Análise completa realizada: Projeto {project.id}, Score: {combined_score}")

        await NotificationService.create_notification(
            db,
            user_id=current_user.id,
            title="Análise inteligente concluída",
            message=f"O projeto \"{project.title}\" recebeu uma nova análise combinada.",
            notification_type=NotificationType.AI_ANALYSIS_COMPLETED,
            severity=NotificationSeverity.SUCCESS,
            data={
                "project_id": str(project.id),
                "analysis_id": str(ai_analysis.id),
                "score": combined_score,
            },
            action_url=f"/dashboard/projects/{project.id}?tab=analysis",
        )
        
        return AIAnalysisResponse.model_validate(ai_analysis)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao analisar projeto: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao analisar projeto: {str(e)}"
        )

@router.post("/analyze-section")
async def analyze_section(
    project_id: UUID,
    section: str,
    content: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Análise de uma seção específica do projeto
    """
    try:
        # Buscar projeto
        result = await db.execute(
            select(Project).where(
                Project.id == project_id,
                Project.user_id == current_user.id
            )
        )
        project = result.scalar_one_or_none()
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Projeto não encontrado"
            )
        
        # Analisar com OpenAI
        openai_service = OpenAIService()
        analysis = await openai_service.analyze_section(
            section_name=section,
            section_content=content,
            project_context=project.description or ""
        )
        
        # Salvar análise
        ai_analysis = AIAnalysis(
            project_id=project.id,
            provider=AIProvider.OPENAI,
            analysis_type=AnalysisType.SECTION,
            section_analyzed=section,
            result=analysis,
            score=analysis.get("score", 0),
            suggestions=analysis.get("suggestions", []),
            critical_issues=analysis.get("critical_issues", [])
        )
        
        db.add(ai_analysis)
        await db.commit()
        await db.refresh(ai_analysis)
        
        logger.info(f"✅ Seção analisada: {section}")
        
        return AIAnalysisResponse.model_validate(ai_analysis)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao analisar seção: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao analisar seção: {str(e)}"
        )

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    chat_request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Chat com IA sobre o projeto
    """
    try:
        # Buscar projeto
        result = await db.execute(
            select(Project).where(
                Project.id == chat_request.project_id,
                Project.user_id == current_user.id
            )
        )
        project = result.scalar_one_or_none()
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Projeto não encontrado"
            )
        
        # Preparar contexto
        project_context = {
            "title": project.title,
            "description": project.description,
            "institution": project.institution_name,
            "content": project.content.get("text", "") if project.content else ""
        }
        
        # Usar OpenAI para chat
        openai_service = OpenAIService()
        response = await openai_service.chat_about_project(
            message=chat_request.message,
            project_context=project_context,
            conversation_history=chat_request.conversation_history
        )
        
        logger.info(f"✅ Chat respondido para projeto: {project.id}")
        
        return ChatResponse(
            message=response.get("message", ""),
            suggestions=response.get("suggestions"),
            references=response.get("references")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro no chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar chat: {str(e)}"
        )

@router.get("/project/{project_id}/analyses", response_model=List[AIAnalysisResponse])
async def get_project_analyses(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obter todas as análises de um projeto
    """
    try:
        # Verificar permissão
        result = await db.execute(
            select(Project).where(
                Project.id == project_id,
                Project.user_id == current_user.id
            )
        )
        project = result.scalar_one_or_none()
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Projeto não encontrado"
            )
        
        # Buscar análises
        result = await db.execute(
            select(AIAnalysis).where(
                AIAnalysis.project_id == project_id
            ).order_by(AIAnalysis.created_at.desc())
        )
        analyses = result.scalars().all()
        
        return [AIAnalysisResponse.model_validate(a) for a in analyses]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao buscar análises: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar análises: {str(e)}"
        )


@router.post("/suggestions", response_model=SuggestionResponse)
async def generate_ai_suggestion(
    suggestion_request: SuggestionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Gera sugestão textual com IA para um trecho selecionado."""

    try:
        result = await db.execute(
            select(Project).where(
                Project.id == suggestion_request.project_id,
                Project.user_id == current_user.id,
            )
        )
        project = result.scalar_one_or_none()

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Projeto não encontrado",
            )

        suggestion = await suggestion_service.generate_contextual_suggestion(
            project_title=project.title,
            section=suggestion_request.section,
            selected_text=suggestion_request.selected_text,
            improvement_type=suggestion_request.improvement_type,
        )

        return SuggestionResponse(**suggestion)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("❌ Erro ao gerar sugestão: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao gerar sugestão: {str(e)}",
        )

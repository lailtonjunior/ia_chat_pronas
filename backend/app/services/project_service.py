"""
Serviço de Negócio para Projetos
Contém lógica de negócio de alta ordem
"""

from typing import Dict, Any, List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import logging

from app.models.project import Project, ProjectStatus
from app.models.ai_analysis import AIAnalysis, AIProvider, AnalysisType
from app.models.document import Document
from app.services.openai_service import OpenAIService
from app.services.gemini_service import GeminiService
from app.services.notification_service import NotificationService
from app.models.notification import NotificationType, NotificationSeverity

logger = logging.getLogger(__name__)

class ProjectService:
    """Serviço de lógica de negócio para projetos"""

    @staticmethod
    async def update_project_score(
        db: AsyncSession,
        project_id: UUID
    ) -> int:
        """
        Recalcula e atualiza o score do projeto baseado nas análises
        """
        try:
            # Buscar projeto
            result = await db.execute(
                select(Project).where(Project.id == project_id)
            )
            project = result.scalar_one_or_none()

            if not project:
                logger.warning(f"Projeto não encontrado: {project_id}")
                return 0

            # Buscar análises mais recentes
            analyses_result = await db.execute(
                select(AIAnalysis)
                .where(AIAnalysis.project_id == project_id)
                .order_by(AIAnalysis.created_at.desc())
                .limit(2)
            )
            analyses = analyses_result.scalars().all()

            if not analyses:
                logger.warning(f"Nenhuma análise encontrada para: {project_id}")
                return 0

            # Calcular média dos scores
            scores = [a.score for a in analyses if a.score is not None]
            if scores:
                combined_score = sum(scores) // len(scores)
                project.combined_score = combined_score
                await db.commit()
                logger.info(f"✅ Score atualizado para projeto {project_id}: {combined_score}")
                return combined_score

            return 0

        except Exception as e:
            logger.error(f"❌ Erro ao atualizar score: {e}")
            raise

    @staticmethod
    async def auto_analyze_project(
        db: AsyncSession,
        project_id: UUID
    ) -> Dict[str, Any]:
        """
        Executa análise automática com ambos os provedores de IA
        """
        try:
            # Buscar projeto
            result = await db.execute(
                select(Project).where(Project.id == project_id)
            )
            project = result.scalar_one_or_none()

            if not project:
                raise ValueError("Projeto não encontrado")

            # Preparar texto
            project_text = project.content.get("text", "") if project.content else ""
            if not project_text:
                project_text = project.description or project.title

            # Análise com OpenAI
            openai_service = OpenAIService()
            openai_result = await openai_service.analyze_project(project_text)

            # Análise com Gemini
            gemini_service = GeminiService()
            gemini_result = await gemini_service.analyze_text(project_text)

            # Salvar análises
            openai_analysis = AIAnalysis(
                project_id=project_id,
                provider=AIProvider.OPENAI,
                analysis_type=AnalysisType.FULL_PROJECT,
                result=openai_result,
                score=openai_result.get("score", 0),
            )

            gemini_analysis = AIAnalysis(
                project_id=project_id,
                provider=AIProvider.GEMINI,
                analysis_type=AnalysisType.FULL_PROJECT,
                result=gemini_result,
                score=gemini_result.get("score", 0),
            )

            db.add(openai_analysis)
            db.add(gemini_analysis)
            await db.commit()

            # Atualizar score do projeto
            await ProjectService.update_project_score(db, project_id)
            await db.refresh(project)

            logger.info(f"✅ Análise automática concluída: {project_id}")

            await NotificationService.create_notification(
                db,
                user_id=project.user_id,
                title="Análise automática concluída",
                message=f"O projeto \"{project.title}\" recebeu uma nova análise automática.",
                notification_type=NotificationType.AI_ANALYSIS_COMPLETED,
                severity=NotificationSeverity.SUCCESS,
                data={
                    "project_id": str(project.id),
                    "combined_score": project.combined_score,
                    "analysis_type": "auto",
                },
                action_url=f"/dashboard/projects/{project.id}?tab=analysis",
            )

            return {
                "openai": openai_result,
                "gemini": gemini_result,
                "combined_score": project.combined_score
            }

        except Exception as e:
            logger.error(f"❌ Erro na análise automática: {e}")
            raise

    @staticmethod
    async def get_project_summary(
        db: AsyncSession,
        project_id: UUID
    ) -> Dict[str, Any]:
        """
        Retorna sumário completo do projeto
        """
        try:
            result = await db.execute(
                select(Project).where(Project.id == project_id)
            )
            project = result.scalar_one_or_none()

            if not project:
                raise ValueError("Projeto não encontrado")

            # Contar documentos
            docs_result = await db.execute(
                select(Document).where(Document.project_id == project_id)
            )
            documents = docs_result.scalars().all()

            # Contar análises
            analyses_result = await db.execute(
                select(AIAnalysis).where(AIAnalysis.project_id == project_id)
            )
            analyses = analyses_result.scalars().all()

            return {
                "project": project.to_dict(),
                "documents_count": len(documents),
                "analyses_count": len(analyses),
                "last_analyzed": project.analyzed_at,
                "recent_analyses": [a.to_dict() for a in analyses[:5]]
            }

        except Exception as e:
            logger.error(f"❌ Erro ao obter sumário: {e}")
            raise

    @staticmethod
    async def export_project(
        db: AsyncSession,
        project_id: UUID,
        format: str = "pdf"
    ) -> bytes:
        """
        Exporta projeto em diferentes formatos
        """
        try:
            result = await db.execute(
                select(Project).where(Project.id == project_id)
            )
            project = result.scalar_one_or_none()

            if not project:
                raise ValueError("Projeto não encontrado")

            if format == "json":
                import json
                return json.dumps(project.to_dict(), indent=2, ensure_ascii=False).encode()

            elif format == "pdf":
                # Implementar exportação PDF
                logger.warning("Exportação PDF ainda não implementada")
                return b"PDF export not implemented"

            elif format == "docx":
                # Implementar exportação DOCX
                logger.warning("Exportação DOCX ainda não implementada")
                return b"DOCX export not implemented"

            else:
                raise ValueError(f"Formato não suportado: {format}")

        except Exception as e:
            logger.error(f"❌ Erro ao exportar: {e}")
            raise

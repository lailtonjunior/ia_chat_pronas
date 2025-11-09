"""
Rotas de Projetos - COM PROJECT_SERVICE
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import List, Optional
from uuid import UUID
import logging
from datetime import datetime

from app.db.database import get_db
from app.models.project import Project, ProjectStatus
from app.models.user import User
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectResponse,
    ProjectDetailResponse, ProjectListResponse
)
from app.schemas.workflow import (
    ProjectCommentCreate,
    ProjectCommentResponse,
    SubmitForReviewRequest,
    ApprovalActionRequest,
    WorkflowSummary,
    ApprovalStepResponse,
)
from app.models.project_comment import ProjectComment
from app.models.approval_step import ApprovalStep, ApprovalStatus
from app.services.audit_service import AuditService
from app.models.generated_report import ReportFormat, GeneratedReport, ReportStatus
from app.services.report_service import ReportService
from app.middleware.auth import get_current_user
from app.services.project_service import ProjectService  # ✅ ADICIONADO
from app.services.notification_service import NotificationService
from app.models.notification import NotificationType, NotificationSeverity, NotificationChannel
from app.celery_app import celery_app

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Criar novo projeto
    """
    try:
        project = Project(
            user_id=current_user.id,
            title=project_data.title,
            description=project_data.description,
            project_type=project_data.project_type,
            institution_name=project_data.institution_name,
            institution_cnpj=project_data.institution_cnpj,
            institution_address=project_data.institution_address,
            status=ProjectStatus.DRAFT
        )
        
        db.add(project)
        await db.commit()
        await db.refresh(project)
        
        logger.info(f"✅ Projeto criado: {project.title} (ID: {project.id})")
        return ProjectResponse.model_validate(project)
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar projeto: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar projeto: {str(e)}"
        )

@router.get("/", response_model=ProjectListResponse)
async def list_projects(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Listar projetos do usuário
    """
    try:
        # Query base
        query = select(Project).where(Project.user_id == current_user.id)
        
        # Filtros
        if status_filter:
            query = query.where(Project.status == status_filter)
        
        if search:
            query = query.where(
                or_(
                    Project.title.ilike(f"%{search}%"),
                    Project.description.ilike(f"%{search}%"),
                    Project.institution_name.ilike(f"%{search}%")
                )
            )
        
        # Total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Paginação
        query = query.order_by(Project.updated_at.desc())
        query = query.offset((page - 1) * per_page).limit(per_page)
        
        result = await db.execute(query)
        projects = result.scalars().all()
        
        return ProjectListResponse(
            projects=[ProjectResponse.model_validate(p) for p in projects],
            total=total,
            page=page,
            per_page=per_page
        )
        
    except Exception as e:
        logger.error(f"❌ Erro ao listar projetos: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar projetos: {str(e)}"
        )

@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obter detalhes de um projeto
    """
    try:
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
        
        return ProjectDetailResponse.model_validate(project)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao buscar projeto: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar projeto: {str(e)}"
        )

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    project_data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atualizar projeto
    """
    try:
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
        
        # Atualizar campos
        update_data = project_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(project, field, value)
        
        # Incrementar versão
        project.version += 1
        
        await db.commit()
        await db.refresh(project)
        
        logger.info(f"✅ Projeto atualizado: {project.id}")
        return ProjectResponse.model_validate(project)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao atualizar projeto: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar projeto: {str(e)}"
        )

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletar projeto
    """
    try:
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
        
        await db.delete(project)
        await db.commit()
        
        logger.info(f"✅ Projeto deletado: {project_id}")
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao deletar projeto: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao deletar projeto: {str(e)}"
        )
@router.post("/{project_id}/analyze", status_code=status.HTTP_202_ACCEPTED)
async def analyze_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Iniciar análise automática do projeto
    """
    try:
        # Verificar propriedade
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
        
        # Usar ProjectService para análise
        analysis = await ProjectService.auto_analyze_project(db, project_id)
        
        return {
            "message": "Análise iniciada",
            "project_id": str(project_id),
            "analysis": analysis
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao iniciar análise: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao iniciar análise: {str(e)}"
        )

@router.get("/{project_id}/summary")
async def get_project_summary(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obter sumário completo do projeto
    """
    try:
        summary = await ProjectService.get_project_summary(db, project_id)
        return summary
    except Exception as e:
        logger.error(f"❌ Erro ao obter sumário: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter sumário: {str(e)}"
        )


@router.post("/{project_id}/submit_review")
async def submit_project_for_review(
    project_id: UUID,
    payload: SubmitForReviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    if project.status not in [ProjectStatus.DRAFT, ProjectStatus.REVIEWED]:
        raise HTTPException(status_code=400, detail="Projeto não está apto para revisão")
    if not payload.approver_ids:
        raise HTTPException(status_code=400, detail="Informe pelo menos um aprovador")

    project.status = ProjectStatus.IN_REVIEW
    await AuditService.log_action(
        db, current_user.id, "submit_review", "Project", str(project.id), {"approvers": payload.approver_ids}
    )

    for order, approver_id in enumerate(payload.approver_ids, start=1):
        step = ApprovalStep(
            project_id=project.id,
            approver_id=approver_id,
            step_name=f"Etapa {order}",
            order=order,
        )
        db.add(step)
        await NotificationService.create_notification(
            db,
            user_id=approver_id,
            title="Projeto aguardando aprovação",
            message=f"O projeto \"{project.title}\" foi submetido para sua aprovação.",
            notification_type=NotificationType.WORKFLOW_EVENT,
            severity=NotificationSeverity.INFO,
            channel=NotificationChannel.IN_APP,
            data={"project_id": str(project.id)},
            action_url=f"/dashboard/projects/{project.id}?tab=workflow",
        )
        await NotificationService.create_notification(
            db,
            user_id=approver_id,
            title="Projeto aguardando aprovação (email)",
            message=f"O projeto \"{project.title}\" foi submetido para sua aprovação.",
            notification_type=NotificationType.WORKFLOW_EVENT,
            severity=NotificationSeverity.INFO,
            channel=NotificationChannel.EMAIL,
            data={"project_id": str(project.id)},
        )

    await db.commit()
    return {"status": "in_review"}


@router.post("/{project_id}/approve")
async def approve_project(
    project_id: UUID,
    payload: ApprovalActionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    step = await db.execute(
        select(ApprovalStep).where(
            ApprovalStep.project_id == project_id,
            ApprovalStep.approver_id == current_user.id,
            ApprovalStep.status == ApprovalStatus.PENDING,
        )
    )
    approval_step = step.scalar_one_or_none()
    if not approval_step:
        raise HTTPException(status_code=404, detail="Etapa não encontrada")

    project = approval_step.project
    approval_step.status = ApprovalStatus.APPROVED
    approval_step.comment = payload.comment
    approval_step.decision_at = datetime.utcnow()

    remaining = await db.execute(
        select(func.count()).select_from(
            select(ApprovalStep.id)
            .where(
                ApprovalStep.project_id == project_id,
                ApprovalStep.status == ApprovalStatus.PENDING,
            )
            .subquery()
        )
    )
    if remaining.scalar() == 0:
        project.status = ProjectStatus.APPROVED
        project.submission_status = project.submission_status or "pending"

    await db.commit()
    await NotificationService.create_notification(
        db,
        user_id=project.user_id,
        title="Projeto aprovado",
        message=f"A aprovação do projeto \"{project.title}\" avançou.",
        notification_type=NotificationType.PROJECT_STATUS_UPDATED,
        severity=NotificationSeverity.SUCCESS,
        channel=NotificationChannel.IN_APP,
        data={"project_id": str(project.id)},
    )
    return {"status": project.status.value}


@router.post("/{project_id}/reject")
async def reject_project(
    project_id: UUID,
    payload: ApprovalActionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    step = await db.execute(
        select(ApprovalStep).where(
            ApprovalStep.project_id == project_id,
            ApprovalStep.approver_id == current_user.id,
            ApprovalStep.status == ApprovalStatus.PENDING,
        )
    )
    approval_step = step.scalar_one_or_none()
    if not approval_step:
        raise HTTPException(status_code=404, detail="Etapa não encontrada")

    project = approval_step.project
    approval_step.status = ApprovalStatus.REJECTED
    approval_step.comment = payload.comment
    approval_step.decision_at = datetime.utcnow()
    project.status = ProjectStatus.REJECTED

    rejection_comment = ProjectComment(
        project_id=project.id,
        user_id=current_user.id,
        content=payload.comment or "Reprovado sem justificativa",
    )
    db.add(rejection_comment)

    await db.commit()
    await NotificationService.create_notification(
        db,
        user_id=project.user_id,
        title="Projeto rejeitado",
        message=f"O projeto \"{project.title}\" foi rejeitado.",
        notification_type=NotificationType.PROJECT_STATUS_UPDATED,
        severity=NotificationSeverity.CRITICAL,
        channel=NotificationChannel.IN_APP,
        data={"project_id": str(project.id)},
    )
    return {"status": project.status.value}


@router.post("/{project_id}/comments", response_model=ProjectCommentResponse)
async def add_comment(
    project_id: UUID,
    payload: ProjectCommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    comment = ProjectComment(
        project_id=project_id,
        user_id=current_user.id,
        content=payload.content,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return ProjectCommentResponse.model_validate(comment)


@router.get("/{project_id}/comments", response_model=List[ProjectCommentResponse])
async def list_comments(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(ProjectComment).where(ProjectComment.project_id == project_id).order_by(
        ProjectComment.created_at.desc()
    )
    result = await db.execute(stmt)
    comments = result.scalars().all()
    return [ProjectCommentResponse.model_validate(c) for c in comments]


@router.get("/{project_id}/workflow", response_model=WorkflowSummary)
async def get_workflow_summary(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    steps_result = await db.execute(
        select(ApprovalStep).where(ApprovalStep.project_id == project_id).order_by(ApprovalStep.order)
    )
    steps = steps_result.scalars().all()
    comments_result = await db.execute(
        select(ProjectComment).where(ProjectComment.project_id == project_id).order_by(ProjectComment.created_at.desc())
    )
    comments = comments_result.scalars().all()

    return WorkflowSummary(
        project_id=project_id,
        status=project.status.value,
        steps=[ApprovalStepResponse.model_validate(step) for step in steps],
        comments=[ProjectCommentResponse.model_validate(comment) for comment in comments],
    )


@router.post("/{project_id}/export")
async def request_export(
    project_id: UUID,
    format: ReportFormat = ReportFormat.PDF,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    report = await ReportService.request_report(db, project_id, format)
    celery_app.send_task(
        "app.tasks.report_tasks.generate_report_task",
        args=[str(report.id), format.value],
    )
    return {"report_id": str(report.id)}


@router.get("/{project_id}/reports", response_model=List[dict])
async def list_reports(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(GeneratedReport).where(GeneratedReport.project_id == project_id).order_by(
        GeneratedReport.created_at.desc()
    )
    result = await db.execute(stmt)
    reports = result.scalars().all()
    return [
        {
            "id": str(report.id),
            "format": report.format.value,
            "status": report.status.value,
            "file_url": report.file_url,
            "created_at": report.created_at.isoformat(),
        }
        for report in reports
    ]

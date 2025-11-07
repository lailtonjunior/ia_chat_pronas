"""
Rotas de Projetos - COM PROJECT_SERVICE
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import List, Optional
from uuid import UUID
import logging

from app.db.database import get_db
from app.models.project import Project, ProjectStatus
from app.models.user import User
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectResponse,
    ProjectDetailResponse, ProjectListResponse
)
from app.middleware.auth import get_current_user
from app.services.project_service import ProjectService  # ✅ ADICIONADO

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

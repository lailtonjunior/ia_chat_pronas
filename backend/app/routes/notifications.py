"""
Rotas do sistema de notificações
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
import logging

from app.db.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.notification import (
    NotificationResponse,
    NotificationListResponse,
    NotificationPreferenceResponse,
    NotificationPreferenceUpdate,
)
from app.services.notification_service import NotificationService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/", response_model=NotificationListResponse)
async def list_notifications(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status_filter: str = Query("all", pattern="^(all|read|unread)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lista notificações do usuário logado.
    """
    read_status = None
    if status_filter == "read":
        read_status = True
    elif status_filter == "unread":
        read_status = False

    try:
        data = await NotificationService.list_notifications(
            db,
            current_user.id,
            limit=per_page,
            offset=(page - 1) * per_page,
            read_status=read_status,
        )

        return NotificationListResponse(
            notifications=[
                NotificationResponse.model_validate(notification)
                for notification in data["notifications"]
            ],
            total=data["total"],
            unread_count=data["unread_count"],
            page=page,
            per_page=per_page,
        )
    except Exception as exc:
        logger.error("❌ Erro ao listar notificações: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao listar notificações",
        ) from exc


@router.post("/read-all")
async def mark_all_notifications_as_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Marca todas as notificações do usuário como lidas.
    """
    try:
        updated = await NotificationService.mark_all_as_read(db, current_user.id)
        return {"message": "Notificações atualizadas", "updated": updated}
    except Exception as exc:
        logger.error("❌ Erro ao marcar todas notificações: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao atualizar notificações",
        ) from exc


@router.post("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_as_read(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Marca uma notificação específica como lida.
    """
    try:
        notification = await NotificationService.mark_as_read(
            db,
            current_user.id,
            notification_id,
        )
        return NotificationResponse.model_validate(notification)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificação não encontrada",
        )
    except Exception as exc:
        logger.error("❌ Erro ao marcar notificação como lida: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao marcar notificação como lida",
        ) from exc


@router.get("/preferences", response_model=NotificationPreferenceResponse)
async def get_notification_preferences(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Recupera preferências de notificação do usuário.
    """
    preference = await NotificationService.get_preferences(db, current_user.id)
    return NotificationPreferenceResponse.model_validate(preference)


@router.put("/preferences", response_model=NotificationPreferenceResponse)
async def update_notification_preferences(
    payload: NotificationPreferenceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Atualiza preferências de notificações.
    """
    try:
        preference = await NotificationService.update_preferences(
            db,
            current_user.id,
            payload.model_dump(exclude_unset=True),
        )
        return NotificationPreferenceResponse.model_validate(preference)
    except Exception as exc:
        logger.error("❌ Erro ao atualizar preferências: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao atualizar preferências",
        ) from exc

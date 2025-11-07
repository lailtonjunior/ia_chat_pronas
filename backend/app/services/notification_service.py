"""
Serviço de notificações centralizado
"""

from __future__ import annotations

from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update

from app.models.notification import (
    Notification,
    NotificationType,
    NotificationChannel,
    NotificationSeverity,
    NotificationPreference,
)
from app.websockets.notification_manager import notification_ws_manager

logger = logging.getLogger(__name__)


PREFERENCE_FIELD_MAP = {
    NotificationType.AI_ANALYSIS_COMPLETED: "ai_analysis",
    NotificationType.PROJECT_STATUS_UPDATED: "project_status",
    NotificationType.DOCUMENT_IMPORTED: "document_events",
    NotificationType.WORKFLOW_EVENT: "workflow_updates",
    NotificationType.SYSTEM_ALERT: None,  # sempre envia
}


class NotificationService:
    """Serviço utilitário para criação e consulta de notificações"""

    @staticmethod
    async def ensure_preferences(db: AsyncSession, user_id: UUID) -> NotificationPreference:
        """
        Garante que as preferências existam para o usuário.
        """
        result = await db.execute(
            select(NotificationPreference).where(NotificationPreference.user_id == user_id)
        )
        preference = result.scalar_one_or_none()

        if preference:
            return preference

        preference = NotificationPreference(user_id=user_id)
        db.add(preference)
        await db.commit()
        await db.refresh(preference)
        logger.info("✅ Preferências de notificação criadas para usuário %s", user_id)
        return preference

    @staticmethod
    def _is_allowed(preference: NotificationPreference, notification_type: NotificationType) -> bool:
        """
        Verifica se o usuário permite receber o tipo informado.
        """
        preference_field = PREFERENCE_FIELD_MAP.get(notification_type)
        if preference_field is None:
            return True

        return getattr(preference, preference_field, True)

    @staticmethod
    async def create_notification(
        db: AsyncSession,
        *,
        user_id: UUID,
        title: str,
        message: str,
        notification_type: NotificationType,
        severity: NotificationSeverity = NotificationSeverity.INFO,
        channel: NotificationChannel = NotificationChannel.IN_APP,
        data: Optional[Dict[str, Any]] = None,
        action_url: Optional[str] = None,
    ) -> Optional[Notification]:
        """
        Cria uma nova notificação respeitando preferências do usuário.
        """
        preference = await NotificationService.ensure_preferences(db, user_id)
        if not NotificationService._is_allowed(preference, notification_type):
            logger.debug(
                "⚠️ Notificação %s ignorada por preferência do usuário %s",
                notification_type.value,
                user_id,
            )
            return None

        notification = Notification(
            user_id=user_id,
            type=notification_type,
            severity=severity,
            channel=channel,
            title=title,
            message=message,
            data=data,
            action_url=action_url,
        )

        db.add(notification)
        await db.commit()
        await db.refresh(notification)
        unread_count = await NotificationService.get_unread_count(db, user_id)
        logger.info(
            "🔔 Notificação criada (%s) para usuário %s",
            notification_type.value,
            user_id,
        )
        await notification_ws_manager.broadcast_to_user(
            str(user_id),
            {
                "type": "notification",
                "notification": notification.to_dict(),
                "unread_count": unread_count,
            },
        )
        return notification

    @staticmethod
    async def list_notifications(
        db: AsyncSession,
        user_id: UUID,
        *,
        limit: int = 20,
        offset: int = 0,
        read_status: Optional[bool] = None,
    ) -> Dict[str, Any]:
        """
        Retorna notificações paginadas do usuário.
        """
        filters = [Notification.user_id == user_id]
        if read_status is True:
            filters.append(Notification.is_read.is_(True))
        elif read_status is False:
            filters.append(Notification.is_read.is_(False))

        query = select(Notification).where(*filters)

        query = query.order_by(Notification.created_at.desc()).limit(limit).offset(offset)
        result = await db.execute(query)
        notifications = result.scalars().all()

        total_result = await db.execute(
            select(func.count()).select_from(
                select(Notification.id).where(*filters).subquery()
            )
        )
        total = total_result.scalar() or 0

        unread_result = await db.execute(
            select(func.count()).select_from(
                select(Notification.id)
                .where(Notification.user_id == user_id, Notification.is_read.is_(False))
                .subquery()
            )
        )
        unread_count = unread_result.scalar() or 0

        return {
            "notifications": notifications,
            "total": total,
            "unread_count": unread_count,
        }

    @staticmethod
    async def mark_as_read(db: AsyncSession, user_id: UUID, notification_id: UUID) -> Notification:
        """
        Marca uma notificação como lida.
        """
        result = await db.execute(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
        )
        notification = result.scalar_one_or_none()

        if not notification:
            raise ValueError("Notificação não encontrada")

        if not notification.is_read:
            notification.mark_as_read()
            await db.commit()
            await db.refresh(notification)
            unread_count = await NotificationService.get_unread_count(db, user_id)
            await notification_ws_manager.broadcast_to_user(
                str(user_id),
                {
                    "type": "notification_read",
                    "notification_id": str(notification.id),
                    "unread_count": unread_count,
                },
            )
        return notification

    @staticmethod
    async def mark_all_as_read(db: AsyncSession, user_id: UUID) -> int:
        """
        Marca todas as notificações do usuário como lidas.
        """
        now = datetime.utcnow()
        result = await db.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read.is_(False))
            .values(is_read=True, read_at=now, updated_at=now)
        )
        await db.commit()
        updated = result.rowcount or 0
        if updated:
            await notification_ws_manager.broadcast_to_user(
                str(user_id),
                {
                    "type": "notifications_read_all",
                    "unread_count": 0,
                },
            )
        return updated

    @staticmethod
    async def get_unread_count(db: AsyncSession, user_id: UUID) -> int:
        result = await db.execute(
            select(func.count()).select_from(
                select(Notification.id)
                .where(Notification.user_id == user_id, Notification.is_read.is_(False))
                .subquery()
            )
        )
        return result.scalar() or 0

    @staticmethod
    async def get_preferences(db: AsyncSession, user_id: UUID) -> NotificationPreference:
        return await NotificationService.ensure_preferences(db, user_id)

    @staticmethod
    async def update_preferences(
        db: AsyncSession,
        user_id: UUID,
        data: Dict[str, Any],
    ) -> NotificationPreference:
        preference = await NotificationService.ensure_preferences(db, user_id)

        for field, value in data.items():
            if value is not None and hasattr(preference, field):
                setattr(preference, field, value)

        await db.commit()
        await db.refresh(preference)
        logger.info("⚙️ Preferências de notificação atualizadas para %s", user_id)
        return preference

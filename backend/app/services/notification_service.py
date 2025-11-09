"""
Serviço central de notificações
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Dict, Any, Optional
from uuid import UUID

from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import (
    Notification,
    NotificationChannel,
    NotificationPreference,
    NotificationSeverity,
    NotificationStatus,
    NotificationType,
)
from app.websockets.notification_manager import notification_ws_manager

logger = logging.getLogger(__name__)

PREFERENCE_FIELD_MAP = {
    NotificationType.AI_ANALYSIS_COMPLETED: "ai_analysis",
    NotificationType.PROJECT_STATUS_UPDATED: "project_status",
    NotificationType.DOCUMENT_IMPORTED: "document_events",
    NotificationType.WORKFLOW_EVENT: "workflow_updates",
    NotificationType.SYSTEM_ALERT: None,
    NotificationType.REPORT_READY: "document_events",
}


class NotificationService:
    """Encapsula criação e leitura de notificações."""

    @staticmethod
    async def ensure_preferences(db: AsyncSession, user_id: UUID) -> NotificationPreference:
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
        return preference

    @staticmethod
    def _is_allowed(
        preference: NotificationPreference,
        notification_type: NotificationType,
    ) -> bool:
        field_name = PREFERENCE_FIELD_MAP.get(notification_type)
        if not field_name:
            return True
        return getattr(preference, field_name, True)

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
        preference = await NotificationService.ensure_preferences(db, user_id)
        if not NotificationService._is_allowed(preference, notification_type):
            logger.debug("Notificação %s ignorada por preferência", notification_type)
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
        await notification_ws_manager.broadcast_to_user(
            str(user_id),
            {
                "type": "notification",
                "notification": notification.to_dict(),
                "unread_count": unread_count,
            },
        )

        if channel == NotificationChannel.EMAIL:
            from app.celery_app import celery_app
            celery_app.send_task(
                "app.tasks.email_tasks.send_email_task",
                args=[str(notification.id)],
            )

        return notification

    @staticmethod
    async def list_notifications(
        db: AsyncSession,
        user_id: UUID,
        limit: int = 20,
        offset: int = 0,
        read_status: Optional[bool] = None,
    ) -> Dict[str, Any]:
        filters = [Notification.user_id == user_id]
        if read_status is True:
            filters.append(Notification.is_read.is_(True))
        elif read_status is False:
            filters.append(Notification.is_read.is_(False))

        query = select(Notification).where(*filters).order_by(Notification.created_at.desc())
        query = query.limit(limit).offset(offset)

        result = await db.execute(query)
        notifications = result.scalars().all()

        total_stmt = select(func.count()).select_from(select(Notification.id).where(*filters).subquery())
        total = (await db.execute(total_stmt)).scalar() or 0
        unread_count = await NotificationService.get_unread_count(db, user_id)

        return {
            "notifications": notifications,
            "total": total,
            "unread_count": unread_count,
        }

    @staticmethod
    async def mark_as_read(db: AsyncSession, user_id: UUID, notification_id: UUID) -> Notification:
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
        now = datetime.utcnow()
        stmt = (
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read.is_(False))
            .values(is_read=True, read_at=now, updated_at=now)
        )
        result = await db.execute(stmt)
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
        stmt = select(func.count()).select_from(
            select(Notification.id)
            .where(Notification.user_id == user_id, Notification.is_read.is_(False))
            .subquery()
        )
        result = await db.execute(stmt)
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
            if hasattr(preference, field) and value is not None:
                setattr(preference, field, value)
        await db.commit()
        await db.refresh(preference)
        return preference

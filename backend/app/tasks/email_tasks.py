"""
Tasks de envio de email
"""

from __future__ import annotations

import asyncio
import uuid
from typing import List

from sqlalchemy import select

from app.celery_app import celery_app
from app.db.database import AsyncSessionLocal
from app.models.notification import Notification, NotificationStatus
from app.services.email_service import EmailService


async def _send_email(notification_id: uuid.UUID) -> bool:
    async with AsyncSessionLocal() as session:
        notification = await session.get(Notification, notification_id)
        if not notification:
            return False

        await session.refresh(notification, attribute_names=["user"])
        user = notification.user
        if not user or not user.email:
            notification.status = NotificationStatus.FAILED
            await session.commit()
            return False

        email_service = EmailService()
        html_body = notification.message
        text_body = notification.message

        success = email_service.send_email(
            [user.email],
            subject=notification.title,
            html_body=html_body,
            text_body=text_body,
        )

        notification.status = (
            NotificationStatus.SENT if success else NotificationStatus.FAILED
        )
        await session.commit()
        return success


@celery_app.task(name="app.tasks.email_tasks.send_email_task")
def send_email_task(notification_id: str):
    asyncio.run(_send_email(uuid.UUID(notification_id)))

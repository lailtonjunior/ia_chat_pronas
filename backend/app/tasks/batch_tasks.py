"""
Tasks periódicas (digests)
"""

from __future__ import annotations

import asyncio
from sqlalchemy import select

from app.celery_app import celery_app
from app.db.database import AsyncSessionLocal
from app.models.notification import Notification, NotificationStatus
from app.services.email_service import EmailService


async def _send_daily_digest():
    async with AsyncSessionLocal() as session:
        stmt = (
            select(Notification.user_id)
            .where(Notification.is_read.is_(False))
            .distinct()
        )
        result = await session.execute(stmt)
        user_ids = [row[0] for row in result.fetchall()]

        email_service = EmailService()

        for user_id in user_ids:
            notifications_stmt = (
                select(Notification)
                .where(
                    Notification.user_id == user_id,
                    Notification.is_read.is_(False),
                )
                .limit(20)
            )
            notifications_result = await session.execute(notifications_stmt)
            notifications = notifications_result.scalars().all()
            if not notifications:
                continue

            await session.refresh(notifications[0], attribute_names=["user"])
            user = notifications[0].user
            if not user or not user.email:
                continue

            html_body = "<br>".join(
                [f"<strong>{n.title}</strong>: {n.message}" for n in notifications]
            )
            email_service.send_email(
                [user.email],
                subject="Resumo diário PRONAS/PCD",
                html_body=html_body,
            )

            for n in notifications:
                if n.channel == "email" and n.status == NotificationStatus.PENDING:
                    n.status = NotificationStatus.SENT

        await session.commit()


@celery_app.task(name="app.tasks.batch_tasks.send_daily_digest_task")
def send_daily_digest_task():
    asyncio.run(_send_daily_digest())

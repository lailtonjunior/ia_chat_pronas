"""
Instância compartilhada do Celery
"""

from celery import Celery
from celery.schedules import crontab

from app.config import settings

celery_app = Celery(
    "pronas_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.autodiscover_tasks(
    packages=[
        "app.tasks",
    ]
)

celery_app.conf.update(
    timezone="UTC",
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    broker_connection_retry_on_startup=True,
    beat_schedule={
        "daily-notification-digest": {
            "task": "app.tasks.batch_tasks.send_daily_digest_task",
            "schedule": crontab(hour=11, minute=0),
        },
        "nightly-database-backup": {
            "task": "app.tasks.backup_tasks.backup_db_to_s3_task",
            "schedule": crontab(hour=3, minute=0),
        },
    },
)


@celery_app.task
def health_check():
    return "ok"

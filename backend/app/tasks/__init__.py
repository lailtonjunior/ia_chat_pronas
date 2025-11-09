"""
Pacote de tasks Celery
"""

from app.tasks import email_tasks, batch_tasks, report_tasks, backup_tasks

__all__ = ["email_tasks", "batch_tasks", "report_tasks", "backup_tasks"]

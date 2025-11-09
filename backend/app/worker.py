"""
Entry point para rodar o worker Celery
"""

from app.celery_app import celery_app

__all__ = ["celery_app"]

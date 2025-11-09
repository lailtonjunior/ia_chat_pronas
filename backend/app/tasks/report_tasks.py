"""
Tasks de geração de relatórios
"""

from __future__ import annotations

import asyncio
import uuid

from app.celery_app import celery_app
from app.models.generated_report import ReportFormat
from app.services.report_service import ReportService


@celery_app.task(name="app.tasks.report_tasks.generate_report_task")
def generate_report_task(report_id: str, fmt: str):
    async def runner():
        await ReportService.generate(uuid.UUID(report_id), ReportFormat(fmt))

    asyncio.run(runner())

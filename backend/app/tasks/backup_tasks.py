"""
Tasks de backup e manutenção
"""

from __future__ import annotations

import asyncio
import gzip
import os
import subprocess
from datetime import datetime
from pathlib import Path

import boto3

from app.celery_app import celery_app
from app.config import settings


async def _backup_db():
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    dump_dir = Path(settings.UPLOAD_PATH).parent / "backups"
    dump_dir.mkdir(parents=True, exist_ok=True)
    dump_file = dump_dir / f"db-backup-{timestamp}.sql"

    pg_url = settings.DATABASE_URL.replace("+asyncpg", "")
    env = os.environ.copy()
    process = subprocess.run(
        ["pg_dump", pg_url, "-f", str(dump_file)],
        env=env,
        capture_output=True,
        text=True,
    )
    if process.returncode != 0:
        raise RuntimeError(process.stderr)

    compressed_path = dump_file.with_suffix(".sql.gz")
    with open(dump_file, "rb") as f_in, gzip.open(compressed_path, "wb") as f_out:
        f_out.writelines(f_in)
    dump_file.unlink(missing_ok=True)

    if settings.BACKUP_S3_BUCKET:
        s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION_NAME,
        )
        key = f"backups/{compressed_path.name}"
        s3.upload_file(str(compressed_path), settings.BACKUP_S3_BUCKET, key)


@celery_app.task(name="app.tasks.backup_tasks.backup_db_to_s3_task")
def backup_db_to_s3_task():
    asyncio.run(_backup_db())

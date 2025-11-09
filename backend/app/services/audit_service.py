"""
Serviço de auditoria
"""

from __future__ import annotations

from typing import Any, Dict, Optional
from uuid import UUID

from app.models.audit_log import AuditLog


class AuditService:
    @staticmethod
    async def log_action(
        db,
        user_id: Optional[UUID],
        action: str,
        target_model: str,
        target_id: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        log = AuditLog(
            user_id=user_id,
            action=action,
            target_model=target_model,
            target_id=target_id,
            details=details,
        )
        db.add(log)
        await db.commit()
        await db.refresh(log)
        return log

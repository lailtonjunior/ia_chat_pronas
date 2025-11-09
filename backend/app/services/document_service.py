"""
Serviços auxiliares para versionamento de documentos
"""

from __future__ import annotations

from difflib import unified_diff
from typing import List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy_continuum import version_class

from app.models.document import Document


class DocumentVersionService:
    DocumentVersion = version_class(Document)

    @staticmethod
    async def list_versions(db, document_id: UUID) -> List[Document]:
        stmt = (
            select(DocumentVersionService.DocumentVersion)
            .where(DocumentVersionService.DocumentVersion.id == document_id)
            .order_by(DocumentVersionService.DocumentVersion.transaction_id.desc())
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_diff(db, document_id: UUID, version_a: int, version_b: int) -> str:
        versions = DocumentVersionService.DocumentVersion
        stmt = select(versions).where(
            versions.id == document_id, versions.transaction_id.in_([version_a, version_b])
        )
        result = await db.execute(stmt)
        rows = {row.transaction_id: row for row in result.scalars()}
        va = rows.get(version_a)
        vb = rows.get(version_b)
        if not va or not vb:
            return ""

        old = (va.extracted_text or "").splitlines()
        new = (vb.extracted_text or "").splitlines()
        diff = unified_diff(old, new, fromfile=str(version_a), tofile=str(version_b), lineterm="")
        return "\n".join(diff)

    @staticmethod
    async def rollback(db, document_id: UUID, transaction_id: int) -> Document:
        versions = DocumentVersionService.DocumentVersion
        stmt = select(versions).where(
            versions.id == document_id, versions.transaction_id == transaction_id
        )
        result = await db.execute(stmt)
        version_obj = result.scalar_one()

        document = await db.get(Document, document_id)
        if not document:
            raise ValueError("Documento não encontrado")

        document.extracted_text = version_obj.extracted_text
        document.file_path = version_obj.file_path
        await db.commit()
        await db.refresh(document)
        return document

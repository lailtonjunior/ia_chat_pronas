"""
Model de Documento (PDFs, anexos, uploads)
"""

from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, BigInteger
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.database import Base

class Document(Base):
    __tablename__ = "documents"
    __versioned__ = {}
    
    # Identificação
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    
    # Informações do arquivo
    filename = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=False)
    file_type = Column(String(100), nullable=False)  # pdf, docx, xlsx, etc
    file_size = Column(BigInteger, nullable=False)  # bytes
    mime_type = Column(String(200))
    
    # Processamento
    is_processed = Column(Integer, default=0)  # 0=não, 1=sim
    extracted_text = Column(String)  # Texto extraído do PDF
    
    # Metadados
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    processed_at = Column(DateTime, nullable=True)
    
    # Relacionamentos
    user = relationship("User", back_populates="documents")
    project = relationship("Project", back_populates="documents")
    
    def __repr__(self):
        return f"<Document {self.original_filename}>"
    
    def to_dict(self):
        """Converte para dicionário"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "project_id": str(self.project_id) if self.project_id else None,
            "filename": self.filename,
            "original_filename": self.original_filename,
            "file_type": self.file_type,
            "file_size": self.file_size,
            "is_processed": bool(self.is_processed),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

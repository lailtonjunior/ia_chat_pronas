"""
Serviço de Processamento de PDFs
"""

import PyPDF2
import pdfplumber
from pathlib import Path
import logging
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

class PDFProcessor:
    """Processador de arquivos PDF"""
    
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> Optional[str]:
        """
        Extrai texto de um PDF usando pdfplumber
        """
        try:
            text = ""
            
            with pdfplumber.open(file_path) as pdf:
                logger.info(f"📄 Processando PDF: {file_path} ({len(pdf.pages)} páginas)")
                
                for page_num, page in enumerate(pdf.pages, 1):
                    page_text = page.extract_text()
                    if page_text:
                        text += f"\n--- PÁGINA {page_num} ---\n{page_text}"
            
            if not text.strip():
                logger.warning(f"⚠️ Nenhum texto extraído do PDF: {file_path}")
                return None
            
            logger.info(f"✅ Texto extraído: {len(text)} caracteres")
            
            return text
            
        except Exception as e:
            logger.error(f"❌ Erro ao extrair texto do PDF: {e}")
            raise
    
    @staticmethod
    def extract_tables_from_pdf(file_path: str) -> List[List[Dict[str, Any]]]:
        """
        Extrai tabelas de um PDF
        """
        try:
            tables = []
            
            with pdfplumber.open(file_path) as pdf:
                for page_num, page in enumerate(pdf.pages, 1):
                    page_tables = page.extract_tables()
                    if page_tables:
                        for table in page_tables:
                            tables.append({
                                "page": page_num,
                                "data": table
                            })
            
            logger.info(f"✅ {len(tables)} tabelas extraídas")
            
            return tables
            
        except Exception as e:
            logger.error(f"❌ Erro ao extrair tabelas do PDF: {e}")
            raise
    
    @staticmethod
    def extract_metadata_from_pdf(file_path: str) -> Dict[str, Any]:
        """
        Extrai metadados do PDF
        """
        try:
            metadata = {}
            
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                
                if reader.metadata:
                    metadata = {
                        "title": reader.metadata.get("/Title"),
                        "author": reader.metadata.get("/Author"),
                        "subject": reader.metadata.get("/Subject"),
                        "creator": reader.metadata.get("/Creator"),
                        "producer": reader.metadata.get("/Producer"),
                        "pages": len(reader.pages)
                    }
            
            logger.info(f"✅ Metadados extraídos do PDF")
            
            return metadata
            
        except Exception as e:
            logger.error(f"❌ Erro ao extrair metadados: {e}")
            raise
    
    @staticmethod
    def validate_pdf(file_path: str) -> bool:
        """
        Valida se o PDF é válido
        """
        try:
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                return len(reader.pages) > 0
        except Exception as e:
            logger.error(f"❌ PDF inválido: {e}")
            return False

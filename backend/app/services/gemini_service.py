"""
Serviço de Integração com Google Gemini 2.5 Flash
"""

import google.generativeai as genai
from typing import Dict, Any, List
import logging
import json
import base64

from app.config import settings

logger = logging.getLogger(__name__)

class GeminiService:
    """Serviço para interagir com Google Gemini"""
    
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model_name = settings.GEMINI_MODEL
    
    async def analyze_pdf(self, file_path: str) -> Dict[str, Any]:
        """
        Analisa PDF usando Gemini 2.5 Flash com visão
        """
        try:
            # Ler o PDF
            with open(file_path, "rb") as pdf_file:
                pdf_data = base64.standard_b64encode(pdf_file.read()).decode("utf-8")
            
            model = genai.GenerativeModel(
                model_name=self.model_name,
                generation_config={
                    "temperature": 0.7,
                    "max_output_tokens": 4000,
                }
            )
            
            prompt = """Você é um especialista em projetos PRONAS/PCD do Ministério da Saúde do Brasil.

Analise este documento PDF de projeto e forneça uma avaliação em JSON com:

1. score (0-100): Pontuação geral
2. document_type: Tipo de documento identificado
3. completeness: Análise de completude
4. quality_assessment: Avaliação de qualidade
5. warnings (lista): Avisos importantes
6. observations (lista): Observações adicionais
7. budget_analysis: Se houver orçamento
8. recommendations (lista): Recomendações

Retorne APENAS JSON válido."""

            response = model.generate_content(
                [
                    {"mime_type": "application/pdf", "data": pdf_data},
                    prompt
                ]
            )
            
            content = self._extract_text(response)
            
            # Tentar fazer parse como JSON
            try:
                result = json.loads(content)
            except json.JSONDecodeError:
                # Se não for JSON, retornar como texto
                result = {
                    "score": 60,
                    "analysis": content,
                    "warnings": ["Resposta não estruturada"]
                }
            
            logger.info(f"✅ PDF analisado com Gemini. Score: {result.get('score', 0)}")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Erro ao analisar PDF com Gemini: {e}")
            raise
    
    async def analyze_text(self, text: str) -> Dict[str, Any]:
        """
        Análise textual usando Gemini
        """
        try:
            model = genai.GenerativeModel(
                model_name=self.model_name,
                generation_config={
                    "temperature": 0.7,
                    "max_output_tokens": 3000,
                }
            )
            
            prompt = f"""Analise o seguinte texto de projeto PRONAS/PCD:

TEXTO:
{text[:5000]}

Forneça análise em JSON com:
- score (0-100)
- summary (máx 150 palavras)
- key_points (lista)
- concerns (lista)
- compliance_assessment
- next_steps (lista)

Retorne APENAS JSON válido."""

            response = model.generate_content(prompt)
            content = self._extract_text(response)
            result = json.loads(content)
            
            logger.info(f"✅ Texto analisado com Gemini. Score: {result.get('score', 0)}")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Erro ao analisar texto com Gemini: {e}")
            raise
    
    async def generate_text_suggestion(
        self,
        section_name: str,
        current_content: str
    ) -> str:
        """
        Gera sugestão de melhoria com Gemini
        """
        try:
            model = genai.GenerativeModel(self.model_name)
            
            prompt = f"""Para um projeto PRONAS/PCD, reescreva e melhore esta seção:

SEÇÃO: {section_name}

CONTEÚDO ATUAL:
{current_content}

Gere uma versão MELHORADA que:
1. Seja clara e concisa
2. Siga padrões PRONAS/PCD
3. Seja profissional

Retorne apenas o texto melhorado."""

            response = model.generate_content(prompt)
            improved_text = self._extract_text(response)
            logger.info(f"✅ Sugestão gerada para '{section_name}'")
            
            return improved_text
            
        except Exception as e:
            logger.error(f"❌ Erro ao gerar sugestão: {e}")
            raise
    
    async def extract_pdf_text(self, file_path: str) -> str:
        """
        Extrai texto do PDF usando Gemini
        """
        try:
            with open(file_path, "rb") as pdf_file:
                pdf_data = base64.standard_b64encode(pdf_file.read()).decode("utf-8")
            
            model = genai.GenerativeModel(self.model_name)
            
            response = model.generate_content(
                [
                    {"mime_type": "application/pdf", "data": pdf_data},
                    "Extraia TODO o texto deste PDF em português. Mantenha a estrutura e formatação."
                ]
            )
            
            text = self._extract_text(response)
            logger.info(f"✅ Texto extraído do PDF ({len(text)} caracteres)")
            
            return text
            
        except Exception as e:
            logger.error(f"❌ Erro ao extrair texto do PDF: {e}")
            raise

    def _extract_text(self, response) -> str:
        """Extrai conteúdo textual de qualquer resposta Gemini, mesmo quando multipart."""
        if hasattr(response, "text"):
            try:
                return response.text
            except Exception:
                pass

        candidates = getattr(response, "candidates", None) or []
        if candidates:
            candidate = candidates[0]
            content = getattr(candidate, "content", None)
            parts = getattr(content, "parts", None)
            if parts is None and isinstance(candidate, dict):
                parts = candidate.get("content", {}).get("parts")

            texts: List[str] = []
            for part in parts or []:
                text = getattr(part, "text", None)
                if text is None and isinstance(part, dict):
                    text = part.get("text")
                if text:
                    texts.append(text)

            if texts:
                return "\n".join(texts)

        raise ValueError("Não foi possível extrair texto da resposta do Gemini.")

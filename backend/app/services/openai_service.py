"""
Serviço de Integração com OpenAI (Modelo Fine-tuned)
"""

from typing import Any, Dict, List, Optional
import json
import logging

from openai import AsyncOpenAI

from app.config import settings

logger = logging.getLogger(__name__)


class OpenAIService:
    """Serviço para interagir com a API Async do OpenAI Python SDK."""

    def __init__(self) -> None:
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
        self.max_tokens = settings.OPENAI_MAX_TOKENS
        self.temperature = settings.OPENAI_TEMPERATURE

    async def analyze_project(self, project_text: str) -> Dict[str, Any]:
        """
        Executa uma análise completa do projeto PRONAS/PCD.
        Retorna sempre um dicionário JSON válido.
        """
        prompt = f"""Você é um especialista em projetos PRONAS/PCD do Ministério da Saúde do Brasil.

Analise este projeto e forneça uma avaliação estruturada em JSON com os seguintes campos:

1. score (0-100): Pontuação geral de conformidade
2. summary: Resumo executivo (máx 200 palavras)
3. strengths (lista): Pontos fortes do projeto
4. weaknesses (lista): Pontos fracos
5. suggestions (lista de objetos com: section, original_text, suggested_text, reason, priority)
6. critical_issues (lista de objetos com: section, issue, severity, solution)
7. compliance: Objeto com conformidade por seção

PROJETO:
{project_text[:8000]}

Retorne APENAS JSON válido, sem markdown."""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Você é especialista em PRONAS/PCD. Retorne apenas JSON válido."
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                top_p=0.95,
                frequency_penalty=0.0,
                presence_penalty=0.0,
            )

            content = response.choices[0].message.content or "{}"
            result = json.loads(content)
            logger.info("✅ Análise OpenAI concluída. Score: %s", result.get("score", 0))
            return result
        except json.JSONDecodeError as exc:
            logger.error("❌ Erro ao fazer parse JSON: %s", exc)
            return {
                "score": 0,
                "summary": "Erro ao processar análise",
                "error": str(exc),
            }
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("❌ Erro ao analisar com OpenAI: %s", exc)
            raise

    async def analyze_section(
        self,
        section_name: str,
        section_content: str,
        project_context: str = "",
    ) -> Dict[str, Any]:
        """Executa análise detalhada de uma seção específica."""
        prompt = f"""Analise a seguinte seção de um projeto PRONAS/PCD:

SEÇÃO: {section_name}

CONTEÚDO:
{section_content}

CONTEXTO DO PROJETO:
{project_context[:2000] if project_context else "N/A"}

Forneça feedback estruturado em JSON com:
- score (0-100)
- quality_assessment
- suggestions (lista)
- critical_issues (lista)
- improvements (lista)
"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "Especialista em PRONAS/PCD. Retorne JSON."},
                    {"role": "user", "content": prompt},
                ],
                temperature=self.temperature,
                max_tokens=2000,
            )

            content = response.choices[0].message.content or "{}"
            result = json.loads(content)
            logger.info("✅ Seção '%s' analisada. Score: %s", section_name, result.get("score", 0))
            return result
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("❌ Erro ao analisar seção: %s", exc)
            raise

    async def generate_improvement_suggestion(
        self,
        section: str,
        current_text: str,
        improvement_type: str = "general",
    ) -> str:
        """Gera sugestão de melhoria textual para uma seção."""
        prompt = f"""Melhore o seguinte texto de um projeto PRONAS/PCD:

SEÇÃO: {section}
TIPO DE MELHORIA: {improvement_type}

TEXTO ATUAL:
{current_text}

Forneça uma versão MELHORADA do texto que:
1. Seja mais clara e objetiva
2. Cumpra requisitos do PRONAS/PCD
3. Seja profissional e bem estruturada

Retorne apenas o texto melhorado, sem explicações."""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "Especialista em PRONAS/PCD."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=1000,
            )

            improved_text = response.choices[0].message.content or ""
            logger.info("✅ Sugestão gerada para seção '%s'", section)
            return improved_text
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("❌ Erro ao gerar sugestão: %s", exc)
            raise

    async def chat_about_project(
        self,
        message: str,
        project_context: Dict[str, str],
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """Executa chat contextualizado sobre o projeto."""
        messages: List[Dict[str, str]] = [
            {
                "role": "system",
                "content": (
                    "Você é um assistente especialista em PRONAS/PCD.\n"
                    f"Você está ajudando com o projeto: {project_context.get('title', '')}\n\n"
                    "Informações do projeto:\n"
                    f"- Descrição: {project_context.get('description', 'N/A')}\n"
                    f"- Instituição: {project_context.get('institution', 'N/A')}\n\n"
                    "Seja helpful, específico e sempre refira-se ao contexto do projeto."
                ),
            }
        ]

        if conversation_history:
            for entry in conversation_history[-5:]:
                messages.append(
                    {
                        "role": entry.get("role", "user"),
                        "content": entry.get("content", ""),
                    }
                )

        messages.append({"role": "user", "content": message})

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=2000,
            )

            assistant_message = response.choices[0].message.content or ""
            logger.info("✅ Chat respondido")
            return {
                "message": assistant_message,
                "suggestions": self._extract_suggestions(assistant_message),
                "references": self._extract_references(assistant_message),
            }
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("❌ Erro no chat: %s", exc)
            raise

    @staticmethod
    def _extract_suggestions(text: str) -> List[str]:
        """Extrai sugestões simples da resposta do modelo."""
        suggestions = [
            line.strip("- ").strip()
            for line in text.splitlines()
            if line.strip().startswith("-")
        ]
        return suggestions[:5]

    @staticmethod
    def _extract_references(text: str) -> List[str]:
        """Extrai referências mencionadas na resposta."""
        references: List[str] = []
        normalized = text.lower()

        if any(term in normalized for term in ("pronas", "pcd", "sus", "ministério da saúde")):
            references.append("Legislação PRONAS/PCD")
        if "anexo" in normalized:
            references.append("Anexos do projeto")
        return references

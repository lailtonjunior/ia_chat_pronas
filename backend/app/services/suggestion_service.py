"""
Serviço dedicado a sugestões assistidas por IA para o editor.
"""

from typing import Dict, Any

from app.services.openai_service import OpenAIService


class SuggestionService:
    """Encapsula geração de sugestões de melhoria a partir de trechos."""

    def __init__(self) -> None:
        self.openai_service = OpenAIService()

    async def generate_contextual_suggestion(
        self,
        project_title: str,
        section: str,
        selected_text: str,
        improvement_type: str = 'general',
    ) -> Dict[str, Any]:
        """Gera a sugestão textual usando OpenAIService."""

        improved_text = await self.openai_service.generate_improvement_suggestion(
            section=section or project_title,
            current_text=selected_text,
            improvement_type=improvement_type,
        )

        return {
            "section": section or project_title,
            "original_text": selected_text,
            "suggested_text": improved_text,
            "improvement_type": improvement_type,
        }

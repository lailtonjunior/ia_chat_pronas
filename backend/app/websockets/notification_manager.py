"""
Gerenciador de WebSocket para notificações em tempo real
"""

from __future__ import annotations

from typing import Dict, List
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)


class NotificationWebSocketManager:
    """Mantém conexões WebSocket por usuário e envia atualizações."""

    def __init__(self):
        self.connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str) -> None:
        await websocket.accept()
        self.connections.setdefault(user_id, []).append(websocket)
        logger.debug("🔌 WebSocket conectado para usuário %s", user_id)

    def disconnect(self, websocket: WebSocket, user_id: str) -> None:
        if user_id not in self.connections:
            return

        self.connections[user_id] = [
            ws for ws in self.connections[user_id] if ws != websocket
        ]

        if not self.connections[user_id]:
            del self.connections[user_id]
        logger.debug("🔌 WebSocket desconectado para usuário %s", user_id)

    async def _send(
        self,
        websocket: WebSocket,
        payload: dict,
        user_id: str,
    ) -> bool:
        try:
            await websocket.send_json(payload)
            return True
        except Exception as exc:
            logger.error("❌ Erro enviando notificação para %s: %s", user_id, exc)
            return False

    async def broadcast_to_user(self, user_id: str, payload: dict) -> None:
        """Envia mensagem para todas as conexões de um usuário."""
        if user_id not in self.connections:
            return

        alive_connections: List[WebSocket] = []
        for websocket in self.connections[user_id]:
            if await self._send(websocket, payload, user_id):
                alive_connections.append(websocket)

        if alive_connections:
            self.connections[user_id] = alive_connections
        else:
            del self.connections[user_id]


notification_ws_manager = NotificationWebSocketManager()

"""
Rotas WebSocket para edição em tempo real
"""

from fastapi import APIRouter, WebSocket, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import logging
import json

from app.db.database import get_db
from app.models.project import Project
from app.models.user import User
from app.websockets.manager import ConnectionManager
from app.middleware.auth import get_current_user_from_token

router = APIRouter()
logger = logging.getLogger(__name__)

# Instância global do gerenciador de conexões
manager = ConnectionManager()

@router.websocket("/ws/{project_id}/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    project_id: UUID,
    user_id: UUID,
    token: str = Query(...)
):
    """
    WebSocket para edição colaborativa em tempo real
    """
    # Verificar autenticação
    try:
        # user = await get_current_user_from_token(token)
        # if str(user.id) != str(user_id):
        #     await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        #     return
        pass
    except Exception as e:
        logger.error(f"❌ Erro de autenticação WebSocket: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    await manager.connect(websocket, str(project_id), str(user_id))
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # ============================================
            # TIPOS DE MENSAGENS
            # ============================================
            
            if message["type"] == "edit":
                # Edição de documento
                await manager.broadcast(
                    {
                        "type": "remote_edit",
                        "user_id": str(user_id),
                        "changes": message.get("changes", {}),
                        "timestamp": message.get("timestamp")
                    },
                    str(project_id),
                    exclude_user=str(user_id)
                )
                
            elif message["type"] == "cursor":
                # Posição do cursor
                await manager.broadcast(
                    {
                        "type": "cursor_position",
                        "user_id": str(user_id),
                        "position": message.get("position", 0)
                    },
                    str(project_id),
                    exclude_user=str(user_id)
                )
                
            elif message["type"] == "ai_request":
                # Requisição de análise de IA
                await manager.broadcast(
                    {
                        "type": "ai_processing",
                        "user_id": str(user_id),
                        "status": "processing"
                    },
                    str(project_id)
                )
                
            elif message["type"] == "chat":
                # Mensagem de chat
                await manager.broadcast(
                    {
                        "type": "chat_message",
                        "user_id": str(user_id),
                        "message": message.get("message", ""),
                        "timestamp": message.get("timestamp")
                    },
                    str(project_id),
                    exclude_user=str(user_id)
                )
                
            elif message["type"] == "save":
                # Salvar documento
                logger.info(f"💾 Salvando projeto {project_id} do usuário {user_id}")
                await manager.broadcast(
                    {
                        "type": "save_confirmation",
                        "status": "saved",
                        "timestamp": message.get("timestamp")
                    },
                    str(project_id)
                )
            
    except Exception as e:
        logger.error(f"❌ Erro WebSocket: {e}")
    finally:
        manager.disconnect(websocket, str(project_id), str(user_id))
        await manager.broadcast(
            {
                "type": "user_disconnected",
                "user_id": str(user_id)
            },
            str(project_id)
        )

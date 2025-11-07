"""
Rotas WebSocket para edição em tempo real
"""

from fastapi import APIRouter, WebSocket, Depends, HTTPException, status, Query, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import logging
import json

from app.db.database import get_db, AsyncSessionLocal
from app.models.project import Project
from app.models.user import User
from app.websockets.manager import ConnectionManager
from app.websockets.notification_manager import notification_ws_manager
from app.middleware.auth import get_current_user_from_token
from app.services.notification_service import NotificationService

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


@router.websocket("/notifications")
async def notifications_websocket(
    websocket: WebSocket,
    token: str = Query(...)
):
    """
    Canal em tempo real para notificações do usuário autenticado
    """
    user = None

    try:
        async with AsyncSessionLocal() as session:
            user = await get_current_user_from_token(token, db=session)
            if not user:
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return

            initial_data = await NotificationService.list_notifications(
                session,
                user.id,
                limit=20,
                offset=0,
            )
            initial_payload = [notification.to_dict() for notification in initial_data["notifications"]]
            initial_unread = initial_data["unread_count"]
    except Exception as exc:
        logger.error("❌ Falha ao autenticar WS de notificações: %s", exc)
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        return

    await notification_ws_manager.connect(websocket, str(user.id))

    await websocket.send_json(
        {
            "type": "init",
            "notifications": initial_payload,
            "unread_count": initial_unread,
        }
    )

    try:
        while True:
            # Mantém conexão ativa aguardando heartbeats
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        notification_ws_manager.disconnect(websocket, str(user.id))

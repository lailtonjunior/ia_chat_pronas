"""
Gerenciador de conexões WebSocket - CORRIGIDO
"""

from typing import List, Dict, Set
from fastapi import WebSocket
import logging
import json
from datetime import datetime

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Gerencia conexões WebSocket para edição colaborativa"""
    
    def __init__(self):
        # Dicionário: document_id -> lista de tuplas (websocket, user_id)
        self.active_connections: Dict[str, List[tuple[WebSocket, str]]] = {}
        
        # Dicionário: user_id -> document_id
        self.user_documents: Dict[str, str] = {}
        
        # Dicionário: document_id -> conjunto de user_ids
        self.document_users: Dict[str, Set[str]] = {}
    
    async def connect(self, websocket: WebSocket, document_id: str, user_id: str):
        """Conecta um usuário a um documento"""
        await websocket.accept()
        
        if document_id not in self.active_connections:
            self.active_connections[document_id] = []
            self.document_users[document_id] = set()
        
        self.active_connections[document_id].append((websocket, user_id))
        self.user_documents[user_id] = document_id
        self.document_users[document_id].add(user_id)
        
        logger.info(f"✅ Usuário {user_id} conectado ao documento {document_id}")
        logger.info(f"📊 Usuários no documento: {len(self.document_users[document_id])}")
        
        await self.broadcast(
            {
                "type": "user_joined",
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat(),
                "active_users": len(self.document_users[document_id])
            },
            document_id,
            exclude_user=user_id
        )
    
    def disconnect(self, websocket: WebSocket, document_id: str, user_id: str = None):
        """Desconecta um usuário de um documento"""
        if document_id in self.active_connections:
            # Remover a conexão específica
            self.active_connections[document_id] = [
                (ws, uid) for ws, uid in self.active_connections[document_id]
                if ws != websocket
            ]
            
            if not self.active_connections[document_id]:
                del self.active_connections[document_id]
                if document_id in self.document_users:
                    del self.document_users[document_id]
        
        if user_id:
            if user_id in self.user_documents:
                del self.user_documents[user_id]
            
            if document_id in self.document_users:
                self.document_users[document_id].discard(user_id)
        
        logger.info(f"👋 Usuário {user_id} desconectado do documento {document_id}")
    
    async def broadcast(
        self,
        message: dict,
        document_id: str,
        exclude_user: str = None
    ):
        """Envia mensagem para todos os usuários de um documento"""
        if document_id not in self.active_connections:
            return
        
        disconnected = []
        
        for connection, uid in self.active_connections[document_id]:
            # Pular se for o usuário a excluir
            if exclude_user and uid == exclude_user:
                continue
            
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"❌ Erro ao enviar mensagem para {uid}: {e}")
                disconnected.append((connection, uid))
        
        # Limpar conexões mortas
        for conn, uid in disconnected:
            if document_id in self.active_connections:
                self.active_connections[document_id] = [
                    (ws, user) for ws, user in self.active_connections[document_id]
                    if ws != conn
                ]
    
    async def send_to_user(
        self,
        message: dict,
        document_id: str,
        user_id: str
    ):
        """Envia mensagem para um usuário específico"""
        if document_id not in self.active_connections:
            return
        
        for connection, uid in self.active_connections[document_id]:
            if uid == user_id:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"❌ Erro ao enviar para usuário {user_id}: {e}")
    
    def get_active_users(self, document_id: str) -> List[str]:
        """Retorna lista de usuários ativos em um documento"""
        return list(self.document_users.get(document_id, set()))
    
    def get_document_user_count(self, document_id: str) -> int:
        """Retorna número de usuários em um documento"""
        return len(self.document_users.get(document_id, set()))
    
    async def send_ai_suggestion(
        self,
        document_id: str,
        suggestion: dict
    ):
        """Envia sugestão de IA em tempo real para todos os usuários"""
        await self.broadcast(
            {
                "type": "ai_suggestion",
                "suggestion": suggestion,
                "timestamp": datetime.utcnow().isoformat()
            },
            document_id
        )
    
    async def send_ai_analysis_complete(
        self,
        document_id: str,
        analysis_result: dict
    ):
        """Notifica término de análise de IA"""
        await self.broadcast(
            {
                "type": "ai_analysis_complete",
                "result": analysis_result,
                "timestamp": datetime.utcnow().isoformat()
            },
            document_id
        )
    
    async def send_document_update(
        self,
        document_id: str,
        user_id: str,
        changes: dict
    ):
        """Transmite atualizações de documento para colaboradores"""
        await self.broadcast(
            {
                "type": "document_update",
                "user_id": user_id,
                "changes": changes,
                "timestamp": datetime.utcnow().isoformat()
            },
            document_id,
            exclude_user=user_id
        )

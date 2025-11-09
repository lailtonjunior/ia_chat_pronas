"""
Exports das rotas
"""

from app.routes import auth, projects, documents, ai_analysis, websocket_route, notifications

__all__ = ["auth", "projects", "documents", "ai_analysis", "websocket_route", "notifications"]

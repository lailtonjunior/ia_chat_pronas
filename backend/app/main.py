"""
Sistema PRONAS/PCD com IA - Backend Principal
Desenvolvido para: srv1062121.hstgr.cloud
Modelo IA: ft:gpt-4o-2024-08-06:primeproject:pronas-pcd-2025-v1:CVhthPNE
"""

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
from datetime import datetime

# Imports locais
from app.config import settings
from app.db.database import engine, init_db
from app.routes import auth, projects, documents, ai_analysis, websocket_route, notifications
from app.middleware.cors import setup_cors

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Lifespan para gerenciar startup e shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia ciclo de vida da aplicação"""
    # Startup
    logger.info("🚀 Iniciando aplicação PRONAS/PCD com IA...")
    logger.info(f"🏥 Servidor: {settings.SERVER_HOST}")
    logger.info(f"🤖 Modelo OpenAI: {settings.OPENAI_MODEL}")
    logger.info(f"🤖 Modelo Gemini: {settings.GEMINI_MODEL}")
    
    # Inicializar banco de dados
    await init_db()
    logger.info("✅ Banco de dados inicializado")
    
    yield
    
    # Shutdown
    logger.info("👋 Encerrando aplicação...")

# Criar aplicação FastAPI
app = FastAPI(
    title="Sistema PRONAS/PCD com IA",
    description="Sistema inteligente para criação e análise de projetos PRONAS/PCD",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar CORS
setup_cors(app)

# ============================================
# ROTAS DA API
# ============================================

# Health check
@app.get("/health")
async def health_check():
    """Verifica saúde da aplicação"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "server": settings.SERVER_HOST,
        "environment": settings.ENVIRONMENT
    }

# Root
@app.get("/")
async def root():
    """Endpoint raiz"""
    return {
        "message": "Sistema PRONAS/PCD com IA",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

# Incluir routers
app.include_router(auth.router, prefix="/api/auth", tags=["Autenticação"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projetos"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documentos"])
app.include_router(ai_analysis.router, prefix="/api/ai", tags=["Análise IA"])
app.include_router(websocket_route.router, prefix="/ws", tags=["WebSocket"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notificações"])

# ============================================
# TRATAMENTO DE ERROS GLOBAL
# ============================================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Tratamento global de exceções"""
    logger.error(f"Erro não tratado: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Erro interno do servidor",
            "message": str(exc)
        }
    )

# ============================================
# EVENTO DE STARTUP (ALTERNATIVO)
# ============================================

@app.on_event("startup")
async def startup_event():
    """Executado no startup da aplicação"""
    logger.info("🎯 Aplicação pronta para receber requisições")

@app.on_event("shutdown")
async def shutdown_event():
    """Executado no shutdown da aplicação"""
    logger.info("🔚 Aplicação finalizada")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

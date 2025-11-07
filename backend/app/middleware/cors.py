"""
Configuração de CORS
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.config import settings

logger = logging.getLogger(__name__)

def setup_cors(app: FastAPI):
    """
    Configura CORS para a aplicação
    """
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=600
    )
    
    logger.info(f"✅ CORS configurado com origens: {settings.cors_origins_list}")

"""
Funções para gerenciar JWT tokens
"""

from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import logging

from app.config import settings

logger = logging.getLogger(__name__)

def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Cria um JWT access token
    """
    try:
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
        
        to_encode.update({"exp": expire})
        
        encoded_jwt = jwt.encode(
            to_encode,
            settings.JWT_SECRET,
            algorithm=settings.JWT_ALGORITHM
        )
        
        logger.info(f"✅ Token criado para: {data.get('email', 'usuário')}")
        
        return encoded_jwt
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar token: {e}")
        raise

def verify_token(token: str) -> Dict[str, Any]:
    """
    Verifica e decodifica um JWT token
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        return payload
        
    except JWTError as e:
        logger.error(f"❌ Erro ao verificar token: {e}")
        raise

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodifica um token sem verificar expiração
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_exp": False}
        )
        return payload
    except JWTError as e:
        logger.error(f"❌ Erro ao decodificar token: {e}")
        return None

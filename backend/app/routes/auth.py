"""
Rotas de Autenticação - CORRIGIDO
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from google.oauth2 import id_token
from google.auth.transport import requests
from datetime import datetime, timedelta
import logging

from app.db.database import get_db
from app.models.user import User
from app.schemas.user import GoogleLoginRequest, GoogleLoginResponse, UserResponse
from app.utils.jwt_handler import create_access_token
from app.config import settings
from app.middleware.auth import get_current_user  # ✅ CORRIGIDO

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/google-login", response_model=GoogleLoginResponse)
async def google_login(
    login_data: GoogleLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Login com Google OAuth"""
    try:
        idinfo = id_token.verify_oauth2_token(
            login_data.id_token,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
        
        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', email.split('@')[0])
        picture_url = idinfo.get('picture')
        
        if email != login_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email não corresponde ao token"
            )
        
        result = await db.execute(
            select(User).where(User.google_id == google_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            user = User(
                email=email,
                name=name,
                google_id=google_id,
                picture_url=picture_url,
                is_verified=True,
                last_login=datetime.utcnow()
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            logger.info(f"✅ Novo usuário criado: {email}")
        else:
            user.last_login = datetime.utcnow()
            user.picture_url = picture_url
            await db.commit()
            logger.info(f"✅ Usuário logado: {email}")
        
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email}
        )
        
        return GoogleLoginResponse(
            access_token=access_token,
            user=UserResponse.model_validate(user)
        )
        
    except ValueError as e:
        logger.error(f"❌ Erro ao verificar token Google: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token Google inválido"
        )
    except Exception as e:
        logger.error(f"❌ Erro no login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao fazer login: {str(e)}"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_route(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)  # ✅ CORRIGIDO
):
    """Retorna informações do usuário atual"""
    return UserResponse.model_validate(current_user)

@router.post("/logout")
async def logout():
    """Logout (client-side remove o token)"""
    return {"message": "Logout realizado com sucesso"}


@router.post("/_log")
async def nextauth_log(payload: dict | None = None):
    """Endpoint compatível com NextAuth/_log para evitar 404 no backend."""
    if payload:
        logger.debug("NextAuth log payload: %s", payload)
    return {"status": "ok"}

"""
Schemas Pydantic para Usuário
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class UserBase(BaseModel):
    """Schema base de usuário"""
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=255)

class UserCreate(UserBase):
    """Schema para criar usuário"""
    google_id: str
    picture_url: Optional[str] = None

class UserUpdate(BaseModel):
    """Schema para atualizar usuário"""
    name: Optional[str] = None
    picture_url: Optional[str] = None

class UserResponse(UserBase):
    """Schema de resposta de usuário"""
    id: UUID
    google_id: str
    picture_url: Optional[str]
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True

class GoogleLoginRequest(BaseModel):
    """Schema para login com Google"""
    id_token: str
    email: EmailStr

class GoogleLoginResponse(BaseModel):
    """Schema de resposta do login"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

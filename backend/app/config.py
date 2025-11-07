"""
Configurações da aplicação
Carrega variáveis de ambiente e define constantes
"""

from pydantic_settings import BaseSettings
from pydantic import Field, model_validator
from typing import List, Optional
from sqlalchemy.engine.url import URL, make_url


class Settings(BaseSettings):
    """Configurações gerais da aplicação"""
    
    # ============================================
    # AMBIENTE
    # ============================================
    ENVIRONMENT: str = "production"
    DEBUG: bool = False
    
    # ============================================
    # SERVIDOR
    # ============================================
    SERVER_HOST: str = "72.60.255.80"
    SERVER_DOMAIN: str = "srv1062121.hstgr.cloud"
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    
    # ============================================
    # BANCO DE DADOS
    # ============================================
    DATABASE_URL: Optional[str] = Field(None, description="URL de conexão com banco de dados")
    POSTGRES_USER: str = Field("pronas_admin", description="Usuário do PostgreSQL")
    POSTGRES_PASSWORD: str = Field(..., description="Senha do PostgreSQL")
    POSTGRES_DB: str = Field("pronas_pcd_db", description="Nome do banco de dados")
    POSTGRES_HOST: str = Field("postgres", description="Host do PostgreSQL")
    POSTGRES_PORT: int = Field(5432, description="Porta do PostgreSQL")
    
    # ============================================
    # REDIS
    # ============================================
    REDIS_HOST: str = Field("redis", description="Host do Redis")
    REDIS_PORT: int = Field(6379, description="Porta do Redis")
    REDIS_PASSWORD: str = Field(..., description="Senha do Redis")
    
    # ============================================
    # OPENAI - MODELO FINE-TUNED
    # ============================================
    OPENAI_API_KEY: str = Field(..., description="Chave API OpenAI")
    OPENAI_MODEL: str = Field(
        "ft:gpt-4o-2024-08-06:primeproject:pronas-pcd-2025-v1:CVhthPNE",
        description="Modelo OpenAI fine-tuned"
    )
    OPENAI_MAX_TOKENS: int = Field(4000, description="Máximo de tokens OpenAI")
    OPENAI_TEMPERATURE: float = Field(0.7, description="Temperatura OpenAI")
    
    # ============================================
    # GOOGLE GEMINI
    # ============================================
    GEMINI_API_KEY: str = Field(..., description="Chave API Google Gemini")
    GEMINI_MODEL: str = Field("gemini-2.5-flash", description="Modelo Gemini")
    
    # ============================================
    # GOOGLE OAUTH
    # ============================================
    GOOGLE_CLIENT_ID: str = Field(..., description="Google OAuth Client ID")
    GOOGLE_CLIENT_SECRET: str = Field(..., description="Google OAuth Client Secret")
    
    # ============================================
    # JWT
    # ============================================
    JWT_SECRET: str = Field(..., description="Chave secreta JWT")
    JWT_ALGORITHM: str = Field("HS256", description="Algoritmo JWT")
    JWT_EXPIRATION_HOURS: int = Field(24, description="Horas de expiração JWT")
    
    # ============================================
    # CORS
    # ============================================
    CORS_ORIGINS: str = Field("*", description="Origens CORS permitidas")
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Converte string de origens em lista"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    # ============================================
    # UPLOADS
    # ============================================
    UPLOAD_MAX_SIZE: int = Field(52428800, description="Tamanho máximo de upload (50MB)")
    UPLOAD_PATH: str = Field("/app/uploads", description="Caminho para uploads")
    ALLOWED_EXTENSIONS: List[str] = Field(
        ["pdf", "docx", "xlsx", "jpg", "png"],
        description="Extensões de arquivo permitidas"
    )
    
    # ============================================
    # LOGS
    # ============================================
    LOG_LEVEL: str = Field("INFO", description="Nível de log")
    LOG_FILE: str = Field("/app/logs/app.log", description="Arquivo de log")
    
    # ============================================
    # SEGURANÇA
    # ============================================
    RATE_LIMIT_PER_MINUTE: int = Field(60, description="Limite de requisições por minuto")
    SESSION_TIMEOUT_MINUTES: int = Field(120, description="Timeout de sessão em minutos")
    
    @model_validator(mode="after")
    def ensure_database_url(cls, values: "Settings") -> "Settings":
        """
        Garante que DATABASE_URL esteja corretamente montada e com credenciais escapadas.
        """
        try:
            parsed_url = make_url(values.DATABASE_URL) if values.DATABASE_URL else None
        except Exception:
            parsed_url = None

        if not parsed_url:
            parsed_url = URL.create(
                "postgresql+asyncpg",
                username=values.POSTGRES_USER,
                password=values.POSTGRES_PASSWORD,
                host=values.POSTGRES_HOST,
                port=values.POSTGRES_PORT,
                database=values.POSTGRES_DB,
            )
        else:
            parsed_url = parsed_url.set(
                drivername="postgresql+asyncpg",
                username=values.POSTGRES_USER or parsed_url.username,
                password=values.POSTGRES_PASSWORD or parsed_url.password,
                host=values.POSTGRES_HOST or parsed_url.host,
                port=values.POSTGRES_PORT or parsed_url.port,
                database=values.POSTGRES_DB or parsed_url.database,
            )

        values.DATABASE_URL = parsed_url.render_as_string(hide_password=False)
        return values
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"  # Permite variáveis extras do .env


# Instanciar configurações
settings = Settings()

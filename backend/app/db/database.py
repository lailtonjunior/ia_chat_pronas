"""
Configuração de conexão com banco de dados
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """Base declarativa para os modelos."""
    pass


# ✅ Usar DATABASE_URL do .env
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# Criar session factory
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db():
    """Função para obter sessão do banco de dados"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            logger.error(f"Erro na sessão do banco: {str(e)}")
            raise
        finally:
            await session.close()


async def init_db():
    """Inicializar banco de dados"""
    from app.db.base import Base
    
    async with engine.begin() as conn:
        # Ajustar colunas enumeradas existentes para tipos texto
        enum_conversions = [
            ("projects", "project_type", "projecttype", "'PRONAS'"),
            ("projects", "status", "projectstatus", "'draft'"),
            ("ai_analyses", "provider", "aiprovider", None),
            ("ai_analyses", "analysis_type", "analysistype", None),
        ]

        for table, column, enum_name, default_value in enum_conversions:
            set_default_sql = ""
            if default_value is not None:
                set_default_sql = f'ALTER TABLE "{table}" ALTER COLUMN "{column}" SET DEFAULT {default_value};'

            conversion_sql = f"""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = '{table}'
                      AND column_name = '{column}'
                      AND udt_name = '{enum_name}'
                ) THEN
                    ALTER TABLE "{table}"
                    ALTER COLUMN "{column}"
                    DROP DEFAULT;

                    ALTER TABLE "{table}"
                    ALTER COLUMN "{column}"
                    TYPE VARCHAR
                    USING "{column}"::text;

                    {set_default_sql}
                END IF;
            END $$;
            """
            await conn.exec_driver_sql(conversion_sql)

        # Remover tipos ENUM antigos que não são mais utilizados
        enum_types = ["projecttype", "projectstatus", "aiprovider", "analysistype"]
        for enum_name in enum_types:
            drop_sql = f'DROP TYPE IF EXISTS "{enum_name}" CASCADE;'
            await conn.exec_driver_sql(drop_sql)

        await conn.run_sync(lambda sync_conn: Base.metadata.create_all(bind=sync_conn, checkfirst=True))


async def close_db():
    """Fechar conexão com banco de dados"""
    await engine.dispose()

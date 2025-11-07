"""
Alembic environment script para gerenciar migrations
"""

from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os
from app.config import settings
from app.db.base import Base

# This is the Alembic Config object, which provides
# the values of the [alembic] section of the setup.cfg
# file in addition to the command line options passed to the
# script's command line arguments. They are very convenient
# as they can be modified programmatically before feeding them
# to the command functions
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = Base.metadata

# other values from the config, defined by the [alembic] section
# as well as those in the "alembic.ini" file, can be accessed
# here by using the `config.get_section(method_name)` instead of
# using `get_section` method.
#
# config.get_section(config.config_name)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""

    configuration = config.get_section(config.config_name)
    configuration["sqlalchemy.url"] = settings.DATABASE_URL

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""

    configuration = config.get_section(config.config_name)
    configuration["sqlalchemy.url"] = settings.DATABASE_URL

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

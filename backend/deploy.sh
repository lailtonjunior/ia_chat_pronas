#!/usr/bin/env bash

# ============================================
# Script de Deploy - PRONAS/PCD Backend
# ============================================

set -euo pipefail
IFS=$'\n\t'

# Paleta de cores para logs
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
RESET='\033[0m'

log_info()  { printf "%b[INFO]%b %s\n"  "${YELLOW}" "${RESET}" "$*"; }
log_step()  { printf "%b[STEP]%b %s\n"  "${GREEN}" "${RESET}" "$*"; }
log_error() { printf "%b[ERRO]%b %s\n"  "${RED}" "${RESET}" "$*"; }

trap 'log_error "Deploy interrompido (status $?)."; exit 1' ERR

# Caminhos importantes
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.yml"
ENV_FILE="${PROJECT_ROOT}/.env"

# Garantir que estamos no repositório certo
if [[ ! -f "${COMPOSE_FILE}" ]]; then
  log_error "Arquivo docker-compose.yml não encontrado em ${PROJECT_ROOT}."
fi

# Verificar dependências básicas
if ! command -v docker >/dev/null 2>&1; then
  log_error "Docker não encontrado. Instale-o antes de continuar."
fi

if docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  DOCKER_COMPOSE=(docker-compose)
else
  log_error "docker compose não encontrado. Instale Docker Compose v1 ou v2."
fi

log_info "Iniciando deploy do backend..."

# Carregar variáveis de ambiente se o arquivo existir
if [[ -f "${ENV_FILE}" ]]; then
  log_step "Carregando variáveis de ambiente de ${ENV_FILE}"
  # shellcheck disable=SC1090
  set -a
  source "${ENV_FILE}"
  set +a
else
  log_info "Arquivo .env não encontrado. Certifique-se de exportar as variáveis manualmente."
fi

# Construir imagem do backend
log_step "Construindo imagem Docker do backend"
"${DOCKER_COMPOSE[@]}" -f "${COMPOSE_FILE}" build backend

# Executar migrações do banco via Alembic
log_step "Aplicando migrações (alembic upgrade head)"
"${DOCKER_COMPOSE[@]}" -f "${COMPOSE_FILE}" run --rm backend \
  alembic -c alembic/alembic.ini upgrade head

# Subir o serviço do backend
log_step "Recriando serviço backend em modo detached"
"${DOCKER_COMPOSE[@]}" -f "${COMPOSE_FILE}" up -d backend

log_info "Deploy do backend concluído com sucesso."

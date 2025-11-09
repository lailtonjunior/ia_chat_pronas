## Setup rápido

1. **Backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env  # ajuste as credenciais (DB, Redis, AWS/SES, S3)
   alembic upgrade head
   uvicorn app.main:app --reload --port 8000
   ```
   - Workers: `celery -A app.celery_app.celery_app worker -l info`
   - Beat: `celery -A app.celery_app.celery_app beat -l info`

2. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Serviços adicionais**
   - Docker Compose possui serviços `backend`, `frontend`, `worker` e `celery_beat`.
   - Redis é usado tanto para cache/notificações quanto para rate limiting (`fastapi-limiter`) e Celery.

### Principais recursos implementados nesta fase
- Celery integrado com Redis para envio de e-mail, digest diário, geração de relatórios PDF/DOCX (WeasyPrint/python-docx) e backups automáticos (boto3 → S3).
- Sistema de notificações multicanal com status, preferências refinadas e WebSocket em tempo real.
- Workflow de aprovação: comentários, etapas, rotas de submissão/aprovação/rejeição e notificações correspondentes.
- Versionamento automático de `Project` e `Document` via `sqlalchemy-continuum`, com endpoints para histórico/diff/rollback.
- Relatórios exportados e armazenados/uploadados, com monitoramento via `GeneratedReport`.
- Segurança ampliada: rate limiting granular com `fastapi-limiter`, campos para 2FA e hooks para auditoria (`AuditLog`).
- Fundamentos UX: PWA (next-pwa/manifest), dark mode (next-themes) e onboarding inicial com `react-joyride`.

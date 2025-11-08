## Setup rápido

1. **Instale dependências do backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Configure variáveis de ambiente**
   - Use `backend/.env` (ou copie de `backend/.env.example`).  
   - Ajuste `DATABASE_URL` ou os pares `POSTGRES_*`, além de chaves externas (Google, OpenAI, Redis, JWT etc.).

3. **Execute as migrações**
   ```bash
   cd backend
   alembic upgrade head
   ```
   O `env.py` já injeta o diretório `backend` no `PYTHONPATH`, permitindo importar `app.config`.

4. **Suba a API**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

5. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

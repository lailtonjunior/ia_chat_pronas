-- ============================================
-- INICIALIZAÇÃO DO BANCO DE DADOS PRONAS/PCD
-- ============================================

-- Extensões PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- ============================================
-- TABELAS
-- ============================================

-- Usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    picture_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Projetos PRONAS/PCD
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    project_type VARCHAR(50) DEFAULT 'PRONAS',
    status VARCHAR(50) DEFAULT 'draft',
    institution_name VARCHAR(500),
    institution_cnpj VARCHAR(18),
    institution_address TEXT,
    
    -- Anexos PRONAS
    annex_1 JSONB,
    annex_2 JSONB,
    annex_3 JSONB,
    annex_4 JSONB,
    annex_5 JSONB,
    annex_6 JSONB,
    annex_7 JSONB,
    
    -- Conteúdo
    content JSONB,
    
    -- Análises de IA
    openai_analysis JSONB,
    gemini_analysis JSONB,
    combined_score INTEGER DEFAULT 0,
    
    -- Metadados
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    analyzed_at TIMESTAMP,
    submitted_at TIMESTAMP
);

-- Documentos (PDFs, anexos)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(200),
    is_processed INTEGER DEFAULT 0,
    extracted_text TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Análises de IA
CREATE TABLE IF NOT EXISTS ai_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    analysis_type VARCHAR(50) NOT NULL,
    result JSONB NOT NULL,
    score INTEGER DEFAULT 0,
    section_analyzed VARCHAR(200),
    tokens_used INTEGER DEFAULT 0,
    processing_time INTEGER DEFAULT 0,
    suggestions JSONB,
    critical_issues JSONB,
    warnings JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_project_id ON documents(project_id);
CREATE INDEX idx_ai_analyses_project_id ON ai_analyses(project_id);
CREATE INDEX idx_ai_analyses_provider ON ai_analyses(provider);

-- ============================================
-- VIEWS
-- ============================================

-- View: Projetos com Contagem de Análises
CREATE OR REPLACE VIEW project_stats AS
SELECT 
    p.id,
    p.user_id,
    p.title,
    p.status,
    p.combined_score,
    COUNT(a.id) as analysis_count,
    COUNT(d.id) as document_count,
    p.created_at,
    p.updated_at
FROM projects p
LEFT JOIN ai_analyses a ON p.id = a.project_id
LEFT JOIN documents d ON p.id = d.project_id
GROUP BY p.id, p.user_id, p.title, p.status, p.combined_score, p.created_at, p.updated_at;

-- ============================================
-- FUNÇÕES
-- ============================================

-- Função: Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PERMISSÕES
-- ============================================

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pronas_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pronas_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO pronas_admin;

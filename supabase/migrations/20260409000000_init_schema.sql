-- 0. Criar o Schema "Mercado Agentes" para isolamento total
CREATE SCHEMA IF NOT EXISTS mercado_agentes;

-- Iniciar Extensões Necessárias no nível público (usadas por todos)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Empresas (Tenants)
CREATE TABLE IF NOT EXISTS mercado_agentes.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    plan TEXT DEFAULT 'free',
    status TEXT DEFAULT 'active',
    logo_url TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Perfis de Usuários vinculados a Empresas
-- Obs: Estende a tabela auth.users do Supabase
CREATE TABLE IF NOT EXISTS mercado_agentes.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES mercado_agentes.companies(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'member', -- admin, member, viewer
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Agentes de IA
CREATE TABLE IF NOT EXISTS mercado_agentes.agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES mercado_agentes.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    system_prompt TEXT,
    temperature FLOAT DEFAULT 0.7,
    provider TEXT DEFAULT 'openai',
    model TEXT DEFAULT 'gpt-4o',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CRM / Leads
CREATE TABLE IF NOT EXISTS mercado_agentes.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES mercado_agentes.companies(id) ON DELETE CASCADE,
    name TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    status TEXT DEFAULT 'new', -- new, interacting, booked, won, lost
    last_interaction TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Logs de Mensagens e Uso (Cota)
CREATE TABLE IF NOT EXISTS mercado_agentes.usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES mercado_agentes.companies(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES mercado_agentes.agents(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- inbound, outbound
    tokens INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS em todas as tabelas do schema
ALTER TABLE mercado_agentes.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE mercado_agentes.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mercado_agentes.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE mercado_agentes.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE mercado_agentes.usage_logs ENABLE ROW LEVEL SECURITY;

-- Exemplo de Política RLS: Usuários só veem dados da própria empresa
CREATE POLICY "Users can see their own company" ON mercado_agentes.companies
    FOR SELECT USING (id IN (SELECT company_id FROM mercado_agentes.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage agents of their own company" ON mercado_agentes.agents
    FOR ALL USING (company_id IN (SELECT company_id FROM mercado_agentes.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage leads of their own company" ON mercado_agentes.leads
    FOR ALL USING (company_id IN (SELECT company_id FROM mercado_agentes.profiles WHERE id = auth.uid()));

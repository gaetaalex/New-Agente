-- 1. Empresas (Tenants)
CREATE TABLE IF NOT EXISTS public.na_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    plan TEXT DEFAULT 'free',
    is_active BOOLEAN DEFAULT true
);

-- 2. Perfis de Usuário
CREATE TABLE IF NOT EXISTS public.na_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.na_companies(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT DEFAULT 'user', -- admin, user
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Agentes de IA
CREATE TABLE IF NOT EXISTS public.na_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.na_companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    system_prompt TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CRM / Leads
CREATE TABLE IF NOT EXISTS public.na_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.na_companies(id) ON DELETE CASCADE,
    name TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    status TEXT DEFAULT 'new',
    last_interaction TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Logs de Uso
CREATE TABLE IF NOT EXISTS public.na_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.na_companies(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.na_agents(id) ON DELETE SET NULL,
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS em tudo
ALTER TABLE public.na_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.na_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.na_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.na_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.na_usage_logs ENABLE ROW LEVEL SECURITY;

-- Políticas Simples para MVP
CREATE POLICY "Users can view their own profile" ON public.na_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view their company data" ON public.na_companies FOR SELECT USING (EXISTS (SELECT 1 FROM public.na_profiles WHERE na_profiles.id = auth.uid() AND na_profiles.company_id = na_companies.id));
CREATE POLICY "Users can view their agents" ON public.na_agents FOR SELECT USING (EXISTS (SELECT 1 FROM public.na_profiles WHERE na_profiles.id = auth.uid() AND na_profiles.company_id = na_agents.company_id));
CREATE POLICY "Users can view their leads" ON public.na_leads FOR SELECT USING (EXISTS (SELECT 1 FROM public.na_profiles WHERE na_profiles.id = auth.uid() AND na_profiles.company_id = na_leads.company_id));

-- Permissões para inserção inicial (MVP bypass)
CREATE POLICY "Allow public signup for profiles" ON public.na_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public signup for companies" ON public.na_companies FOR INSERT WITH CHECK (true);

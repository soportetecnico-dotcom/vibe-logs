-- Migration: Initial Schema for VibeLogs

-- 1. Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#1E4188',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles table (linked to Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('owner', 'manager', 'contributor')) DEFAULT 'contributor',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    client_name TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. User Tasks (Private)
CREATE TABLE IF NOT EXISTS user_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'in-progress', 'done')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Logs (Bitácora Header)
CREATE TABLE IF NOT EXISTS logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE SET NULL,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    report_date DATE DEFAULT CURRENT_DATE,
    summary TEXT,
    learning TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Log Activities (Bitácora Details)
CREATE TABLE IF NOT EXISTS log_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id UUID REFERENCES logs(id) ON DELETE CASCADE,
    activity_description TEXT NOT NULL,
    execution_time TEXT,
    observations TEXT,
    status TEXT CHECK (status IN ('completed', 'pending')) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Log Evidences
CREATE TABLE IF NOT EXISTS log_evidences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id UUID REFERENCES logs(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('link', 'image')) NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_evidences ENABLE ROW LEVEL SECURITY;

-- 7. Policies

-- Organizations: Allow any authenticated user to create an organization
CREATE POLICY "Permitir crear organización a autenticados" ON organizations
    FOR INSERT TO authenticated WITH CHECK (true);

-- Organizations: Allow members to view their organization
CREATE POLICY "Permitir ver organización a miembros" ON organizations
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.org_id = organizations.id AND profiles.id = auth.uid())
    );

-- Profiles: Users can manage their own profile
CREATE POLICY "Gestionar propio perfil" ON profiles
    FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- User Tasks: Private access
CREATE POLICY "Gestionar propias tareas" ON user_tasks
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Projects: Members can manage organization projects
CREATE POLICY "Gestionar proyectos de organización" ON projects
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.org_id = projects.org_id AND profiles.id = auth.uid())
    );

-- Logs: Own logs only
CREATE POLICY "Gestionar propias bitácoras" ON logs
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Log Activities: Indirect access via logs
CREATE POLICY "Gestionar actividades de bitácora" ON log_activities
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM logs WHERE logs.id = log_activities.log_id AND logs.user_id = auth.uid())
    );

-- Log Evidences: Indirect access via logs
CREATE POLICY "Gestionar evidencias de bitácora" ON log_evidences
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM logs WHERE logs.id = log_evidences.log_id AND logs.user_id = auth.uid())
    );

-- Storage: Evidences bucket policies
-- Nota: Asegúrate de que el bucket 'evidences' exista en el panel de Supabase
CREATE POLICY "Permitir subir evidencias" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'evidences');

CREATE POLICY "Permitir ver evidencias" ON storage.objects
    FOR SELECT TO authenticated USING (bucket_id = 'evidences');

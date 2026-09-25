-- ==============================================================
-- AI-Powered Agriculture Crop Advisory Assistant
-- Supabase PostgreSQL Database Schema & RLS Setup
-- Project: txpnsrgwumiofxsrkbyt (https://txpnsrgwumiofxsrkbyt.supabase.co)
-- ==============================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Plots Table
CREATE TABLE IF NOT EXISTS public.plots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    plot_name VARCHAR(255) NOT NULL,
    crop_type VARCHAR(255) NOT NULL,
    acreage NUMERIC(10, 2) NOT NULL,
    region VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Advisories Table
CREATE TABLE IF NOT EXISTS public.advisories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plot_id UUID REFERENCES public.plots(id) ON DELETE CASCADE,
    soil_ph NUMERIC(3, 1) NOT NULL,
    n_level VARCHAR(50) NOT NULL,
    p_level VARCHAR(50) NOT NULL,
    k_level VARCHAR(50) NOT NULL,
    moisture_percent INT NOT NULL,
    weather VARCHAR(50) NOT NULL,
    growth_stage VARCHAR(50) NOT NULL,
    ai_recommendation_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_plots_user_id ON public.plots(user_id);
CREATE INDEX IF NOT EXISTS idx_advisories_plot_id ON public.advisories(plot_id);
CREATE INDEX IF NOT EXISTS idx_advisories_created_at ON public.advisories(created_at DESC);

-- 6. Supabase Row Level Security (RLS) Configuration
ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated/service role full access (managed securely via Node.js backend)
DROP POLICY IF EXISTS "Allow backend service access on users" ON public.users;
CREATE POLICY "Allow backend service access on users" 
    ON public.users FOR ALL 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backend service access on plots" ON public.plots;
CREATE POLICY "Allow backend service access on plots" 
    ON public.plots FOR ALL 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backend service access on advisories" ON public.advisories;
CREATE POLICY "Allow backend service access on advisories" 
    ON public.advisories FOR ALL 
    USING (true) 
    WITH CHECK (true);

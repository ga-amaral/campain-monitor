-- ========================================
-- SCHEMA FOR META ADS MONITORING DASHBOARD
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS public.campaigns (
    id TEXT PRIMARY KEY, -- Meta's Campaign ID
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    objective TEXT,
    spend DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. AD SETS TABLE
CREATE TABLE IF NOT EXISTS public.adsets (
    id TEXT PRIMARY KEY, -- Meta's Ad Set ID
    campaign_id TEXT REFERENCES public.campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    daily_budget DECIMAL(10,2),
    spend DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. ADS TABLE
CREATE TABLE IF NOT EXISTS public.ads (
    id TEXT PRIMARY KEY, -- Meta's Ad ID
    adset_id TEXT REFERENCES public.adsets(id) ON DELETE CASCADE,
    campaign_id TEXT REFERENCES public.campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    creative_id TEXT,
    spend DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. METRICS HISTORY TABLE
-- This table stores daily snapshots of performance metrics for historical analysis
CREATE TABLE IF NOT EXISTS public.metrics_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('campaign', 'adset', 'ad', 'account')),
    entity_id TEXT NOT NULL,
    date DATE NOT NULL,
    
    -- Common Metrics
    spend DECIMAL(10,2) DEFAULT 0,
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    reach INT DEFAULT 0,
    
    -- Specific Meta Ads Metrics
    leads INT DEFAULT 0,
    cpl DECIMAL(10,2) DEFAULT 0, -- Cost Per Lead
    messages INT DEFAULT 0,
    cost_per_message DECIMAL(10,2) DEFAULT 0,
    cpc DECIMAL(10,2) DEFAULT 0,
    ctr DECIMAL(5,2) DEFAULT 0,
    frequency DECIMAL(5,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- Ensure only one record per entity per date
    UNIQUE(entity_type, entity_id, date)
);

-- Set up Row Level Security (RLS)
-- For internal dashboards, we usually authenticate via Service Role from the backend,
-- but if using anon key from frontend, we restrict access.
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adsets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics_history ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users (or anon if needed for local dev)
CREATE POLICY "Allow public read access" ON public.campaigns FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.adsets FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.ads FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.metrics_history FOR SELECT USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Attach triggers
CREATE TRIGGER update_campaigns_modtime BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_adsets_modtime BEFORE UPDATE ON public.adsets FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_ads_modtime BEFORE UPDATE ON public.ads FOR EACH ROW EXECUTE FUNCTION update_modified_column();

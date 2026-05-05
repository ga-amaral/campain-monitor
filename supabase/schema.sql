-- ========================================
-- SCHEMA FOR META ADS MONITORING DASHBOARD
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. AD ACCOUNTS TABLE (linked to users)
CREATE TABLE IF NOT EXISTS public.ad_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    platform TEXT NOT NULL DEFAULT 'meta', -- 'meta', 'google', etc.
    account_id TEXT NOT NULL, -- Meta Ad Account ID
    account_name TEXT,
    access_token TEXT NOT NULL,
    access_token_expires_at TIMESTAMP WITH TIME ZONE,
    refresh_token TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, platform, account_id)
);

-- 3. CAMPAIGNS TABLE (now linked to ad_account)
CREATE TABLE IF NOT EXISTS public.campaigns (
    id TEXT PRIMARY KEY, -- Meta's Campaign ID
    ad_account_id UUID REFERENCES public.ad_accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    objective TEXT,
    spend DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. AD SETS TABLE
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

-- 5. ADS TABLE
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

-- 6. METRICS HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.metrics_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_account_id UUID REFERENCES public.ad_accounts(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('campaign', 'adset', 'ad', 'account')),
    entity_id TEXT NOT NULL,
    date DATE NOT NULL,
    
    spend DECIMAL(10,2) DEFAULT 0,
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    reach INT DEFAULT 0,
    leads INT DEFAULT 0,
    cpl DECIMAL(10,2) DEFAULT 0,
    messages INT DEFAULT 0,
    cost_per_message DECIMAL(10,2) DEFAULT 0,
    cpc DECIMAL(10,2) DEFAULT 0,
    ctr DECIMAL(5,2) DEFAULT 0,
    frequency DECIMAL(5,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    UNIQUE(ad_account_id, entity_type, entity_id, date)
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adsets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics_history ENABLE ROW LEVEL SECURITY;

-- Users: users can read their own data
CREATE POLICY "Users can read own data" ON public.users FOR SELECT USING (auth.uid() = id);

-- Ad Accounts: users can only see their own accounts
CREATE POLICY "Users can manage own ad accounts" ON public.ad_accounts FOR ALL USING (
    user_id IN (SELECT id FROM public.users WHERE auth.uid() = id)
);

-- Campaigns: users only see campaigns from their ad accounts
CREATE POLICY "Users can see own campaigns" ON public.campaigns FOR SELECT USING (
    ad_account_id IN (SELECT id FROM public.ad_accounts WHERE user_id IN (SELECT id FROM public.users WHERE auth.uid() = id))
);

-- AdSets: users only see from their accounts
CREATE POLICY "Users can see own adsets" ON public.adsets FOR SELECT USING (
    campaign_id IN (SELECT id FROM public.campaigns WHERE ad_account_id IN (SELECT id FROM public.ad_accounts WHERE user_id IN (SELECT id FROM public.users WHERE auth.uid() = id)))
);

-- Ads: users only see from their accounts
CREATE POLICY "Users can see own ads" ON public.ads FOR SELECT USING (
    campaign_id IN (SELECT id FROM public.campaigns WHERE ad_account_id IN (SELECT id FROM public.ad_accounts WHERE user_id IN (SELECT id FROM public.users WHERE auth.uid() = id)))
);

-- Metrics: users only see from their accounts
CREATE POLICY "Users can see own metrics" ON public.metrics_history FOR SELECT USING (
    ad_account_id IN (SELECT id FROM public.ad_accounts WHERE user_id IN (SELECT id FROM public.users WHERE auth.uid() = id))
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Attach triggers
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_ad_accounts_modtime BEFORE UPDATE ON public.ad_accounts FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_campaigns_modtime BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_adsets_modtime BEFORE UPDATE ON public.adsets FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_ads_modtime BEFORE UPDATE ON public.ads FOR EACH ROW EXECUTE FUNCTION update_modified_column();
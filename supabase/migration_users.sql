-- ========================================
-- MIGRATION: Add user isolation for Meta Ads
-- Run this in Supabase SQL Editor
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. AD ACCOUNTS TABLE (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.ad_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    platform TEXT NOT NULL DEFAULT 'meta',
    account_id TEXT NOT NULL,
    account_name TEXT,
    access_token TEXT NOT NULL,
    access_token_expires_at TIMESTAMP WITH TIME ZONE,
    refresh_token TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, platform, account_id)
);

-- 2. Add ad_account_id to campaigns
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS ad_account_id UUID REFERENCES public.ad_accounts(id) ON DELETE SET NULL;

-- 3. Add ad_account_id to metrics_history
ALTER TABLE public.metrics_history ADD COLUMN IF NOT EXISTS ad_account_id UUID REFERENCES public.ad_accounts(id) ON DELETE SET NULL;

-- Set up Row Level Security
ALTER TABLE public.ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adsets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics_history ENABLE ROW LEVEL SECURITY;

-- Ad Accounts: users only see their own accounts
DROP POLICY IF EXISTS "Allow public read access" ON public.ad_accounts;
CREATE POLICY "Users can manage own ad accounts" ON public.ad_accounts FOR ALL USING (
    user_id = auth.uid()
);

-- Campaigns: users only see campaigns from their ad accounts
DROP POLICY IF EXISTS "Allow public read access" ON public.campaigns;
CREATE POLICY "Users can see own campaigns" ON public.campaigns FOR SELECT USING (
    ad_account_id IN (SELECT id FROM public.ad_accounts WHERE user_id = auth.uid())
);

-- AdSets: users only see from their accounts
DROP POLICY IF EXISTS "Allow public read access" ON public.adsets;
CREATE POLICY "Users can see own adsets" ON public.adsets FOR SELECT USING (
    campaign_id IN (SELECT id FROM public.campaigns WHERE ad_account_id IN (SELECT id FROM public.ad_accounts WHERE user_id = auth.uid()))
);

-- Ads: users only see from their accounts
DROP POLICY IF EXISTS "Allow public read access" ON public.ads;
CREATE POLICY "Users can see own ads" ON public.ads FOR SELECT USING (
    campaign_id IN (SELECT id FROM public.campaigns WHERE ad_account_id IN (SELECT id FROM public.ad_accounts WHERE user_id = auth.uid()))
);

-- Metrics: users only see from their accounts
DROP POLICY IF EXISTS "Allow public read access" ON public.metrics_history;
CREATE POLICY "Users can see own metrics" ON public.metrics_history FOR SELECT USING (
    ad_account_id IN (SELECT id FROM public.ad_accounts WHERE user_id = auth.uid())
);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Attach triggers
DROP TRIGGER IF EXISTS update_ad_accounts_modtime ON public.ad_accounts;
CREATE TRIGGER update_ad_accounts_modtime BEFORE UPDATE ON public.ad_accounts FOR EACH ROW EXECUTE FUNCTION update_modified_column();
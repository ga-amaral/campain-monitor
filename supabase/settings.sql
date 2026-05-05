-- ========================================
-- SYSTEM SETTINGS TABLE (META API CREDENTIALS)
-- ========================================

CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meta_access_token TEXT,
    meta_ad_account_id TEXT, -- e.g., 'act_123456789'
    meta_app_secret TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Row Level Security
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow only authenticated admins to view/edit settings.
-- Or for internal dashboards without deep auth, allow service_role / anon:
CREATE POLICY "Allow select on settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Allow update on settings" ON public.settings FOR UPDATE USING (true);
CREATE POLICY "Allow insert on settings" ON public.settings FOR INSERT USING (true);

-- Insert a single default row so we can easily update it later
INSERT INTO public.settings (meta_access_token, meta_ad_account_id)
SELECT '', ''
WHERE NOT EXISTS (SELECT 1 FROM public.settings LIMIT 1);

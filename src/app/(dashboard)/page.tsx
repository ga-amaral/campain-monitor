import { createClient } from '@/lib/supabase-server';
import DashboardClient from '@/components/DashboardClient';

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select(`
      *,
      adsets (
        *,
        ads (*)
      )
    `)
    .order('spend', { ascending: false });

  const { data: settings } = await supabase
    .from('settings')
    .select('meta_ad_account_id')
    .limit(1)
    .single();

  const adAccountId = settings?.meta_ad_account_id?.replace('act_', '') || '';

  return (
    <main className="flex-1 p-8">
      <div className="max-w-7xl mx-auto">
        <DashboardClient initialCampaigns={campaigns || []} adAccountId={adAccountId} />
      </div>
    </main>
  );
}

import { createClient } from '@/lib/supabase-server';
import SettingsForm from '@/components/SettingsForm';

export const revalidate = 0;

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from('settings').select('meta_access_token, meta_ad_account_id, updated_at').limit(1).single();

  return (
    <main className="flex-1 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Configurações do Sistema</h1>
          <p className="text-sm text-slate-400 mt-1">Gerenciamento de integrações e segurança</p>
        </div>

        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Conexão Meta Ads API</h2>
            {settings?.meta_ad_account_id && settings?.meta_access_token && (
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-medium border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                Conectado
              </span>
            )}
          </div>
          
          <SettingsForm 
            initialToken={settings?.meta_access_token || ''} 
            initialAccountId={settings?.meta_ad_account_id || ''} 
          />
          
        </section>
      </div>
    </main>
  );
}

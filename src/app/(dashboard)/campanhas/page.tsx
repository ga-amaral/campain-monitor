import { createClient } from '@/lib/supabase-server';
import CampaignsTable from '@/components/CampaignsTable';

export const revalidate = 0;

export default async function CampanhasPage() {
  const supabase = await createClient();

  // Buscar Campanhas, Conjuntos e Anúncios para montar a árvore
  const { data: campaigns } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
  const { data: adsets } = await supabase.from('adsets').select('*').order('created_at', { ascending: false });
  const { data: ads } = await supabase.from('ads').select('*').order('created_at', { ascending: false });

  // Agrupar dados no servidor
  const treeData = (campaigns || []).map(camp => ({
    ...camp,
    adsets: (adsets || []).filter(set => set.campaign_id === camp.id).map(set => ({
      ...set,
      ads: (ads || []).filter(ad => ad.adset_id === set.id)
    }))
  }));

  return (
    <main className="flex-1 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Explorador de Campanhas</h1>
          <p className="text-sm text-slate-400 mt-1">Análise detalhada por hierarquia: Campanha &gt; Conjunto &gt; Anúncio</p>
        </div>

        <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <CampaignsTable initialData={treeData} />
        </section>
      </div>
    </main>
  );
}

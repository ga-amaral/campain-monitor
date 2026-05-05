import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    
    if (!start || !end) {
      return NextResponse.json({ error: 'Parâmetros start e end são obrigatórios' }, { status: 400 });
    }

    // Calcular período anterior equivalente (mesma quantidade de dias)
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const prevEndDate = new Date(startDate);
    prevEndDate.setDate(prevEndDate.getDate() - 1);
    
    const prevStartDate = new Date(prevEndDate);
    prevStartDate.setDate(prevStartDate.getDate() - diffDays + 1);

    const prevStartStr = prevStartDate.toISOString().split('T')[0];
    const prevEndStr = prevEndDate.toISOString().split('T')[0];

    const supabase = getServiceSupabase();

    // Buscar estruturas base
    const [{ data: campaignsRaw }, { data: adsetsRaw }, { data: adsRaw }] = await Promise.all([
      supabase.from('campaigns').select('id, name, status, objective'),
      supabase.from('adsets').select('id, campaign_id, name, status'),
      supabase.from('ads').select('id, adset_id, campaign_id, name, status')
    ]);

    // Buscar dados do período atual
    const { data: currentPeriod } = await supabase
      .from('metrics_history')
      .select('entity_type, entity_id, spend, impressions, clicks, leads')
      .gte('date', start)
      .lte('date', end);

    // Buscar dados do período anterior (para as tendências globais)
    const { data: previousPeriod } = await supabase
      .from('metrics_history')
      .select('entity_type, entity_id, spend, impressions, clicks, leads')
      .gte('date', prevStartStr)
      .lte('date', prevEndStr);

    const aggregate = (data: any[] | null, type: string) => {
      const res: Record<string, any> = {};
      (data || []).filter(d => d.entity_type === type).forEach(d => {
        if (!res[d.entity_id]) res[d.entity_id] = { spend: 0, impressions: 0, clicks: 0, leads: 0 };
        res[d.entity_id].spend += Number(d.spend) || 0;
        res[d.entity_id].impressions += Number(d.impressions) || 0;
        res[d.entity_id].clicks += Number(d.clicks) || 0;
        res[d.entity_id].leads += Number(d.leads) || 0;
      });
      return res;
    };

    const currentCamp = aggregate(currentPeriod, 'campaign');
    const currentAdSet = aggregate(currentPeriod, 'adset');
    const currentAd = aggregate(currentPeriod, 'ad');

    // Totais do Período Anterior para KPIs
    const prevCamp = aggregate(previousPeriod, 'campaign');
    const prevTotals = Object.values(prevCamp).reduce((acc, curr) => ({
      spend: acc.spend + curr.spend,
      leads: acc.leads + curr.leads
    }), { spend: 0, leads: 0 });

    const prevCpl = prevTotals.leads > 0 ? prevTotals.spend / prevTotals.leads : 0;

    // Construir árvore aninhada para o frontend
    const campaigns = (campaignsRaw || []).map(c => {
      const metrics = currentCamp[c.id] || { spend: 0, impressions: 0, clicks: 0, leads: 0 };
      
      const cAdsets = (adsetsRaw || []).filter(a => a.campaign_id === c.id).map(a => {
        const aMetrics = currentAdSet[a.id] || { spend: 0, impressions: 0, clicks: 0, leads: 0 };
        
        const aAds = (adsRaw || []).filter(ad => ad.adset_id === a.id).map(ad => {
          const adMetrics = currentAd[ad.id] || { spend: 0, impressions: 0, clicks: 0, leads: 0 };
          return { ...ad, ...adMetrics };
        });
        
        return { ...a, ...aMetrics, ads: aAds };
      });

      return { ...c, ...metrics, adsets: cAdsets };
    });

    return NextResponse.json({ 
      campaigns,
      previousTotals: {
        spend: prevTotals.spend,
        leads: prevTotals.leads,
        cpl: prevCpl
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar métricas agregadas:', error);
    return NextResponse.json({ error: 'Erro ao buscar métricas' }, { status: 500 });
  }
}

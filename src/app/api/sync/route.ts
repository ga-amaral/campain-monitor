import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// Helper para buscar todos os dados paginados do Meta API
async function fetchAllMetaPages(url: string) {
  let allData: any[] = [];
  let nextUrl = url;

  while (nextUrl) {
    const response = await fetch(nextUrl);
    const result = await response.json();

    if (result.error) {
      throw new Error(result.error.message);
    }

    if (result.data) {
      allData = [...allData, ...result.data];
    }

    // Paginação da Graph API
    nextUrl = result.paging?.next || null;
  }

  return allData;
}

export async function POST() {
  try {
    const supabase = getServiceSupabase();

    // 1. Buscar credenciais da tabela settings
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('meta_access_token, meta_ad_account_id')
      .limit(1)
      .single();

    if (settingsError || !settings) {
      return NextResponse.json({ error: 'Configurações do Meta não encontradas no banco.' }, { status: 400 });
    }

    const { meta_access_token, meta_ad_account_id } = settings;

    if (!meta_access_token || !meta_ad_account_id) {
      return NextResponse.json({ error: 'Token ou Ad Account ID ausentes nas configurações.' }, { status: 400 });
    }

    const baseUrl = `https://graph.facebook.com/v19.0/${meta_ad_account_id}`;
    const tokenParam = `&access_token=${meta_access_token}`;

    // 2. Fetch Campanhas e Insights
    const campaignsUrl = `${baseUrl}/campaigns?fields=id,name,status,objective${tokenParam}`;
    const campaigns = await fetchAllMetaPages(campaignsUrl);

    const insightsUrl = `${baseUrl}/insights?level=campaign&fields=campaign_id,spend,impressions,clicks,actions&date_preset=maximum${tokenParam}`;
    const insights = await fetchAllMetaPages(insightsUrl);

    // Mapear insights por campaign_id
    const insightsMap: Record<string, any> = {};
    insights.forEach(insight => {
      insightsMap[insight.campaign_id] = insight;
    });

    if (campaigns.length > 0) {
      const campaignsToInsert = campaigns.map(c => {
        const insight = insightsMap[c.id];
        const spend = insight ? parseFloat(insight.spend) : 0;
        const impressions = insight ? parseInt(insight.impressions) || 0 : 0;
        const clicks = insight ? parseInt(insight.clicks) || 0 : 0;
        
        // Procurar por 'Conversas Iniciadas' (WhatsApp/Messenger/Direct) nos actions do Meta
        let leads = 0;
        if (insight && insight.actions) {
          const convAction = insight.actions.find((act: any) => act.action_type.includes('messaging_conversation_started_7d') || act.action_type.includes('onsite_conversion.messaging_conversation_started_7d'));
          if (convAction) leads = parseInt(convAction.value);
        }

        return {
          id: c.id,
          name: c.name,
          status: c.status,
          objective: c.objective || null,
          spend: spend,
          impressions: impressions,
          clicks: clicks,
          leads: leads,
          updated_at: new Date().toISOString()
        };
      });
      const { error } = await supabase.from('campaigns').upsert(campaignsToInsert, { onConflict: 'id' });
      if (error) throw new Error(`Erro salvando campanhas: ${error.message}`);
    }

    // 3. Fetch AdSets (Conjuntos) e Insights
    const adsetsUrl = `${baseUrl}/adsets?fields=id,campaign_id,name,status,daily_budget${tokenParam}`;
    const adsets = await fetchAllMetaPages(adsetsUrl);
    
    const adsetsInsightsUrl = `${baseUrl}/insights?level=adset&fields=adset_id,spend,impressions,clicks,actions&date_preset=maximum${tokenParam}`;
    const adsetsInsights = await fetchAllMetaPages(adsetsInsightsUrl);
    
    const adsetsInsightsMap: Record<string, any> = {};
    adsetsInsights.forEach(insight => {
      adsetsInsightsMap[insight.adset_id] = insight;
    });

    if (adsets.length > 0) {
      const adsetsToInsert = adsets.map(a => {
        const insight = adsetsInsightsMap[a.id];
        const spend = insight ? parseFloat(insight.spend) : 0;
        const impressions = insight ? parseInt(insight.impressions) || 0 : 0;
        const clicks = insight ? parseInt(insight.clicks) || 0 : 0;
        
        // Procurar por 'Conversas Iniciadas' (WhatsApp/Messenger/Direct) nos actions do Meta
        let leads = 0;
        if (insight && insight.actions) {
          const convAction = insight.actions.find((act: any) => act.action_type.includes('messaging_conversation_started_7d') || act.action_type.includes('onsite_conversion.messaging_conversation_started_7d'));
          if (convAction) leads = parseInt(convAction.value);
        }

        return {
          id: a.id,
          campaign_id: a.campaign_id,
          name: a.name,
          status: a.status,
          daily_budget: a.daily_budget ? (parseFloat(a.daily_budget) / 100) : 0,
          spend: spend,
          impressions: impressions,
          clicks: clicks,
          leads: leads,
          updated_at: new Date().toISOString()
        };
      });
      const { error } = await supabase.from('adsets').upsert(adsetsToInsert, { onConflict: 'id' });
      if (error) throw new Error(`Erro salvando conjuntos: ${error.message}`);
    }

    // 4. Fetch Ads (Anúncios) e Insights
    const adsUrl = `${baseUrl}/ads?fields=id,adset_id,campaign_id,name,status${tokenParam}`;
    const ads = await fetchAllMetaPages(adsUrl);

    const adsInsightsUrl = `${baseUrl}/insights?level=ad&fields=ad_id,spend,impressions,clicks,actions&date_preset=maximum${tokenParam}`;
    const adsInsights = await fetchAllMetaPages(adsInsightsUrl);

    const adsInsightsMap: Record<string, any> = {};
    adsInsights.forEach(insight => {
      adsInsightsMap[insight.ad_id] = insight;
    });

    if (ads.length > 0) {
      const adsToInsert = ads.map(a => {
        const insight = adsInsightsMap[a.id];
        const spend = insight ? parseFloat(insight.spend) : 0;
        const impressions = insight ? parseInt(insight.impressions) || 0 : 0;
        const clicks = insight ? parseInt(insight.clicks) || 0 : 0;
        
        // Procurar por 'Conversas Iniciadas' (WhatsApp/Messenger/Direct) nos actions do Meta
        let leads = 0;
        if (insight && insight.actions) {
          const convAction = insight.actions.find((act: any) => act.action_type.includes('messaging_conversation_started_7d') || act.action_type.includes('onsite_conversion.messaging_conversation_started_7d'));
          if (convAction) leads = parseInt(convAction.value);
        }

        return {
          id: a.id,
          adset_id: a.adset_id,
          campaign_id: a.campaign_id,
          name: a.name,
          status: a.status,
          spend: spend,
          impressions: impressions,
          clicks: clicks,
          leads: leads, // Salvando as conversas na coluna 'leads' para reaproveitamento
          updated_at: new Date().toISOString()
        };
      });
      const { error } = await supabase.from('ads').upsert(adsToInsert, { onConflict: 'id' });
      if (error) throw new Error(`Erro salvando anúncios: ${error.message}`);
    }

    // 5. Fetch Daily Historical Data (last 30 days) for metrics_history
    const historyUrl = `${baseUrl}/insights?level=campaign&fields=campaign_id,spend,impressions,clicks,actions&date_preset=last_30d&time_increment=1${tokenParam}`;
    const historyData = await fetchAllMetaPages(historyUrl);

    if (historyData && historyData.length > 0) {
      const historyToInsert = historyData.map(insight => {
        const spend = parseFloat(insight.spend) || 0;
        const impressions = parseInt(insight.impressions) || 0;
        const clicks = parseInt(insight.clicks) || 0;
        
        let leads = 0;
        if (insight.actions) {
          const convAction = insight.actions.find((act: any) => act.action_type.includes('messaging_conversation_started_7d') || act.action_type.includes('onsite_conversion.messaging_conversation_started_7d'));
          if (convAction) leads = parseInt(convAction.value);
        }

        return {
          entity_type: 'campaign',
          entity_id: insight.campaign_id,
          date: insight.date_start,
          spend: spend,
          impressions: impressions,
          clicks: clicks,
          leads: leads,
        };
      });
      
      // We upsert using the unique constraint (entity_type, entity_id, date)
      // Supabase JS doesn't support multiple onConflict columns easily without specifying the constraint name,
      // but 'metrics_history_entity_type_entity_id_date_key' is the default name.
      const { error } = await supabase.from('metrics_history').upsert(historyToInsert, { onConflict: 'entity_type,entity_id,date' });
      if (error) {
        console.warn('Erro salvando histórico diário (campaign):', error.message);
      }
    }

    // 6. Fetch Daily Historical Data for AdSets
    const adsetHistoryUrl = `${baseUrl}/insights?level=adset&fields=adset_id,spend,impressions,clicks,actions&date_preset=last_30d&time_increment=1${tokenParam}`;
    const adsetHistoryData = await fetchAllMetaPages(adsetHistoryUrl);
    if (adsetHistoryData && adsetHistoryData.length > 0) {
      const historyToInsert = adsetHistoryData.map(insight => {
        let leads = 0;
        if (insight.actions) {
          const convAction = insight.actions.find((act: any) => act.action_type.includes('messaging_conversation_started_7d') || act.action_type.includes('onsite_conversion.messaging_conversation_started_7d'));
          if (convAction) leads = parseInt(convAction.value);
        }
        return {
          entity_type: 'adset',
          entity_id: insight.adset_id,
          date: insight.date_start,
          spend: parseFloat(insight.spend) || 0,
          impressions: parseInt(insight.impressions) || 0,
          clicks: parseInt(insight.clicks) || 0,
          leads: leads,
        };
      });
      await supabase.from('metrics_history').upsert(historyToInsert, { onConflict: 'entity_type,entity_id,date' });
    }

    // 7. Fetch Daily Historical Data for Ads
    const adHistoryUrl = `${baseUrl}/insights?level=ad&fields=ad_id,spend,impressions,clicks,actions&date_preset=last_30d&time_increment=1${tokenParam}`;
    const adHistoryData = await fetchAllMetaPages(adHistoryUrl);
    if (adHistoryData && adHistoryData.length > 0) {
      const historyToInsert = adHistoryData.map(insight => {
        let leads = 0;
        if (insight.actions) {
          const convAction = insight.actions.find((act: any) => act.action_type.includes('messaging_conversation_started_7d') || act.action_type.includes('onsite_conversion.messaging_conversation_started_7d'));
          if (convAction) leads = parseInt(convAction.value);
        }
        return {
          entity_type: 'ad',
          entity_id: insight.ad_id,
          date: insight.date_start,
          spend: parseFloat(insight.spend) || 0,
          impressions: parseInt(insight.impressions) || 0,
          clicks: parseInt(insight.clicks) || 0,
          leads: leads,
        };
      });
      await supabase.from('metrics_history').upsert(historyToInsert, { onConflict: 'entity_type,entity_id,date' });
    }

    return NextResponse.json({ 
      success: true, 
      message: `${campaigns.length} Campanhas, ${adsets.length} Conjuntos e ${ads.length} Anúncios sincronizados!` 
    });

  } catch (error: any) {
    console.error('Erro no endpoint de sync:', error);
    return NextResponse.json({ error: 'Erro na sincronização', details: error.message }, { status: 500 });
  }
}

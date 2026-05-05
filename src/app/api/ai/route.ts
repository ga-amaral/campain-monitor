import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getServiceSupabase } from '@/lib/supabase';

// Inicializar apenas se tiver chave
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function POST(req: Request) {
  try {
    if (!openai) {
      return NextResponse.json({ error: 'OPENAI_API_KEY não configurada no arquivo .env.local.' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const supabase = getServiceSupabase();
    let campaigns = [];

    if (body.campaigns && body.campaigns.length > 0) {
      campaigns = body.campaigns;
    } else {
      // Buscar campanhas ativas com dados de investimento e leads da tabela principal (lifetime)
      const { data } = await supabase
        .from('campaigns')
        .select('*, adsets(*, ads(*))')
        .eq('status', 'ACTIVE')
        .order('spend', { ascending: false });
      campaigns = data || [];
    }

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({ error: 'Nenhuma campanha ativa encontrada para análise.' }, { status: 400 });
    }

    // Filtrar apenas ativas, independentemente da origem dos dados
    const activeCampaigns = campaigns.filter((c: any) => c.status === 'ACTIVE');

    if (activeCampaigns.length === 0) {
      return NextResponse.json({ error: 'Nenhuma campanha ativa no período para análise.' }, { status: 400 });
    }

    // Simplificar os dados para reduzir o número de tokens no payload
    const simplifiedData = activeCampaigns.map((c: any) => ({
      name: c.name,
      spend: c.spend,
      impressions: c.impressions,
      clicks: c.clicks,
      conversas: c.leads,
      adsets: (c.adsets || []).map((s: any) => ({
        name: s.name,
        spend: s.spend,
        conversas: s.leads
      }))
    }));

    const systemPrompt = `Você é um Consultor de Negócios Sênior e Especialista em Aquisição de Clientes (Growth) focado exclusivamente no mercado jurídico e escritórios de advocacia no Brasil. 
Sua função é analisar as métricas atuais do Meta Ads do cliente e devolver um relatório cirúrgico, focado em lucro, identificação de gargalos de Custo por Conversa (CPL) e orientações práticas de remanejamento de verba.
Analise a performance financeira e faça indicações baseadas na nomenclatura das campanhas/conjuntos (criativo, copy ou público).
Use um tom corporativo, direto, focando no retorno financeiro (como se falasse com o sócio majoritário do escritório).
Formate a resposta em Markdown puro, sem firulas. Estruture obrigatoriamente em:
### 1. Diagnóstico Financeiro 💰
### 2. Onde Estamos Perdendo Dinheiro (Vazamentos) 🚨
### 3. Oportunidades de Escala e Recomendação de Criativos 🚀`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analise as seguintes métricas (em Reais) das minhas campanhas ativas no Meta Ads:\n${JSON.stringify(simplifiedData, null, 2)}` }
      ],
      max_completion_tokens: 5000,
    } as any);

    return NextResponse.json({ report: completion.choices[0].message.content });
  } catch (error: any) {
    console.error('Erro na API de IA:', error);
    return NextResponse.json({ error: 'Erro ao gerar relatório com IA.' }, { status: 500 });
  }
}

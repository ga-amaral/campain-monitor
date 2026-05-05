import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { meta_access_token, meta_ad_account_id } = await request.json();
    const supabase = getServiceSupabase();

    // Como garantimos no SQL que só existe 1 linha vazia, buscamos ela primeiro.
    const { data: existingSettings } = await supabase.from('settings').select('id').limit(1).single();

    if (existingSettings) {
      // Atualizar a linha existente
      const { error } = await supabase
        .from('settings')
        .update({ 
          meta_access_token, 
          meta_ad_account_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSettings.id);

      if (error) throw new Error(error.message);
    } else {
      // Inserir se não existir por algum motivo
      const { error } = await supabase
        .from('settings')
        .insert([{ 
          meta_access_token, 
          meta_ad_account_id,
          updated_at: new Date().toISOString()
        }]);

      if (error) throw new Error(error.message);
    }

    return NextResponse.json({ success: true, message: 'Configurações atualizadas com sucesso!' });
  } catch (error: any) {
    console.error('Erro ao salvar configurações:', error);
    return NextResponse.json({ error: 'Erro ao salvar configurações.' }, { status: 500 });
  }
}

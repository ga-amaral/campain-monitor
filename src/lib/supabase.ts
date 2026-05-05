import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente padrão para operações públicas / frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente com privilégios de Admin (Service Role) - APENAS PARA BACKEND / API ROUTES
// Usado para ignorar RLS e sincronizar dados pesados do Meta em background.
export const getServiceSupabase = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não está definido no .env');
  }
  return createClient(supabaseUrl, serviceKey);
};

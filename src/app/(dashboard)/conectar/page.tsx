'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { Cloud, CheckCircle, AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react';

interface AdAccount {
  id: string;
  account_id: string;
  account_name: string;
  is_active: boolean;
  created_at: string;
}

function ConectarContaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  
  const [newAccountId, setNewAccountId] = useState('');
  const [newAccessToken, setNewAccessToken] = useState('');

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const successParam = searchParams.get('success');
    
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
    if (successParam === 'true') {
      setSuccess(true);
    }
    
    fetchAdAccounts();
  }, [searchParams]);

  const fetchAdAccounts = async () => {
    const { data, error } = await supabase
      .from('ad_accounts')
      .select('id, account_id, account_name, is_active, created_at')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAdAccounts(data);
    }
    setLoadingAccounts(false);
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error: insertError } = await supabase
        .from('ad_accounts')
        .insert({
          user_id: user.id,
          platform: 'meta',
          account_id: newAccountId,
          account_name: `Conta ${newAccountId}`,
          access_token: newAccessToken,
          is_active: true,
        });

      if (insertError) throw insertError;

      setNewAccountId('');
      setNewAccessToken('');
      setSuccess(true);
      fetchAdAccounts();
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    const { error } = await supabase
      .from('ad_accounts')
      .delete()
      .eq('id', accountId);

    if (!error) {
      fetchAdAccounts();
    }
  };

  const handleTestToken = async (accountId: string, accessToken: string) => {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`
      );
      const data = await response.json();
      
      if (data.error) {
        alert(`Token inválido: ${data.error.message}`);
      } else {
        alert(`Token válido! Usuário: ${data.name}`);
      }
    } catch (err) {
      alert('Erro ao testar token');
    }
  };

  return (
    <main className="flex-1 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Conectar Conta Meta Ads</h1>
          <p className="text-sm text-slate-400 mt-1">Vincule sua conta de anúncios do Facebook/Instagram</p>
        </div>

        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400">
            <CheckCircle className="w-5 h-5" />
            <span>Conta adicionada com sucesso!</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
<div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Cloud className="w-5 h-5 text-white" />
              </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Adicionar Conta Meta</h2>
              <p className="text-sm text-slate-400">Informe o ID da conta e token de acesso</p>
            </div>
          </div>

          <form onSubmit={handleAddAccount} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                ID da Conta de Anúncios (act_XXXXXXX)
              </label>
              <input
                type="text"
                value={newAccountId}
                onChange={(e) => setNewAccountId(e.target.value)}
                placeholder="act_1234567890123456"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-slate-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Access Token (Long-lived recomendado)
              </label>
              <textarea
                value={newAccessToken}
                onChange={(e) => setNewAccessToken(e.target.value)}
                placeholder="Cole seu token de acesso aqui..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-slate-600 resize-none"
                required
              />
              <p className="text-xs text-slate-500 mt-2">
                Gere um token em: Meta for Developers → Marketing API → Tools
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !newAccountId || !newAccessToken}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Adicionar Conta
                </>
              )}
            </button>
          </form>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-white mb-4">Minhas Contas Conectadas</h2>
          
          {loadingAccounts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
            </div>
          ) : adAccounts.length === 0 ? (
            <p className="text-slate-400 text-center py-4">Nenhuma conta conectada</p>
          ) : (
            <div className="space-y-3">
              {adAccounts.map((account) => (
                <div 
                  key={account.id}
                  className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <Cloud className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">{account.account_name || account.account_id}</p>
                      <p className="text-sm text-slate-400">ID: {account.account_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {account.is_active ? (
                      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-xs">
                        Ativa
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-slate-600 text-slate-400 rounded text-xs">
                        Inativa
                      </span>
                    )}
                    <button
                      onClick={() => handleDisconnect(account.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                      title="Desconectar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Como obter o token:</h3>
          <ol className="text-sm text-slate-400 space-y-2 list-decimal list-inside">
            <li>Acesse <a href="https://developers.facebook.com/" target="_blank" className="text-blue-400 hover:underline">developers.facebook.com</a></li>
            <li>Crie ou selecione seu App</li>
            <li>Vá em Marketing API → Tools</li>
            <li>Selecione a conta de anúncios desejada</li>
            <li>Clique em "Get Token" e copie o token</li>
          </ol>
        </section>
      </div>
    </main>
  );
}

export default function ConectarContaPage() {
  return (
    <Suspense fallback={<div className="flex-1 p-8 text-slate-400">Carregando...</div>}>
      <ConectarContaContent />
    </Suspense>
  );
}
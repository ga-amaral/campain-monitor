'use client';

import { useState } from 'react';
import { Key, Save, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SettingsFormProps {
  initialToken: string;
  initialAccountId: string;
}

export default function SettingsForm({ initialToken, initialAccountId }: SettingsFormProps) {
  const [token, setToken] = useState(initialToken || '');
  const [accountId, setAccountId] = useState(initialAccountId || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const router = useRouter();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meta_access_token: token, meta_ad_account_id: accountId }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        router.refresh();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Falha de conexão ao salvar.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      
      {/* Alert Info */}
      <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-sm text-slate-300">
          <p className="font-medium text-blue-400 mb-1">Segurança de Dados</p>
          <p>Seu token é salvo diretamente no banco de dados isolado via backend. Ele nunca será exposto no navegador ou código-fonte. Recomendamos usar um Token de Usuário de Sistema (System User Token) sem expiração do Meta Business.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Meta Ads Access Token</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Key className="w-4 h-4 text-slate-500" />
            </div>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="EAAI..."
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-slate-700"
              required
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">Token gerado no Meta for Developers.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Ad Account ID</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 font-mono text-sm pointer-events-none">
              act_
            </span>
            <input
              type="text"
              value={accountId.replace(/^act_/, '')}
              onChange={(e) => setAccountId(`act_${e.target.value}`)}
              placeholder="1234567890123"
              className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-mono placeholder:text-slate-700"
              required
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">O ID da conta de anúncios que você quer monitorar (somente números).</p>
        </div>
      </div>

      {message.text && (
        <div className={`p-3 rounded-lg text-sm text-center font-medium ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          {message.text}
        </div>
      )}

      <div className="pt-4 border-t border-slate-800 flex justify-end">
        <button
          type="submit"
          disabled={loading || !token || !accountId}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>

    </form>
  );
}

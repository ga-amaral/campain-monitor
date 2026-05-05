'use client';

import { useState } from 'react';

export default function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSync = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMessage('✅ ' + data.message);
        // Recarregar a página para mostrar os novos dados do banco
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage('❌ Erro: ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Falha na conexão de sync.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button 
        onClick={handleSync}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md font-medium transition-colors"
      >
        {loading ? 'Sincronizando...' : 'Sincronizar Dados'}
      </button>
      {message && <span className="text-sm text-slate-400">{message}</span>}
    </div>
  );
}

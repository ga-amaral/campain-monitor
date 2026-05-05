'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, FileText, BrainCircuit, AlertTriangle, CheckCircle2, Download, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const presets = [
  { label: 'Todo Período', days: 0 },
  { label: 'Últimos 7 Dias', days: 7 },
  { label: 'Últimos 14 Dias', days: 14 },
  { label: 'Últimos 30 Dias', days: 30 },
  { label: 'Últimos 90 Dias', days: 90 },
];

export default function ReportsPage() {
  const [activePreset, setActivePreset] = useState<number | 'custom'>(0);
  const [customDate, setCustomDate] = useState({ start: '', end: '' });
  const [isDateOpen, setIsDateOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Carregar o relatório salvo assim que a página abrir
  React.useEffect(() => {
    const savedReport = localStorage.getItem('@monitor:lastAiReport');
    if (savedReport) {
      setReport(savedReport);
    }
  }, []);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      let campaignsPayload = null;

      // Se não for "Todo Período", buscamos os dados daquela data antes de enviar para a IA
      if (activePreset !== 0) {
        let startStr = '';
        let endStr = '';

        if (activePreset === 'custom') {
          if (!customDate.start || !customDate.end) {
            setError('Selecione as datas de início e fim para gerar o relatório.');
            setLoading(false);
            return;
          }
          startStr = customDate.start;
          endStr = customDate.end;
        } else {
          const end = new Date();
          const start = new Date();
          start.setDate(start.getDate() - (activePreset as number) + 1);

          startStr = start.toISOString().split('T')[0];
          endStr = end.toISOString().split('T')[0];
        }

        const metricsRes = await fetch(`/api/dashboard/metrics?start=${startStr}&end=${endStr}`, { cache: 'no-store' });
        const metricsData = await metricsRes.json();
        
        if (metricsData.campaigns) {
          campaignsPayload = metricsData.campaigns;
        }
      }

      const res = await fetch('/api/ai', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaigns: campaignsPayload })
      });
      
      const data = await res.json();
      if (res.ok) {
        setReport(data.report);
        localStorage.setItem('@monitor:lastAiReport', data.report);
      } else {
        setError(data.error || 'Erro desconhecido ao gerar o relatório.');
      }
    } catch (err) {
      setError('Falha de conexão com a API de Inteligência Artificial.');
    } finally {
      setLoading(false);
    }
  };

  const getActiveDateLabel = () => {
    if (activePreset === 0) return "Todo Período";
    if (activePreset === 'custom') {
      if (customDate.start && customDate.end) {
        const formatBR = (d: string) => d.split('-').reverse().join('/');
        return `${formatBR(customDate.start)} - ${formatBR(customDate.end)}`;
      }
      return "Data Customizada";
    }
    const preset = presets.find(p => p.days === activePreset);
    return preset ? preset.label : "Filtro de Data";
  };

  const downloadMarkdown = () => {
    if (!report) return;
    const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Consultoria-MetaAds-${dateStr}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="flex-1 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Page Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-purple-500" />
              Inteligência Artificial & Relatórios
            </h1>
            <p className="text-sm text-slate-400 mt-1">Consultoria autônoma focada em lucratividade na advocacia.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* DATE FILTER */}
            <div className="relative w-full sm:w-auto">
              <button 
                onClick={() => setIsDateOpen(!isDateOpen)}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 sm:py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-300 hover:text-white hover:border-slate-600 transition-colors shadow-lg"
              >
                <Calendar className="w-4 h-4 text-blue-500" />
                {getActiveDateLabel()}
              </button>
              
              {isDateOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-2 flex flex-col gap-1">
                    {presets.map(p => (
                      <button 
                        key={p.days}
                        onClick={() => { setActivePreset(p.days); setIsDateOpen(false); }}
                        className={cn(
                          "text-left px-3 py-2 text-sm rounded-lg transition-colors",
                          activePreset === p.days ? "bg-blue-600/20 text-blue-400" : "text-slate-300 hover:bg-slate-800"
                        )}
                      >
                        {p.label}
                      </button>
                    ))}

                    <div className="border-t border-slate-800 mt-2 pt-2">
                      <span className="px-3 text-xs text-slate-500 font-semibold mb-2 block">Período Customizado</span>
                      <div className="flex flex-col gap-2 px-2 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 w-6">De:</span>
                          <input 
                            type="date" 
                            value={customDate.start}
                            onChange={(e) => {
                              setCustomDate(prev => ({...prev, start: e.target.value}));
                              setActivePreset('custom');
                            }}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 w-6">Até:</span>
                          <input 
                            type="date" 
                            value={customDate.end}
                            onChange={(e) => {
                              setCustomDate(prev => ({...prev, end: e.target.value}));
                              setActivePreset('custom');
                            }}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={generateReport}
              disabled={loading}
              className={cn(
                "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg w-full sm:w-auto",
                loading 
                  ? "bg-slate-800 text-slate-400 cursor-not-allowed" 
                  : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-purple-900/50 hover:shadow-purple-900/80"
              )}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar Consultoria IA
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Handling */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-400">Falha na Análise</h3>
              <p className="text-sm text-red-300/80 mt-1">{error}</p>
              {error.includes('OPENAI_API_KEY') && (
                <p className="text-xs text-red-300 mt-2 font-mono bg-red-950/50 p-2 rounded">
                  Lembre-se de adicionar: OPENAI_API_KEY=sk-sua-chave no arquivo .env.local
                </p>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!report && !loading && !error && (
          <div className="p-16 border border-slate-800 border-dashed rounded-2xl bg-slate-900/50 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Seu Consultor Executivo está pronto</h2>
            <p className="text-slate-400 max-w-md">
              A IA vai cruzar os investimentos, os custos por conversa e os nomes das campanhas/anúncios para te dizer exatamente onde você está perdendo dinheiro e onde deve escalar a verba.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="p-8 border border-slate-800 rounded-2xl bg-slate-900 space-y-6 animate-pulse">
            <div className="h-6 bg-slate-800 rounded w-1/3"></div>
            <div className="space-y-3">
              <div className="h-4 bg-slate-800 rounded w-full"></div>
              <div className="h-4 bg-slate-800 rounded w-5/6"></div>
              <div className="h-4 bg-slate-800 rounded w-4/6"></div>
            </div>
            <div className="h-6 bg-slate-800 rounded w-1/4 mt-8"></div>
            <div className="space-y-3">
              <div className="h-4 bg-slate-800 rounded w-full"></div>
              <div className="h-4 bg-slate-800 rounded w-3/4"></div>
            </div>
          </div>
        )}

        {/* Report Result */}
        {report && !loading && (
          <div className="relative border border-purple-500/30 rounded-2xl bg-slate-900 overflow-hidden shadow-2xl shadow-purple-900/20">
            {/* Header decorativo */}
            <div className="h-2 w-full bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500" />
            
            <div className="p-8">
              <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/20 p-2 rounded-full">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Relatório Executivo de Alta Performance</h2>
                    <p className="text-xs text-slate-400">Gerado via OpenAI GPT-5.4-mini</p>
                  </div>
                </div>
                
                <button 
                  onClick={downloadMarkdown}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors border border-slate-700"
                  title="Baixar Arquivo Markdown"
                >
                  <Download className="w-4 h-4" />
                  Baixar Relatório
                </button>
              </div>

              <div className="prose prose-invert prose-purple max-w-none">
                <ReactMarkdown
                  components={{
                    h3: ({node, ...props}) => <h3 className="text-xl font-bold text-white mt-8 mb-4 flex items-center gap-2" {...props} />,
                    strong: ({node, ...props}) => <strong className="text-blue-400 font-bold" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-2 text-slate-300" {...props} />,
                    li: ({node, ...props}) => <li className="leading-relaxed" {...props} />
                  }}
                >
                  {report}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

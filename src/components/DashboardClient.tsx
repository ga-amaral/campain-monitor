'use client';

import React, { useState, useMemo, useEffect } from 'react';
import KpiCard from '@/components/KpiCard';
import { DollarSign, MessageCircle, BarChart3, TrendingUp, Layers, Filter, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import CampaignsTable from '@/components/CampaignsTable';

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  spend: number;
  leads: number;
  impressions: number;
  clicks: number;
  adsets?: any[];
}

const presets = [
  { label: 'Todo Período', days: 0 },
  { label: 'Últimos 7 Dias', days: 7 },
  { label: 'Últimos 14 Dias', days: 14 },
  { label: 'Últimos 30 Dias', days: 30 },
  { label: 'Últimos 90 Dias', days: 90 },
];

export default function DashboardClient({ initialCampaigns, adAccountId }: { initialCampaigns: Campaign[], adAccountId: string }) {
  const [activePreset, setActivePreset] = useState<number | 'custom'>(0);
  const [customDate, setCustomDate] = useState({ start: '', end: '' });
  
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [prevTotals, setPrevTotals] = useState({ spend: 0, leads: 0, cpl: 0 });
  const [loading, setLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);

  // Filtro de Campanhas
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Set initial selected after first load
  useEffect(() => {
    setSelectedIds(initialCampaigns.filter(c => c.status === 'ACTIVE').map(c => c.id));
  }, [initialCampaigns]);

  // Buscar dados agregados por data
  useEffect(() => {
    if (activePreset === 0) {
      setCampaigns(initialCampaigns);
      setPrevTotals({ spend: 0, leads: 0, cpl: 0 });
      return;
    }

    const fetchMetrics = async () => {
      setLoading(true);
      try {
        let startStr = '';
        let endStr = '';

        if (activePreset === 'custom') {
          if (!customDate.start || !customDate.end) {
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

        const res = await fetch(`/api/dashboard/metrics?start=${startStr}&end=${endStr}`, {
          cache: 'no-store'
        });
        const data = await res.json();
        
        if (data.campaigns) {
          setCampaigns(data.campaigns);
          setPrevTotals(data.previousTotals);
        }
      } catch (error) {
        console.error("Erro buscando métricas de data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [activePreset, customDate, initialCampaigns]);

  const toggleCampaign = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const selectAll = () => setSelectedIds(campaigns.map(c => c.id));
  const selectActive = () => setSelectedIds(campaigns.filter(c => c.status === 'ACTIVE').map(c => c.id));
  const clearSelection = () => setSelectedIds([]);

  const filteredCampaigns = campaigns.filter(c => selectedIds.includes(c.id));

  // Calcular KPIs Totais para o período ATUAL
  const totalSpend = filteredCampaigns.reduce((acc, curr) => acc + (Number(curr.spend) || 0), 0);
  const totalLeads = filteredCampaigns.reduce((acc, curr) => acc + (Number(curr.leads) || 0), 0);
  const cpl = totalLeads > 0 ? (totalSpend / totalLeads) : 0;
  const activeCount = filteredCampaigns.filter(c => c.status === 'ACTIVE').length;

  // Calcular TENDÊNCIAS
  const calcTrend = (current: number, previous: number, isPositiveGood: boolean) => {
    if (activePreset === 0 || previous === 0) return undefined;
    const diff = current - previous;
    const percentage = Math.round((diff / previous) * 100);
    return {
      value: percentage,
      label: `vs período anterior`,
      isPositiveGood
    };
  };

  const spendTrend = calcTrend(totalSpend, prevTotals.spend, false);
  const leadsTrend = calcTrend(totalLeads, prevTotals.leads, true);
  const cplTrend = calcTrend(cpl, prevTotals.cpl, false);

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

  return (
    <div className="space-y-8">
      {/* Top Bar with Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Visão Geral Executiva
            {loading && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
          </h1>
          <p className="text-sm text-slate-400 mt-1">Consolidado de métricas financeiras e performance global.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* DATE FILTER */}
          <div className="relative">
            <button 
              onClick={() => setIsDateOpen(!isDateOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-300 hover:text-white hover:border-slate-700 transition-colors whitespace-nowrap"
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

          {/* CAMPAIGN FILTER */}
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-white transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filtrar ({selectedIds.length})
            </button>
            
            {isFilterOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                  <span className="text-sm font-medium text-white">Selecione as Campanhas</span>
                </div>
                <div className="p-2 flex gap-2 border-b border-slate-800">
                  <button onClick={selectAll} className="flex-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded">Todas</button>
                  <button onClick={selectActive} className="flex-1 px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs rounded">Só Ativas</button>
                  <button onClick={clearSelection} className="flex-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded">Nenhuma</button>
                </div>
                <div className="max-h-60 overflow-y-auto p-2">
                  {campaigns.map(camp => (
                    <label key={camp.id} className="flex items-start gap-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(camp.id)}
                        onChange={() => toggleCampaign(camp.id)}
                        className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-600 focus:ring-offset-slate-900"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 truncate">{camp.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider",
                            camp.status === 'ACTIVE' ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"
                          )}>
                            {camp.status}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                  {campaigns.length === 0 && (
                    <p className="text-xs text-center p-4 text-slate-500">Nenhuma campanha encontrada.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global KPIs Section */}
      <section className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity duration-300", loading ? "opacity-50" : "opacity-100")}>
        <KpiCard 
          title="Investimento Total" 
          value={`R$ ${totalSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          icon={TrendingUp} 
          trend={spendTrend}
        />
        <KpiCard 
          title="Conversas (WhatsApp)" 
          value={totalLeads > 0 ? totalLeads.toString() : "0"} 
          icon={MessageCircle} 
          trend={leadsTrend}
        />
        <KpiCard 
          title="Custo por Conversa" 
          value={`R$ ${cpl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          icon={DollarSign} 
          trend={cplTrend}
        />
        <KpiCard 
          title="Campanhas Ativas" 
          value={activeCount.toString()} 
          icon={BarChart3} 
        />
      </section>

      {/* Data Table */}
      <section className={cn("bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl transition-opacity duration-300", loading ? "opacity-50" : "opacity-100")}>
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-500" />
            Top Campanhas por Investimento (Selecionadas)
          </h2>
        </div>
        <div className="p-0">
          <CampaignsTable initialData={filteredCampaigns.sort((a, b) => Number(b.spend) - Number(a.spend))} />
        </div>
      </section>
    </div>
  );
}

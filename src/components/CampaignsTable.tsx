'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Layers, Target, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CampaignsTable({ initialData }: { initialData: any[] }) {
  const [expandedCampaigns, setExpandedCampaigns] = useState<Record<string, boolean>>({});
  const [expandedAdSets, setExpandedAdSets] = useState<Record<string, boolean>>({});

  const toggleCampaign = (id: string) => {
    setExpandedCampaigns(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAdSet = (id: string) => {
    setExpandedAdSets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const isActive = status === 'ACTIVE';
    return (
      <span className={cn(
        "px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider border",
        isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800 text-slate-400 border-slate-700"
      )}>
        {status}
      </span>
    );
  };

  const formatCurrency = (val: number) => `R$ ${Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const formatNumber = (val: number) => Number(val || 0).toLocaleString('pt-BR');

  if (!initialData || initialData.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        Nenhum dado encontrado. Faça a sincronização primeiro.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left text-sm text-slate-300 min-w-[1000px]">
        <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-xs uppercase tracking-wider">
          <tr>
            <th className="p-4 font-medium w-8"></th>
            <th className="p-4 font-medium min-w-[250px]">Nome</th>
            <th className="p-4 font-medium text-center">Status</th>
            <th className="p-4 font-medium text-right">Gasto</th>
            <th className="p-4 font-medium text-right">Impr.</th>
            <th className="p-4 font-medium text-right">Cliques</th>
            <th className="p-4 font-medium text-right">Conversas</th>
            <th className="p-4 font-medium text-right">Custo/Conv.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {initialData.map((camp) => {
            const isCampExpanded = expandedCampaigns[camp.id];
            
            const campSpend = Number(camp.spend) || 0;
            const campLeads = Number(camp.leads) || 0;
            const campCpl = campLeads > 0 ? campSpend / campLeads : 0;

            return (
              <React.Fragment key={camp.id}>
                {/* CAMPAIGN ROW */}
                <tr 
                  className={cn("hover:bg-slate-800/30 transition-colors cursor-pointer group", isCampExpanded && "bg-slate-800/20")}
                  onClick={() => toggleCampaign(camp.id)}
                >
                  <td className="p-4">
                    {isCampExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 font-medium text-white group-hover:text-blue-400 transition-colors">
                      <Layers className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="truncate">{camp.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center"><StatusBadge status={camp.status} /></td>
                  <td className="p-4 text-right font-medium text-white">{formatCurrency(campSpend)}</td>
                  <td className="p-4 text-right">{formatNumber(camp.impressions)}</td>
                  <td className="p-4 text-right">{formatNumber(camp.clicks)}</td>
                  <td className="p-4 text-right font-medium text-blue-400">{formatNumber(campLeads)}</td>
                  <td className="p-4 text-right text-emerald-400">{formatCurrency(campCpl)}</td>
                </tr>

                {/* ADSETS ROWS (Drill-down) */}
                {isCampExpanded && camp.adsets.map((set: any) => {
                  const isSetExpanded = expandedAdSets[set.id];
                  
                  const setSpend = Number(set.spend) || 0;
                  const setLeads = Number(set.leads) || 0;
                  const setCpl = setLeads > 0 ? setSpend / setLeads : 0;

                  return (
                    <React.Fragment key={set.id}>
                      <tr 
                        className={cn("bg-slate-900/50 hover:bg-slate-800/40 transition-colors cursor-pointer", isSetExpanded && "bg-slate-800/30")}
                        onClick={() => toggleAdSet(set.id)}
                      >
                        <td className="p-4 pl-10">
                          {isSetExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-600" />}
                        </td>
                        <td className="p-4 text-slate-200">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-purple-400 shrink-0" />
                            <span className="truncate text-sm">{set.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center"><StatusBadge status={set.status} /></td>
                        <td className="p-4 text-right font-medium text-slate-200">{formatCurrency(setSpend)}</td>
                        <td className="p-4 text-right text-slate-400">{formatNumber(set.impressions)}</td>
                        <td className="p-4 text-right text-slate-400">{formatNumber(set.clicks)}</td>
                        <td className="p-4 text-right font-medium text-blue-400">{formatNumber(setLeads)}</td>
                        <td className="p-4 text-right text-emerald-400/80">{formatCurrency(setCpl)}</td>
                      </tr>

                      {/* ADS ROWS (Drill-down) */}
                      {isSetExpanded && set.ads.map((ad: any) => {
                        const adSpend = Number(ad.spend) || 0;
                        const adLeads = Number(ad.leads) || 0;
                        const adCpl = adLeads > 0 ? adSpend / adLeads : 0;

                        return (
                          <tr key={ad.id} className="bg-slate-950/30 hover:bg-slate-800/50 transition-colors">
                            <td className="p-4"></td>
                            <td className="p-4 pl-16 text-slate-400 text-xs">
                              <div className="flex items-center gap-2">
                                <Megaphone className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span className="truncate">{ad.name}</span>
                              </div>
                            </td>
                            <td className="p-4 text-center"><StatusBadge status={ad.status} /></td>
                            <td className="p-4 text-right text-slate-300">{formatCurrency(adSpend)}</td>
                            <td className="p-4 text-right text-slate-500">{formatNumber(ad.impressions)}</td>
                            <td className="p-4 text-right text-slate-500">{formatNumber(ad.clicks)}</td>
                            <td className="p-4 text-right text-blue-400/80">{formatNumber(adLeads)}</td>
                            <td className="p-4 text-right text-emerald-500/80">{formatCurrency(adCpl)}</td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

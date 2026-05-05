import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: number; // e.g., 15 for 15%, -5 for -5%
    label: string; // e.g., "vs último mês"
    isPositiveGood?: boolean; // Se true, + é verde. Se false (ex: CPL), + é vermelho.
  };
  className?: string;
}

export default function KpiCard({ title, value, icon: Icon, trend, className }: KpiCardProps) {
  // Configuração da cor da tendência
  let TrendIcon = Minus;
  let trendColor = 'text-slate-500';
  let bgTrendColor = 'bg-slate-500/10';

  if (trend) {
    if (trend.value > 0) {
      TrendIcon = TrendingUp;
      trendColor = trend.isPositiveGood !== false ? 'text-emerald-400' : 'text-red-400';
      bgTrendColor = trend.isPositiveGood !== false ? 'bg-emerald-400/10' : 'bg-red-400/10';
    } else if (trend.value < 0) {
      TrendIcon = TrendingDown;
      trendColor = trend.isPositiveGood !== false ? 'text-red-400' : 'text-emerald-400';
      bgTrendColor = trend.isPositiveGood !== false ? 'bg-red-400/10' : 'bg-emerald-400/10';
    }
  }

  return (
    <div className={cn("p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm flex flex-col", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        <div className="p-2 bg-slate-800/50 rounded-lg">
          <Icon className="w-4 h-4 text-slate-300" />
        </div>
      </div>
      
      <div className="mt-4 flex items-baseline gap-2">
        <h2 className="text-3xl font-bold text-white tracking-tight">{value}</h2>
      </div>

      {trend ? (
        <div className="mt-4 flex items-center gap-2 text-xs">
          <span className={cn("flex items-center gap-1 px-2 py-1 rounded-full font-medium", trendColor, bgTrendColor)}>
            <TrendIcon className="w-3 h-3" />
            {Math.abs(trend.value)}%
          </span>
          <span className="text-slate-500">{trend.label}</span>
        </div>
      ) : (
        <div className="mt-4 h-6" /> // Placeholder to keep height consistent
      )}
    </div>
  );
}

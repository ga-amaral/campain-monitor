'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase-browser';
import { 
  LayoutDashboard, 
  Megaphone, 
  Settings, 
  LogOut,
  BarChart3,
  Scale,
  Link2
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Campanhas', href: '/campanhas', icon: Megaphone },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
  { name: 'Conectar Conta', href: '/conectar', icon: Link2 },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold tracking-tight">Monitor Ads</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                  isActive 
                    ? "bg-blue-600/10 text-blue-400" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5",
                  isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
                )} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors group"
        >
          <LogOut className="w-5 h-5 text-slate-500 group-hover:text-red-400" />
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
}

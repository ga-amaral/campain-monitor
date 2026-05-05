'use client';

import { useState } from 'react';
import { Bell, Search, User, LogOut } from 'lucide-react';
import SyncButton from '@/components/SyncButton';
import { createClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
      
      {/* Search Bar */}
      <div className="flex-1 max-w-md hidden md:flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 transition-all">
        <Search className="w-4 h-4 text-slate-500" />
        <input 
          type="text" 
          placeholder="Buscar campanhas, métricas..." 
          className="bg-transparent border-none focus:outline-none text-sm text-slate-200 w-full placeholder:text-slate-600"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4 ml-auto">
        <SyncButton />
        
        <div className="h-8 w-px bg-slate-800 mx-1"></div>
        
        <button className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-900">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-slate-950"></span>
        </button>

        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 hover:border-slate-600 transition-colors"
          >
            <User className="w-4 h-4 text-slate-300" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-slate-900 border border-slate-700 rounded-lg shadow-lg overflow-hidden">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

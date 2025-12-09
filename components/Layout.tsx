import React from 'react';
import { User } from '../types';
import { Code2, LayoutDashboard, FolderKanban, LogOut, Moon, Sun, Plus } from 'lucide-react';
import { Button } from './ui/Button';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  onCreateProject?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, user, currentPage, onNavigate, onLogout, onCreateProject 
}) => {
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
  ];

  return (
    <div className="flex h-screen bg-dark-950 text-slate-200">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-brand-600 p-2 rounded-lg text-white">
            <Code2 size={20} />
          </div>
          <span className="font-bold text-lg tracking-tight">CodeReview AI</span>
        </div>

        <div className="p-4">
          <Button 
            variant="primary" 
            className="w-full justify-start mb-6" 
            icon={<Plus size={16} />}
            onClick={onCreateProject}
          >
            New Project
          </Button>

          <nav className="space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={clsx(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  currentPage === item.id 
                    ? "bg-slate-800 text-white" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                )}
              >
                <item.icon size={18} className={currentPage === item.id ? "text-brand-400" : "text-slate-500"} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto border-t border-slate-800 p-4">
           <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white">
               {user.name.charAt(0)}
             </div>
             <div className="overflow-hidden">
               <div className="font-medium text-sm truncate text-white">{user.name}</div>
               <div className="text-xs text-slate-500 truncate">{user.email}</div>
             </div>
           </div>
           <button 
             onClick={onLogout}
             className="flex items-center gap-2 text-xs text-slate-500 hover:text-red-400 transition-colors w-full"
           >
             <LogOut size={14} /> Sign Out
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-slate-800 bg-slate-900/30 backdrop-blur flex items-center justify-between px-6 shrink-0 md:hidden">
           <span className="font-bold">CodeReview AI</span>
           <button onClick={onLogout}><LogOut size={18} /></button>
        </header>
        <div className="flex-1 overflow-auto bg-dark-950">
          {children}
        </div>
      </main>
    </div>
  );
};

import { clsx } from 'clsx';

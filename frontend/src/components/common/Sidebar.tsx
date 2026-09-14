import React from 'react';
import { Home, DollarSign, Users, CheckSquare, LogOut } from 'lucide-react';
import logoBrideHub from '../../assets/logo.png'; 

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
    { id: 'fornecedores', label: 'Fornecedores', icon: Users },
    { id: 'tarefas', label: 'Tarefas', icon: CheckSquare },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <img src={logoBrideHub} alt="BrideHub Logo" className="w-15 h-15 object-contain" />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
            BrideHub
          </h1>
          <p className="text-xs text-slate-500 mt-1">Planejamento Inteligente</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-rose-50 text-rose-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
};
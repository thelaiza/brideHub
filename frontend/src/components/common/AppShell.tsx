import React from 'react';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: React.ReactNode;
  currentTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({ children, currentTab, onTabChange, onLogout }) => {
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar Lateral Desacoplada */}
      <Sidebar 
        currentTab={currentTab} 
        onTabChange={onTabChange} 
        onLogout={onLogout} 
      />

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
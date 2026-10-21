import { useState, useEffect } from 'react';
import { AppShell } from './components/common/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { FinanceiroPage } from './pages/FinanceiroPage';
import { FornecedoresPage } from './pages/FornecedoresPage';
import { TarefasPage } from './pages/TarefasPage';
import { LoginPage } from './pages/LoginPage';
import { TOKEN_KEY } from './services/api';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem(TOKEN_KEY);
  });

  const [currentTab, setCurrentTab] = useState<string>(() => {
    return localStorage.getItem('currentTab') || 'dashboard';
  });

  useEffect(() => {
    const titles: Record<string, string> = {
      dashboard: 'BrideHub',
      financeiro: 'Financeiro — BrideHub',
      fornecedores: 'Fornecedores — BrideHub',
      tarefas: 'Tarefas — BrideHub',
    };
    document.title = titles[currentTab] || 'BrideHub — Organização de Casamento';
  }, [currentTab]);

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    localStorage.setItem('currentTab', tab);
  };

  const handleLogin = (token?: string) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('currentTab');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <AppShell 
      currentTab={currentTab} 
      onTabChange={handleTabChange}
      onLogout={handleLogout}
    >
      {currentTab === 'dashboard' && <DashboardPage onNavigate={handleTabChange} />}
      {currentTab === 'financeiro' && <FinanceiroPage />}
      {currentTab === 'fornecedores' && <FornecedoresPage />}
      {currentTab === 'tarefas' && <TarefasPage />}
    </AppShell>
  );
}

export default App;
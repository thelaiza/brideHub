import { useState, useEffect } from 'react';
import { AppShell } from './components/common/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { FinanceiroPage } from './pages/FinanceiroPage';
import { FornecedoresPage } from './pages/FornecedoresPage';
import { TarefasPage } from './pages/TarefasPage';
import { LoginPage } from './pages/LoginPage';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard');

  useEffect(() => {
    const titles: Record<string, string> = {
      dashboard: 'BrideHub',
      financeiro: 'Financeiro — BrideHub',
      fornecedores: 'Fornecedores — BrideHub',
      tarefas: 'Tarefas — BrideHub',
    };
    document.title = titles[currentTab] || 'BrideHub — Organização de Casamento';
  }, [currentTab]);

  // Se não estiver logado, exibe a tela de login
  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <AppShell 
      currentTab={currentTab} 
      onTabChange={setCurrentTab}
      onLogout={() => setIsAuthenticated(false)}
    >
      {currentTab === 'dashboard' && <DashboardPage onNavigate={setCurrentTab} />}
      {currentTab === 'financeiro' && <FinanceiroPage />}
      {currentTab === 'fornecedores' && <FornecedoresPage />}
      {currentTab === 'tarefas' && <TarefasPage />}
    </AppShell>
  );
}

export default App;
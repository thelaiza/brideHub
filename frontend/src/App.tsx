import { useState, useEffect } from 'react';
import { AppShell } from './components/common/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { FinanceiroPage } from './pages/FinanceiroPage';
import { FornecedoresPage } from './pages/FornecedoresPage';
import { TarefasPage } from './pages/TarefasPage';

export function App() {
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

  return (
    <AppShell currentTab={currentTab} onTabChange={setCurrentTab}>
      {currentTab === 'dashboard' && <DashboardPage onNavigate={setCurrentTab} />}
      {currentTab === 'financeiro' && <FinanceiroPage />}
      {currentTab === 'fornecedores' && <FornecedoresPage />}
      {currentTab === 'tarefas' && <TarefasPage />}
    </AppShell>
  );
}

export default App;
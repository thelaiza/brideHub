import { useState, useEffect } from 'react';
import { AppShell } from './components/common/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { FinanceiroPage } from './pages/FinanceiroPage';
import { FornecedoresPage } from './pages/FornecedoresPage';
import { TarefasPage } from './pages/TarefasPage';
import { ConvidadosPage } from './pages/ConvidadosPage';
import { MesasPage } from './pages/MesasPage';
import { LoginPage } from './pages/LoginPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { TOKEN_KEY } from './services/api';

function extractResetToken(): string | null {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (window.location.pathname === '/redefinir-senha' && token) {
    window.history.replaceState({}, '', '/redefinir-senha');
    return token;
  }
  return null;
}

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem(TOKEN_KEY);
  });

  const [resetToken, setResetToken] = useState<string | null>(() => extractResetToken());

  const [currentTab, setCurrentTab] = useState<string>(() => {
    return localStorage.getItem('currentTab') || 'dashboard';
  });

  useEffect(() => {
    const titles: Record<string, string> = {
      dashboard: 'BrideHub',
      financeiro: 'Financeiro — BrideHub',
      fornecedores: 'Fornecedores — BrideHub',
      tarefas: 'Tarefas — BrideHub',
      convidados: 'Convidados — BrideHub',
      mesas: 'Mesas — BrideHub',
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

  const handleBackToLogin = () => {
    window.history.replaceState({}, '', '/');
    setResetToken(null);
  };

  if (resetToken) {
    return <ResetPasswordPage token={resetToken} onBackToLogin={handleBackToLogin} />;
  }

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
      {currentTab === 'convidados' && <ConvidadosPage />}
      {currentTab === 'mesas' && <MesasPage />}
    </AppShell>
  );
}

export default App;